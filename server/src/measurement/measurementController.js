const measurementService = require('./measurementService');

// POST /measurement/ingest
module.exports.measurementIngestController = (req, res) => {
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
module.exports.getMeasurementController = (req, res) => {
  measurementService
    .getMeasurementById(req.params.id)
    .then((measurement) => {
      res.status(200).json(measurement);
    })
    .catch((error) => {
      res.status(404).json(error);
    });
};
