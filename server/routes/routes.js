//dependencies
const express = require('express');
const userController = require('../src/user/userController');
const gatewayController = require('../src/gateway/gatewayController');
const monitorController = require('../src/monitor/monitorController');
const fridgeController = require('../src/fridge/fridgeController');
const measurementController = require('../src/measurement/measurementController');
const ruleController = require('../src/rule/ruleController');
const notificationController = require('../src/notification/notificationController');
const { authenticateToken, authenticateApiKey } = require('../src/middleware/authMiddleware');

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
router.post('/api/measurement/ingest', authenticateApiKey, measurementController.measurementIngestController);
router.get('/api/measurement/:id', authenticateToken, measurementController.getMeasurementController);
router.get('/api/fridge/:fridgeId/measurement/list', authenticateToken, measurementController.listMeasurementsController);
router.post('/api/gateway/register', authenticateToken, gatewayController.registerGatewayController);
router.get('/api/gateway/list', authenticateToken, gatewayController.listGatewaysController);
router.get('/api/gateway/:id', authenticateToken, gatewayController.getGatewayController);
router.patch('/api/gateway/update/:id', authenticateToken, gatewayController.updateGatewayController);
router.delete('/api/gateway/delete/:id', authenticateToken, gatewayController.deleteGatewayController);
router.post('/api/gateway/:gatewayId/monitor/create', authenticateToken, monitorController.createMonitorController);
router.get('/api/gateway/:gatewayId/monitor/list', authenticateToken, monitorController.listMonitorsController);
router.get('/api/monitor/:id', authenticateToken, monitorController.getMonitorController);
router.patch('/api/monitor/:monitorId/addFridge/:fridgeId', authenticateToken, monitorController.addFridgeController);
router.patch('/api/monitor/:monitorId/removeFridge', authenticateToken, monitorController.removeFridgeController);
router.delete('/api/monitor/delete/:id', authenticateToken, monitorController.deleteMonitorController);

router.post('/api/fridge/create', authenticateToken, fridgeController.createFridgeController);
router.get('/api/fridge/:id', authenticateToken, fridgeController.getFridgeController);
router.patch('/api/fridge/:id', authenticateToken, fridgeController.updateFridgeController);
router.delete('/api/fridge/:id', authenticateToken, fridgeController.deleteFridgeController);

//export router
module.exports = router;
