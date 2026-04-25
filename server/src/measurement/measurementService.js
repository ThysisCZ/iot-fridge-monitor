const measurementModel = require('./measurementModel');
const monitorModel = require('../monitor/monitorModel');
const fridgeModel = require('../fridge/fridgeModel');
const ruleModel = require('../rule/ruleModel');
const notificationModel = require('../notification/notificationModel');
const thresholdViolationModel = require('../thresholdViolation/thresholdViolationModel');
const emailService = require('../email/emailService');
const mongoose = require('mongoose');

// 5, 15, 30 minutes or 1, 6, 12, 24 hours
const VALID_GRANULARITIES = [5, 15, 30, 60, 360, 720, 1440];

const createServiceError = (status, code, message) => {
    const error = new Error(message);
    error.status = status;
    error.code = code;
    return error;
};

// POST /measurement/ingest
module.exports.ingestMeasurement = (dtoIn, authenticatedUser) => {
    return new Promise((resolve, reject) => {

        if (!authenticatedUser || !authenticatedUser.gatewayId) {
            return reject({
                message: 'API key is required.',
                code: 'unauthorized'
            });
        }

        if (!dtoIn.monitorId || isNaN(dtoIn.batteryLevel) || isNaN(dtoIn.temperature) ||
            isNaN(dtoIn.humidity) || isNaN(dtoIn.illuminance) || !dtoIn.timestamp) {
            throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
        }

        if (dtoIn.temperature < -40 || dtoIn.temperature > 70 || dtoIn.humidity < 0 ||
            dtoIn.humidity > 100 || dtoIn.illuminance < 0 || dtoIn.illuminance > 10000) {
            return reject({
                message: 'Data contains out of bounds keys.',
                code: 'outOfBoundsKeys'
            });
        }

        let foundMonitor;
        let foundFridge;

        // verify fridge monitor connection
        monitorModel
            .findById(dtoIn.monitorId)
            .then((monitor) => {
                if (!monitor || !monitor.fridgeId) {
                    throw {
                        message: 'Fridge Monitor is not paired.',
                        code: 'monitorNotPaired'
                    };
                }

                foundMonitor = monitor;

                return fridgeModel.findById(monitor.fridgeId);
            })
            .then(async (fridge) => {
                if (!fridge) {
                    throw {
                        message: 'Fridge not found.',
                        code: 'fridgeNotFound'
                    };
                }

                foundFridge = fridge;

                // update monitor battery level
                await monitorModel.findByIdAndUpdate(dtoIn.monitorId, {
                    batteryLevel: dtoIn.batteryLevel,
                    lastSeen: new Date(),
                    status: 'active'
                });

                // save measurement data
                const newMeasurement = new measurementModel({
                    monitorId: dtoIn.monitorId,
                    fridgeId: foundMonitor.fridgeId,
                    batteryLevel: dtoIn.batteryLevel,
                    temperature: dtoIn.temperature,
                    humidity: dtoIn.humidity,
                    illuminance: dtoIn.illuminance,
                    timestamp: dtoIn.timestamp
                });

                return newMeasurement.save();
            })
            .then(async (savedMeasurement) => {

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

                            // check if this violation has already been notified
                            if (violation.notified === true) {
                                continue;
                            }

                            // check if duration threshold has been exceeded
                            const now = new Date();
                            const violationDurationSeconds = (now - violation.violationStart) / 1000;

                            if (violationDurationSeconds >= rule.durationThreshold) {
                                alertsTriggered.push(rule._id);

                                const memberIds = foundFridge.memberIds || [];

                                memberIds.forEach((userId) => {
                                    const newNotification = new notificationModel({
                                        userId: userId,
                                        fridgeId: foundMonitor.fridgeId,
                                        ruleId: rule._id,
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
                            measurementId: savedMeasurement._id,
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
                reject({
                    message: error,
                    code: 'storageFailed'
                });
            });
    });
};

// GET /measurement/:id
module.exports.getMeasurementById = (id, authenticatedUser) => {
    return new Promise((resolve, reject) => {

        if (!authenticatedUser || !authenticatedUser.id) {
            return reject({
                message: 'Access token required.',
                code: 'unauthorized'
            });
        }

        if (!id) {
            throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
        }

        measurementModel
            .findById(id)
            .then((measurement) => {
                if (!measurement) return reject({ message: 'Measurement not found.' });
                resolve(measurement);
            })
            .catch((err) => reject(err));
    });
};

const aggregateDataPoint = (dataPoint, dataPointStart) => {
    // calculate arithmetic mean for the graph data point
    const aggTemperature = dataPoint.reduce((sum, m) => sum + m.temperature, 0) / dataPoint.length;
    const aggHumidity = dataPoint.reduce((sum, m) => sum + m.humidity, 0) / dataPoint.length;
    const aggIlluminance = dataPoint.reduce((sum, m) => sum + m.illuminance, 0) / dataPoint.length;

    return {
        timestamp: new Date(dataPointStart).toISOString(),
        temperature: aggTemperature.toFixed(2),
        humidity: aggHumidity.toFixed(2),
        illuminance: aggIlluminance.toFixed(2)
    };
}

// GET /fridge/:fridgeId/measurement/list
module.exports.listMeasurements = (fridgeId, filters, authenticatedUser) => {
    return new Promise((resolve, reject) => {

        if (!authenticatedUser || !authenticatedUser.id) {
            return reject({
                message: 'Access token required.',
                code: 'unauthorized'
            });
        }

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
                    const startMs = new Date(filters.startDate).getTime();
                    const endMs = new Date(filters.endDate).getTime();

                    const aggregated = [];
                    let dataPoint = [];
                    let dataPointStart = null;

                    // loop through every expected data point
                    for (let currentSlot = startMs; currentSlot <= endMs; currentSlot += granularityMs) {

                        const dataPoint = measurements.filter(m => {
                            const mTime = new Date(m.createdAt).getTime();
                            return mTime >= currentSlot && mTime < currentSlot + granularityMs;
                        });

                        if (dataPoint.length > 0) {
                            aggregated.push(aggregateDataPoint(dataPoint, currentSlot));
                        } else {
                            // handle graph segment with missing data
                            aggregated.push({
                                timestamp: new Date(currentSlot).toISOString(),
                                temperature: null,
                                humidity: null,
                                illuminance: null
                            });
                        }
                    }

                    // handle last data point
                    if (dataPoint.length > 0) {
                        aggregated.push(aggregateDataPoint(dataPoint, dataPointStart));
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
                    code: 'measurementsLoadFailed'
                });
            });
    });
};