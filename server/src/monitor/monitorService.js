//dependencies
const monitorModel = require('./monitorModel');
const gatewayModel = require('../gateway/gatewayModel');

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
                dtoOut.pairedAt = monitor.pairedAt ? monitor.pairedAt.toISOString() : null;
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

    if (!monitorId) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    try {
        const monitor = await monitorModel.findById(monitorId);
        if (!monitor) throw createServiceError(404, 'monitorNotFound', 'Monitor not found.');

        return monitor.toJSON();
    } catch (error) {
        throw createServiceError(500, 'monitorGetFailed', 'Failed to retrieve monitor data from the database.');
    }
};

const updateMonitor = async (monitorId, dtoIn, authenticatedUser) => {
    if (!authenticatedUser || !authenticatedUser.gatewayId) {
        throw createServiceError(401, 'unauthorized', 'API key is required.');
    }

    if (!dtoIn.firmwareVersion || !dtoIn.status || !monitorId) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    try {
        let monitor = await monitorModel.findById(monitorId);

        if (!monitor) {
            //create the monitor if this radio ID is new
            monitor = new monitorModel({
                _id: monitorId,
                gatewayId: authenticatedUser.gatewayId,
                fridgeId: null,
                firmwareVersion: dtoIn.firmwareVersion,
                batteryLevel: null,
                status: dtoIn.status,
                pairedAt: null
            });
        }

        //check if the current gateway has access to the monitor
        if (authenticatedUser.role === 'gateway' && monitor.gatewayId.toString() !== authenticatedUser.gatewayId) {
            throw createServiceError(403, 'forbidden', 'Gateway mismatch.');
        }

        monitor.firmwareVersion = dtoIn.firmwareVersion;
        monitor.status = dtoIn.status;

        await monitor.save();
        return monitor.toJSON();
    } catch (error) {
        throw createServiceError(500, 'monitorUpdateFailed', 'Failed to write monitor data do the database.');
    }
};

const addFridge = async (monitorId, fridgeId, authenticatedUser) => {
    if (!authenticatedUser || !authenticatedUser.id) {
        throw createServiceError(401, 'unauthorized', 'Access token required.');
    }

    if (!monitorId || !fridgeId) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    try {
        const monitor = await monitorModel.findById(monitorId);
        if (!monitor) throw createServiceError(404, 'monitorNotFound', 'Monitor not found.');

        //verify that the user owns the gateway this monitor is attached to
        const gateway = await gatewayModel.findOne({ _id: monitor.gatewayId, ownerId: authenticatedUser.id });
        if (!gateway) throw createServiceError(403, 'forbidden', 'You do not have permission to pair this monitor.');

        //check if the monitor is already paired
        if (monitor.fridgeId && monitor.fridgeId.toString() !== fridgeId) {
            throw createServiceError(400, 'monitorAlreadyPaired', 'This monitor is already assigned to another fridge.');
        }

        monitor.fridgeId = fridgeId;
        monitor.pairedAt = new Date();
        await monitor.save();

        //update the fridge
        const fridge = await fridgeModel.findOneAndUpdate(
            { _id: fridgeId, ownerId: authenticatedUser.id },
            { monitorId: monitorId }
        );

        return monitor.toJSON();
    } catch (error) {
        throw createServiceError(500, 'monitorUpdateFailed', 'Failed to assign monitor to fridge in the database.');
    }
};

const removeFridge = async (monitorId, fridgeId, authenticatedUser) => {
    if (!authenticatedUser || !authenticatedUser.id) {
        throw createServiceError(401, 'unauthorized', 'Access token required.');
    }

    if (!monitorId || !fridgeId) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    try {
        const monitor = await monitorModel.findById(monitorId);
        if (!monitor) throw createServiceError(404, 'monitorNotFound', 'Monitor not found.');

        const gateway = await gatewayModel.findOne({ _id: monitor.gatewayId, ownerId: authenticatedUser.id });
        if (!gateway) throw createServiceError(403, 'forbidden', 'You do not have permission to unpair this monitor.');

        monitor.fridgeId = null;
        monitor.pairedAt = null;
        await monitor.save();

        await fridgeModel.findOneAndUpdate(
            { _id: fridgeId, ownerId: authenticatedUser.id },
            { monitorId: null }
        );

        return monitor.toJSON();
    } catch (error) {
        throw createServiceError(500, 'monitorUpdateFailed', 'Failed to unassign monitor in the database.');
    }
};

const deleteMonitor = async (monitorId, authenticatedUser) => {
    if (!authenticatedUser || !authenticatedUser.id) {
        throw createServiceError(401, 'unauthorized', 'Access token required.');
    }

    if (!monitorId) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    try {
        const monitor = await monitorModel.findById(monitorId);
        if (!monitor) throw createServiceError(404, 'monitorNotFound', 'Monitor not found.');

        //check gateway ownership to permit deletion
        const gateway = await gatewayModel.findOne({ _id: monitor.gatewayId, ownerId: authenticatedUser.id });
        if (!gateway) throw createServiceError(403, 'forbidden', 'Permission denied.');

        await monitorModel.findByIdAndDelete(monitorId);
        return { id: monitorId, status: 'deleted' };
    } catch (error) {
        throw createServiceError(500, 'monitorDeleteFailed', 'Failed to delete monitor from the database.');
    }
};

module.exports = {
    listMonitors,
    getMonitor,
    updateMonitor,
    addFridge,
    removeFridge,
    deleteMonitor
};