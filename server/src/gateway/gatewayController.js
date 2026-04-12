//dependencies
const gatewayService = require('./gatewayService');

const registerGatewayController = async (req, res) => {
    try {
        const dtoOut = await gatewayService.registerGateway(req.body, req.user);

        return res.status(201).send(dtoOut);
    } catch (error) {
        return res.status(error.status || 500).send({
            code: error.code || 'internalServerError',
            message: error.message || 'Unexpected server error.'
        });
    }
};

const listGatewaysController = async (req, res) => {
    try {
        const dtoOut = await gatewayService.listGateways(req.user);

        return res.status(200).send(dtoOut);
    } catch (error) {
        return res.status(error.status || 500).send({
            code: error.code || 'internalServerError',
            message: error.message || 'Unexpected server error.'
        });
    }
};

const getGatewayController = async (req, res) => {
    try {
        const dtoOut = await gatewayService.getGateway(req.params.id, req.user);

        return res.status(200).send(dtoOut);
    } catch (error) {
        return res.status(error.status || 500).send({
            code: error.code || 'internalServerError',
            message: error.message || 'Unexpected server error.'
        });
    }
};

const updateGatewayController = async (req, res) => {
    try {
        const dtoOut = await gatewayService.updateGateway(req.params.id, req.body, req.user);

        return res.status(200).send(dtoOut);
    } catch (error) {
        return res.status(error.status || 500).send({
            code: error.code || 'internalServerError',
            message: error.message || 'Unexpected server error.'
        });
    }
};

const deleteGatewayController = async (req, res) => {
    try {
        const dtoOut = await gatewayService.deleteGateway(req.params.id, req.user);

        return res.status(200).send(dtoOut);
    } catch (error) {
        return res.status(error.status || 500).send({
            code: error.code || 'internalServerError',
            message: error.message || 'Unexpected server error.'
        });
    }
};

module.exports = {
    registerGatewayController,
    listGatewaysController,
    getGatewayController,
    updateGatewayController,
    deleteGatewayController
};