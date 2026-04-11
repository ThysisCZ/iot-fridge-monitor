const measurementService = require('./measurementService');

// POST /measurement/ingest
const measurementIngestController = async (req, res) => {
    measurementService
        .ingestMeasurement(req.body)
        .then((result) => {
            res.status(201).json(result);
        })
        .catch((error) => {
            let statusCode = 500;

            if (error.code === 'outOfBoundsKeys' || error.code === 'monitorNotPaired') {
                statusCode = 400;
            } else if (error.code === 'storageFailed') {
                statusCode = 503;
            }
            res.status(statusCode).json({
                message: error.message,
                code: error.code,
                param: error.param,
            });
        });
};

// GET /measurement/:id
const getMeasurementController = async (req, res) => {
    measurementService
        .getMeasurementById(req.params.id)
        .then((measurement) => {
            res.status(200).json(measurement);
        })
        .catch((error) => {
            res.status(404).json(error);
        });
};

// GET /fridge/:fridgeId/measurement/list
const listMeasurementsController = async (req, res) => {
    const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        granularity: req.query.granularity ? Number(req.query.granularity) : null
    };

    measurementService
        .listMeasurements(req.params.fridgeId, filters)
        .then((result) => {
            res.status(200).json(result);
        })
        .catch((error) => {
            res.status(400).json(error);
        });
};

module.exports = {
    measurementIngestController,
    getMeasurementController,
    listMeasurementsController
}
