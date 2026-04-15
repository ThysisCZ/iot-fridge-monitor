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

const getFridge = async (id, authenticatedUser) => {
    if (!authenticatedUser || !authenticatedUser.id) {
        throw createServiceError(401, 'unauthorized', 'Access token required.');
    }
    
    const foundFridge = await fridgeModel.findOne({ fridgeId: id });

    //Error if fridge does not exist
    if (!foundFridge) {
        throw createServiceError(400, 'fridgeNotFound', `Fridge with fridgeId '${id}' does not exist.`); 
    }

    //Check if auth user is a member or owner
    if ( foundFridge.ownerId != authenticatedUser.id && foundFridge.memberIds.findIndex(authenticatedUser.id) == -1 ) {
        throw createServiceError(403, 'forbidden', 'You are not authorized to access this fridge.');
    }

    return foundFridge.toJSON();
};

const updateFridge = async (id, dtoIn, authenticatedUser) => {
    if (!authenticatedUser || !authenticatedUser.id) {
        throw createServiceError(401, 'unauthorized', 'Access token required.');
    }
    
    const foundFridge = await fridgeModel.findOne({ fridgeId: id });
    
    //Error if fridge does not exist
    if (!foundFridge) {
        throw createServiceError(400, 'fridgeNotFound', `Fridge with fridgeId '${id}' does not exist.`); 
    }

    //Check if auth user is a member or owner
    if ( foundFridge.ownerId != authenticatedUser.id && foundFridge.memberIds.findIndex(authenticatedUser.id) == -1 ) {
        throw createServiceError(403, 'forbidden', 'You are not authorized to access this fridge.');
    }

    // Try updating fridge
    try {
        foundFridge = { ...foundFridge, ...dtoIn };
        const savedFridge = await foundFridge.save();

        return savedFridge.toJSON();
    } catch (error) {
        throw createServiceError(500, 'storageFailed', 'Failed to update fridge record in the database.');
    }
};

const deleteFridge = async (id, authenticatedUser) => {
    if (!authenticatedUser || !authenticatedUser.id) {
        throw createServiceError(401, 'unauthorized', 'Access token required.');
    }

    const foundFridge = await fridgeModel.findOne({ fridgeId: id });
    
    //Error if fridge does not exist
    if (!foundFridge) {
        throw createServiceError(400, 'fridgeNotFound', `Fridge with fridgeId '${id}' does not exist.`); 
    }

    //Check if auth user is a member or owner
    if ( foundFridge.ownerId != authenticatedUser.id && foundFridge.memberIds.findIndex(authenticatedUser.id) == -1 ) {
        throw createServiceError(403, 'forbidden', 'You are not authorized to access this fridge.');
    }

    try {
        const result = await fridgeModel.deleteOne({ fridgeId: id });
        return result.toJSON();
    } catch (error) {
        throw createServiceError(500, 'storageFailed', 'Failed to delete fridge record in the database.');
    }
}

module.exports = {
    createFridge,
    getFridge,
    updateFridge,
    deleteFridge
}