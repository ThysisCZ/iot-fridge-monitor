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

module.exports = {
    registerGatewayController
};