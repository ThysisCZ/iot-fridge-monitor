const measurementModel = require('./measurementModel');
const monitorModel = require('../monitor/monitorModel');
const ruleModel = require('../rule/ruleModel');
const notificationModel = require('../notification/notificationModel');

// POST /ingest/measurement
module.exports.ingestMeasurement = (dtoIn) => {
    return new Promise((resolve, reject) => {
        // Logical bounds check
        const { temperature, humidity, illuminance, monitorId } = dtoIn;
        if (temperature < -40 || temperature > 70 || humidity < 0 || humidity > 100 || illuminance < 0 || illuminance > 10000) {
            return reject({
                message: 'Data contains out of bounds keys.',
                code: 'outOfBoundsKeys',
                param: { monitorId, temperature, humidity, illuminance },
            });
        }

        let foundMonitor;

        // Verify Fridge Monitor connection
        monitorModel
            .findById(monitorId)
            .then((monitor) => {
                if (!monitor || !monitor.fridgeId) {
                    throw {
                        message: 'Fridge Monitor is not paired',
                        code: 'monitorNotPaired',
                        param: { monitorId },
                    };
                }
                foundMonitor = monitor;

                // Save Measurement Data
                const newMeasurement = new measurementModel({
                    monitorId: monitorId,
                    fridgeId: monitor.fridgeId,
                    temperature,
                    humidity,
                    illuminance,
                });

                return newMeasurement.save();
            })
            .then((savedMeasurement) => {
                // Iteration over rules
                return ruleModel.find({ fridgeId: foundMonitor.fridgeId }).then((rules) => {
                    const alertsTriggered = [];
                    const notificationPromises = [];

                    rules.forEach((rule) => {
                        const currentValue = dtoIn[rule.sensorType];

                        if (currentValue !== undefined) {
                            //Threshold Violated
                            if (currentValue > rule.maxThreshold || currentValue < rule.minThreshold) {
                                alertsTriggered.push(rule.id);

                                // Create Notification record
                                const newNotification = new notificationModel({
                                    fridgeId: foundMonitor.fridgeId,
                                    ruleId: rule.id,
                                    message: `Alert: ${rule.sensorType} is ${currentValue} (Limit: ${rule.minThreshold}-${rule.maxThreshold})`
                                });
                                notificationPromises.push(newNotification.save());
                            }
                        }
                    });

                    // Wait for all notifications to be saved
                    return Promise.all(notificationPromises).then(() => {
                        return {
                            measurementId: savedMeasurement.id,
                            fridgeId: foundMonitor.fridgeId,
                            alertsTriggered,
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
