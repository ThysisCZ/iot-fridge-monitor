const notificationService = require('./notificationService');

const listNotificationsController = async (req, res) => {
    try {
        const dtoOut = await notificationService.listNotifications(req.user);

        return res.status(200).send(dtoOut);
    } catch (error) {
        return res.status(error.status || 500).send({
            code: error.code || 'internalServerError',
            message: error.message || 'Unexpected server error.'
        });
    }
};

module.exports = {
    listNotificationsController
};