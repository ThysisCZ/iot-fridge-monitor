//dependencies
const express = require('express');
const userController = require('../src/user/userController');
const gatewayController = require('../src/gateway/gatewayController');
const monitorController = require('../src/monitor/monitorController');
const fridgeController = require('../src/fridge/fridgeController');
const measurementController = require('../src/measurement/measurementController');
const ruleController = require('../src/rule/ruleController');
const notificationController = require('../src/notification/notificationController');

//initialize router
const router = express.Router();

//routes for HTTP requests
router.route('/auth/register').post(userController.registerUserController);
router.route('/auth/login').post(userController.loginUserController);
router.route('/auth/logout').post(userController.logoutUserController);
router.route('/user/profile').get(userController.getUserController);

//export router
module.exports = router;