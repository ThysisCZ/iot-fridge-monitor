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
router.route('/api/auth/register').post(userController.registerUserController);
router.route('/api/auth/login').post(userController.loginUserController);
router.route('/api/auth/logout').post(authenticateToken, userController.logoutUserController);
router.route('/api/user/profile').get(authenticateToken, userController.getUserController);

//export router
module.exports = router;