//dependencies
const gatewayModel = require('./gatewayModel');
const crypto = require('crypto');

const createServiceError = (status, code, message) => {
    const error = new Error(message);
    error.status = status;
    error.code = code;
    return error;
};

// generate an API Key
const generateApiKey = () => {
    return crypto.randomBytes(16).toString('hex');
};

const registerGateway = async (dtoIn, authenticatedUser) => {
    if (!authenticatedUser || !authenticatedUser.id) {
        throw createServiceError(401, 'unauthorized', 'Access token required.');
    }

    if (!dtoIn.name || dtoIn.name.length < 1 || dtoIn.name.length > 20) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    try {
        const newGatewayData = {
            ownerId: authenticatedUser.id,
            name: dtoIn.name,
            apiKey: generateApiKey(),
            status: 'active',
            lastSeen: new Date()
        };

        const gateway = new gatewayModel(newGatewayData);
        const savedGateway = await gateway.save();

        const dtoOut = savedGateway.toJSON();
        dtoOut.lastSeen = dtoOut.lastSeen.toISOString();

        return dtoOut;
    } catch (error) {
        throw createServiceError(500, 'registrationFailed', 'Failed to register gateway in the database.');
    }
};

const listGateways = async (authenticatedUser) => {
    if (!authenticatedUser || !authenticatedUser.id) {
        throw createServiceError(401, 'unauthorized', 'Access token required.');
    }

    try {
        const gateways = await gatewayModel.find({ ownerId: authenticatedUser.id }).sort({ createdAt: -1 });

        return {
            itemList: gateways.map((gateway) => {
                const dtoOut = gateway.toJSON();
                dtoOut.lastSeen = new Date(dtoOut.lastSeen).toISOString();
                delete dtoOut.createdAt;
                delete dtoOut.updatedAt;

                return dtoOut;
            })
        };
    } catch (error) {
        throw createServiceError(500, 'gatewayLoadFailed', 'Failed to retrieve gateway data from the database.');
    }
};

const getGateway = async (gatewayId, authenticatedUser) => {
    if (!authenticatedUser || !authenticatedUser.id) {
        throw createServiceError(401, 'unauthorized', 'Access token required.');
    }

    if (!gatewayId) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    try {
        const gateway = await gatewayModel.findById(gatewayId);

        if (!gateway) {
            throw createServiceError(404, 'gatewayNotFound', 'Gateway with this ID does not exist.');
        }

        const dtoOut = gateway.toJSON();
        dtoOut.lastSeen = new Date(dtoOut.lastSeen).toISOString();

        return dtoOut;
    } catch (error) {
        throw createServiceError(500, 'gatewayLoadFailed', 'Failed to retrieve gateway data.');
    }
};

const updateGateway = async (gatewayId, dtoIn, authenticatedUser) => {
    if (!authenticatedUser || !authenticatedUser.id) {
        throw createServiceError(401, 'unauthorized', 'Access token required.');
    }

    if (!dtoIn.name || dtoIn.name.length < 1 || dtoIn.name.length > 20 || !gatewayId) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    try {
        const gateway = await gatewayModel.findById(gatewayId);

        if (!gateway) {
            throw createServiceError(404, 'gatewayNotFound', 'Gateway with this ID does not exist.');
        }

        gateway.name = dtoIn.name;
        const updatedGateway = await gateway.save();

        const dtoOut = updatedGateway.toJSON();
        dtoOut.lastSeen = new Date(dtoOut.lastSeen).toISOString();

        return dtoOut;
    } catch (error) {
        throw createServiceError(500, 'updateFailed', 'Failed to update gateway in the database.');
    }
};

const deleteGateway = async (gatewayId, authenticatedUser) => {
    if (!authenticatedUser || !authenticatedUser.id) {
        throw createServiceError(401, 'unauthorized', 'Access token required.');
    }

    if (!gatewayId) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    try {
        const gateway = await gatewayModel.findById(gatewayId);

        if (!gateway) {
            throw createServiceError(404, 'gatewayNotFound', 'Gateway with this ID does not exist.');
        }

        await gatewayModel.findByIdAndDelete(gatewayId);

        const dtoOut = gateway.toJSON();
        dtoOut.lastSeen = new Date(dtoOut.lastSeen).toISOString();

        return dtoOut;
    } catch (error) {
        if (error.status) throw error;
        throw createServiceError(500, 'deleteFailed', 'Failed to delete gateway from the database.');
    }
};

module.exports = {
    registerGateway,
    listGateways,
    getGateway,
    updateGateway,
    deleteGateway
};