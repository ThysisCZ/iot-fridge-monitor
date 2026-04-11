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
router.post('/api/auth/register', userController.registerUserController);
router.post('/api/auth/login', userController.loginUserController);
router.post('/api/auth/logout', authenticateToken, userController.logoutUserController);
router.get('/api/user/profile', authenticateToken, userController.getUserController);
router.get('/api/fridge/:fridgeId/rules/list', authenticateToken, ruleController.listRulesController);
router.post('/api/fridge/:fridgeId/rules/create', authenticateToken, ruleController.createRuleController);
router.get('/api/rule/:id', authenticateToken, ruleController.getRuleController);
router.patch('/api/rule/update/:id', authenticateToken, ruleController.updateRuleController);
router.delete('/api/rule/delete/:id', authenticateToken, ruleController.deleteRuleController);
router.get('/api/notification/list', authenticateToken, notificationController.listNotificationsController);
router.post('/api/measurement/ingest', measurementController.measurementIngestController);
router.get('/api/measurement/:id', measurementController.getMeasurementController);
router.get('/api/fridge/:fridgeId/measurement/list', measurementController.listMeasurementsController);

//export router
module.exports = router;
