//dependencies
const monitorModel = require('./monitorModel');

const createServiceError = (status, code, message) => {
    const error = new Error(message);
    error.status = status;
    error.code = code;
    return error;
};

const createMonitor = async (dtoIn, authenticatedUser) => {
    if (!authenticatedUser || !authenticatedUser.id) {
        throw createServiceError(401, 'unauthorized', 'Access token required.');
    }

    if (!dtoIn.id) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    const existingMonitor = await monitorModel.findById(dtoIn.id);
    if (existingMonitor) {
        throw createServiceError(400, 'monitorAlreadyExists', 'A monitor with this radio ID already exists.');
    }

    try {
        //create a record with default factory values
        const newMonitor = new monitorModel({
            _id: dtoIn.id,
            fridgeId: null,
            gatewayId: dtoIn.gatewayId,
            firmwareVersion: "1.0.0",
            batteryLevel: 100,
            status: "active",
            pairedAt: new Date()
        });

        const savedMonitor = await newMonitor.save();

        return savedMonitor.toJSON();
    } catch (error) {
        throw createServiceError(500, 'storageFailed', 'Failed to create monitor record in the database.');
    }
};

const listMonitors = async (dtoIn, authenticatedUser) => {
    if (!authenticatedUser || !authenticatedUser.id) {
        throw createServiceError(401, 'unauthorized', 'Access token required.');
    }

    if (!dtoIn.gatewayId) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    try {
        //verify the user owns the requested gateway
        const gateway = await gatewayModel.findOne({
            _id: dtoIn.gatewayId,
            ownerId: authenticatedUser.id
        });

        if (!gateway) {
            throw createServiceError(403, 'forbidden', 'Gateway not found or access denied.');
        }

        const monitors = await monitorModel.find({ gatewayId: dtoIn.gatewayId });

        return {
            itemList: monitors.map((monitor) => {
                const dtoOut = monitor.toJSON();
                dtoOut.pairedAt = new Date(dtoOut.pairedAt).toISOString();
                return dtoOut;
            })
        };
    } catch (error) {
        throw createServiceError(500, 'monitorListFailed', 'Failed to load monitors for the specified gateway.');
    }
};

const getMonitor = async (monitorId, authenticatedUser) => {
    if (!authenticatedUser || !authenticatedUser.id) {
        throw createServiceError(401, 'unauthorized', 'Access token required.');
    }

    if (!dtoIn.id) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    const monitor = await monitorModel.findById(monitorId);
    if (!monitor) throw createServiceError(404, 'monitorNotFound', 'Monitor not found.');

    return monitor.toJSON();
};

const updateMonitor = async (monitorId, dtoIn, authenticatedUser) => {
    if (!authenticatedUser || !authenticatedUser.gatewayId) {
        return reject({
            message: 'API key is required.',
            code: 'unauthorized'
        });
    }

    const monitor = await monitorModel.findById(monitorId);
    if (!monitor) throw createServiceError(404, 'monitorNotFound', 'Monitor not found.');

    if (authenticatedUser.role === 'gateway' && monitor.gatewayId.toString() !== authenticatedUser.gatewayId) {
        throw createServiceError(403, 'forbidden', 'This gateway is not authorized to update this monitor.');
    }

    if (!dtoIn.id) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    if (dtoIn.firmwareVersion) monitor.firmwareVersion = dtoIn.firmwareVersion;
    if (dtoIn.batteryLevel) monitor.batteryLevel = dtoIn.batteryLevel;
    if (dtoIn.status) monitor.status = dtoIn.status;

    monitor.lastSeen = new Date();
    await monitor.save();
};

const addFridge = async (monitorId, fridgeId, authenticatedUser) => {
    if (!authenticatedUser || !authenticatedUser.id) {
        throw createServiceError(401, 'unauthorized', 'Access token required.');
    }

    if (!dtoIn.id) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    const monitor = await monitorModel.findById(monitorId);
    if (!monitor) throw createServiceError(404, 'monitorNotFound', 'Monitor not found.');

    monitor.fridgeId = fridgeId;
    const saved = await monitor.save();
    return saved.toJSON();
};

const removeFridge = async (monitorId, authenticatedUser) => {
    if (!authenticatedUser || !authenticatedUser.id) {
        throw createServiceError(401, 'unauthorized', 'Access token required.');
    }

    const monitor = await monitorModel.findById(monitorId);
    if (!monitor) throw createServiceError(404, 'monitorNotFound', 'Monitor not found.');

    monitor.fridgeId = null;
    const saved = await monitor.save();
    return saved.toJSON();
};

const deleteMonitor = async (monitorId, authenticatedUser) => {
    if (!authenticatedUser || !authenticatedUser.id) {
        throw createServiceError(401, 'unauthorized', 'Access token required.');
    }

    const monitor = await monitorModel.findById(monitorId);
    if (!monitor) throw createServiceError(404, 'monitorNotFound', 'Monitor not found.');

    //check gateway ownership to permit deletion
    const gateway = await gatewayModel.findOne({ _id: monitor.gatewayId, ownerId: authenticatedUser.id });
    if (!gateway) throw createServiceError(403, 'forbidden', 'Permission denied.');

    await monitorModel.findByIdAndDelete(monitorId);
    return { id: monitorId, status: 'deleted' };
};

module.exports = {
    createMonitor,
    listMonitors,
    getMonitor,
    updateMonitor,
    addFridge,
    removeFridge,
    deleteMonitor
};