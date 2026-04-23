//dependencies
const monitorService = require('./monitorService');

const listMonitorsController = async (req, res) => {
    try {
        const dtoOut = await monitorService.listMonitors(req.params.gatewayId, req.user);
        return res.status(200).send(dtoOut);
    } catch (error) {
        return res.status(error.status || 500).send({
            code: error.code || 'internalServerError',
            message: error.message || 'Unexpected server error.'
        });
    }
};

const getMonitorController = async (req, res) => {
    try {
        const dtoOut = await monitorService.getMonitor(req.params.id, req.user);
        return res.status(200).send(dtoOut);
    } catch (error) {
        return res.status(error.status || 500).send({ code: error.code, message: error.message });
    }
};

const updateMonitorController = async (req, res) => {
    try {
        const dtoOut = await monitorService.updateMonitor(req.params.id, req.body, req.user);
        return res.status(200).send(dtoOut);
    } catch (error) {
        return res.status(error.status || 500).send({ code: error.code, message: error.message });
    }
};

const addFridgeController = async (req, res) => {
    try {
        const { monitorId, fridgeId } = req.params;
        const dtoOut = await monitorService.addFridge(monitorId, fridgeId, req.user);
        return res.status(200).send(dtoOut);
    } catch (error) {
        return res.status(error.status || 500).send({ code: error.code, message: error.message });
    }
};

const removeFridgeController = async (req, res) => {
    try {
        const { monitorId, fridgeId } = req.params;
        const dtoOut = await monitorService.removeFridge(monitorId, fridgeId, req.user);
        return res.status(200).send(dtoOut);
    } catch (error) {
        return res.status(error.status || 500).send({
            code: error.code || 'internalServerError',
            message: error.message
        });
    }
};

const deleteMonitorController = async (req, res) => {
    try {
        const dtoOut = await monitorService.deleteMonitor(req.params.id, req.user);
        return res.status(200).send(dtoOut);
    } catch (error) {
        return res.status(error.status || 500).send({ code: error.code, message: error.message });
    }
};

module.exports = {
    listMonitorsController,
    getMonitorController,
    updateMonitorController,
    addFridgeController,
    removeFridgeController,
    deleteMonitorController
};