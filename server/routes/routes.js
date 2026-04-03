//dependencies
const express = require('express');
const userController = require('../src/user/userController');
const gatewayController = require('../src/gateway/gatewayController');
const monitorController = require('../src/monitor/monitorController');
const fridgeController = require('../src/fridge/fridgeController');
const measurementController = require('../src/measurement/measurementController');
const ruleController = require('../src/rule/ruleController');
const notificationController = require('../src/notification/notificationController');
const { authenticateToken } = require('../src/middleware/authMiddleware');

//initialize router
const router = express.Router();

//routes for HTTP requests

//export router
module.exports = router;