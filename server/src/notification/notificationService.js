//dependencies
const notificationModel = require('./notificationModel');

const createServiceError = (status, code, message) => {
    const error = new Error(message);
    error.status = status;
    error.code = code;

    return error;
};

const listNotifications = async (authenticatedUser) => {
    if (!authenticatedUser || !authenticatedUser.id) {
        throw createServiceError(401, 'unauthorized', 'Access token required.');
    }

    try {
        const itemList = await notificationModel.find({ userId: authenticatedUser.id }).sort({ createdAt: -1 });

        return {
            itemList: itemList.map((notification) => {
                const dtoOut = notification.toJSON();
                dtoOut.createdAt = new Date(dtoOut.createdAt).toISOString();
                delete dtoOut.updatedAt;

                return dtoOut;
            })
        };
    } catch (error) {
        throw createServiceError(500, 'notificationLoadFailed', 'Failed to load notifications.');
    }
};

module.exports = {
    listNotifications
};