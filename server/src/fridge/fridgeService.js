//dependencies
const fridgeModel = require('./fridgeModel');

const createServiceError = (status, code, message) => {
    const error = new Error(message);
    error.status = status;
    error.code = code;
    return error;
};

const createFridge = async (dtoIn, authenticatedUser) => {
    if (!authenticatedUser || !authenticatedUser.id) {
        throw createServiceError(401, 'unauthorized', 'Access token required.');
    }

    //check for duplicate fridge name per user
    const existingFridge = await fridgeModel.findOne({ name: dtoIn.name, ownerId: authenticatedUser.id });
    if (existingFridge) {
        throw createServiceError(400, 'fridgeAlreadyOwned', 'You already own a fridge with this name.');
    }

    try {
        const newFridge = new fridgeModel({
            ownerId: authenticatedUser.id,
            monitorId: null,
            memberIds: [authenticatedUser.id],
            name: dtoIn.name,
            location: dtoIn.location,
            description: dtoIn.description
        });

        const savedFridge = await newFridge.save();

        return savedFridge.toJSON();
    } catch (error) {
        throw createServiceError(500, 'storageFailed', 'Failed to create fridge record in the database.');
    }
};

module.exports = {
    createFridge
}