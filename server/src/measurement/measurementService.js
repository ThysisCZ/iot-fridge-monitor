const measurementModel = require('./measurementModel');
const monitorModel = require('../monitor/monitorModel');
const fridgeModel = require('../fridge/fridgeModel');
const ruleModel = require('../rule/ruleModel');
const notificationModel = require('../notification/notificationModel');
const thresholdViolationModel = require('../thresholdViolation/thresholdViolationModel');
const emailService = require('../email/emailService');

// 5, 15, 30 minutes or 1, 6, 12, 24 hours
const VALID_GRANULARITIES = [5, 15, 30, 60, 360, 720, 1440];

// POST /measurement/ingest
module.exports.ingestMeasurement = (dtoIn) => {
    return new Promise((resolve, reject) => {

        // logical bounds check
        const { temperature, humidity, illuminance, monitorId } = dtoIn;

        if (temperature < -40 || temperature > 70 || humidity < 0 || humidity > 100 || illuminance < 0 || illuminance > 10000) {
            return reject({
                message: 'Data contains out of bounds keys.',
                code: 'outOfBoundsKeys',
                param: { monitorId, temperature, humidity, illuminance },
            });
        }

        let foundMonitor;
        let foundFridge;

        // verify fridge monitor connection
        monitorModel
            .findById(monitorId)
            .then((monitor) => {
                if (!monitor || !monitor.fridgeId) {
                    throw {
                        message: 'Fridge Monitor is not paired.',
                        code: 'monitorNotPaired',
                        param: { monitorId },
                    };
                }

                foundMonitor = monitor;

                return fridgeModel.findById(monitor.fridgeId);
            })
            .then((fridge) => {
                if (!fridge) {
                    throw {
                        message: 'Fridge not found.',
                        code: 'fridgeNotFound',
                        param: { fridgeId: foundMonitor.fridgeId },
                    };
                }

                foundFridge = fridge;

                // save measurement data
                const newMeasurement = new measurementModel({
                    monitorId: monitorId,
                    fridgeId: foundMonitor.fridgeId,
                    temperature,
                    humidity,
                    illuminance,
                });

                return newMeasurement.save();
            })
            .then((savedMeasurement) => {

                // fetch only active rules for this fridge
                return ruleModel.find({ fridgeId: foundMonitor.fridgeId, isActive: true }).then(async (rules) => {
                    const alertsTriggered = [];
                    const notificationPromises = [];

                    for (const rule of rules) {
                        const currentValue = dtoIn[rule.sensorType];

                        if (currentValue === undefined) continue;

                        const isViolated = currentValue > rule.maxThreshold || currentValue < rule.minThreshold;

                        if (isViolated) {

                            let violation = await thresholdViolationModel.findOne({ ruleId: rule._id, fridgeId: foundMonitor.fridgeId });

                            if (!violation) {
                                violation = await thresholdViolationModel.create({
                                    ruleId: rule._id,
                                    fridgeId: foundMonitor.fridgeId,
                                    violationStart: new Date()
                                });
                            }

                            // check if duration threshold has been exceeded
                            const now = new Date();
                            const violationDurationSeconds = (now - violation.violationStart) / 1000;

                            if (violationDurationSeconds >= rule.durationThreshold) {
                                alertsTriggered.push(rule.id);

                                const memberIds = foundFridge.memberIds || [];

                                memberIds.forEach((userId) => {
                                    const newNotification = new notificationModel({
                                        userId: userId,
                                        fridgeId: foundMonitor.fridgeId,
                                        ruleId: rule.id,
                                        message: `Alert: ${rule.sensorType} is ${currentValue} (Limit: ${rule.minThreshold}-${rule.maxThreshold})`
                                    });

                                    // send email
                                    notificationPromises.push(
                                        newNotification.save().then(() => {
                                            return emailService.sendAlertEmail(userId, rule.sensorType, currentValue, rule.minThreshold, rule.maxThreshold);
                                        })
                                    );
                                });

                                // mark violation as notified
                                await thresholdViolationModel.findOneAndUpdate(
                                    { ruleId: rule._id, fridgeId: foundMonitor.fridgeId },
                                    { notified: true }
                                );
                            }
                        } else {

                            // threshold no longer violated
                            await thresholdViolationModel.deleteOne({ ruleId: rule._id, fridgeId: foundMonitor.fridgeId });
                        }
                    }

                    // wait for all notifications to be saved and emails sent
                    return Promise.all(notificationPromises).then(() => {
                        return {
                            measurementId: savedMeasurement.id,
                            fridgeId: foundMonitor.fridgeId,
                            alertsTriggered
                        };
                    });
                });
            })
            .then((result) => {
                resolve(result);
            })
            .catch((error) => {
                if (error.name === 'MongoError' || error.name === 'ValidationError') {
                    reject({
                        message: 'Failed to store measurement data to the database.',
                        code: 'storageFailed',
                        param: { timestamp: new Date(), cause: error.message },
                    });
                } else {
                    reject(error);
                }
            });
    });
};

// GET /measurement/:id
module.exports.getMeasurementById = (id) => {
    return new Promise((resolve, reject) => {
        measurementModel
            .findById(id)
            .then((measurement) => {
                if (!measurement) return reject({ message: 'Measurement not found.' });
                resolve(measurement);
            })
            .catch((err) => reject(err));
    });
};

// GET /fridge/:fridgeId/measurement/list
module.exports.listMeasurements = (fridgeId, filters) => {
    return new Promise((resolve, reject) => {

        if (!mongoose.Types.ObjectId.isValid(fridgeId)) {
            return reject({ message: 'Invalid fridge ID.', code: 'invalidDtoIn' });
        }

        // build date range query
        const query = { fridgeId: fridgeId };

        if (filters.startDate || filters.endDate) {
            query.createdAt = {};

            if (filters.startDate) {
                const start = new Date(filters.startDate);

                if (isNaN(start.getTime())) {
                    return reject({ message: 'Invalid start date.', code: 'invalidDtoIn' });
                }

                query.createdAt.$gte = start;
            }

            if (filters.endDate) {
                const end = new Date(filters.endDate);

                if (isNaN(end.getTime())) {
                    return reject({ message: 'Invalid end date.', code: 'invalidDtoIn' });
                }

                query.createdAt.$lte = end;
            }
        }

        if (filters.granularity && !VALID_GRANULARITIES.includes(filters.granularity)) {
            return reject({ message: 'Invalid granularity value.', code: 'invalidDtoIn' });
        }

        measurementModel
            .find(query)
            .sort({ createdAt: 1 })
            .then((measurements) => {

                // apply granularity aggregation if specified
                if (filters.granularity) {
                    const granularityMs = filters.granularity * 60 * 1000;
                    const aggregated = [];
                    let bucket = [];
                    let bucketStart = null;

                    measurements.forEach((measurement) => {
                        const measurementTime = new Date(measurement.createdAt).getTime();

                        if (bucketStart === null) {
                            bucketStart = measurementTime;
                        }

                        if (measurementTime - bucketStart < granularityMs) {
                            bucket.push(measurement);
                        } else {
                            if (bucket.length > 0) {

                                // calculate arithmetic mean for the bucket
                                aggregated.push({
                                    timestamp: new Date(bucketStart).toISOString(),
                                    temperature: bucket.reduce((sum, m) => sum + m.temperature, 0) / bucket.length,
                                    humidity: bucket.reduce((sum, m) => sum + m.humidity, 0) / bucket.length,
                                    illuminance: bucket.reduce((sum, m) => sum + m.illuminance, 0) / bucket.length,
                                });
                            }

                            bucket = [measurement];
                            bucketStart = measurementTime;
                        }
                    });

                    // handle last bucket
                    if (bucket.length > 0) {
                        aggregated.push({
                            timestamp: new Date(bucketStart).toISOString(),
                            temperature: bucket.reduce((sum, m) => sum + m.temperature, 0) / bucket.length,
                            humidity: bucket.reduce((sum, m) => sum + m.humidity, 0) / bucket.length,
                            illuminance: bucket.reduce((sum, m) => sum + m.illuminance, 0) / bucket.length,
                        });
                    }

                    return resolve({ itemList: aggregated });
                }

                resolve({
                    itemList: measurements.map((m) => m.toJSON())
                });
            })
            .catch((err) => {
                reject({
                    message: 'Failed to load measurements.',
                    code: 'measurementsLoadFailed',
                    param: { cause: err.message }
                });
            });
    });
};