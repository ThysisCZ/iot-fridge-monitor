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
        throw createServiceError(400, 'invalidDtoIn', 'Gateway name must be between 1 and 20 characters.');
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

module.exports = {
    registerGateway
};