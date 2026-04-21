//dependencies
const monitorModel = require('./monitorModel');

const createServiceError = (status, code, message) => {
    const error = new Error(message);
    error.status = status;
    error.code = code;
    return error;
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

        //build the query dynamically
        const query = { gatewayId: dtoIn.gatewayId };

        //show only unassigned monitors
        if (dtoIn.unassignedOnly === true) {
            query.fridgeId = null;
        }

        const monitors = await monitorModel.find(query);

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
        throw createServiceError(401, 'unauthorized', 'Valid API key is required.');
    }

    let monitor = await monitorModel.findById(monitorId);

    if (!monitor) {
        if (authenticatedUser.role === 'gateway') {
            //create the monitor if this radio ID is new
            monitor = new monitorModel({
                _id: monitorId,
                gatewayId: authenticatedUser.gatewayId,
                fridgeId: null,
                firmwareVersion: dtoIn.firmwareVersion || "unknown",
                batteryLevel: dtoIn.batteryLevel || 0,
                status: dtoIn.status || "active",
                pairedAt: null
            });
        } else {
            throw createServiceError(404, 'monitorNotFound', 'Monitor not found.');
        }
    }

    //check if the current gateway has access to the monitor
    if (authenticatedUser.role === 'gateway' && monitor.gatewayId.toString() !== authenticatedUser.gatewayId) {
        throw createServiceError(403, 'forbidden', 'Gateway mismatch.');
    }

    if (dtoIn.firmwareVersion) monitor.firmwareVersion = dtoIn.firmwareVersion;
    if (dtoIn.batteryLevel !== undefined) monitor.batteryLevel = dtoIn.batteryLevel;
    if (dtoIn.status) monitor.status = dtoIn.status;

    await monitor.save();
    return monitor;
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