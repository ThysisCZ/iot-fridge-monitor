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
router.get('/api/fridge/:fridgeId/rules/list', authenticateToken, ruleController.listRules);
router.post('/api/fridge/:fridgeId/rules/create', authenticateToken, ruleController.createRule);
router.get('/api/rule/:id', authenticateToken, ruleController.getRule);
router.patch('/api/rule/update/:id', authenticateToken, ruleController.updateRule);
router.delete('/api/rule/delete/:id', authenticateToken, ruleController.deleteRule);
router.get('/api/notification/list', authenticateToken, notificationController.listNotifications);
router.post('/api/measurement/ingest', measurementController.measurementIngestController);
router.get('/api/measurement/:id', measurementController.getMeasurementController);

//export router
module.exports = router;
