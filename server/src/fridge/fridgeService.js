//dependencies
const fridgeModel = require('./fridgeModel');
const userModel = require('../user/userModel');

const createServiceError = (status, code, message) => {
    const error = new Error(message);
    error.status = status;
    error.code = code;
    return error;
};

const getFridgeData = async (id, authenticatedUser) => {

    const foundFridge = await fridgeModel.findById(id);

    //Error if fridge does not exist
    if (!foundFridge) {
        throw createServiceError(400, 'fridgeNotFound', `Fridge with fridgeId '${id}' does not exist.`);
    }

    //Check if auth user is a member or owner
    if (foundFridge.ownerId != authenticatedUser.id && foundFridge.memberIds.findIndex(authenticatedUser.id) == -1) {
        throw createServiceError(403, 'forbidden', 'You are not authorized to access this fridge.');
    }

    return foundFridge;
}

const listFridges = async (authenticatedUser) => {

    if (!authenticatedUser || !authenticatedUser.id) {
        throw createServiceError(401, 'unauthorized', 'Access token required.');
    }

    //Find all fridges with authenticated user id in the memberIds array
    const fridges = await fridgeModel.find({ memberIds: authenticatedUser.id });

    return fridges.toJSON();

}

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

    const foundFridge = await getFridgeData(id, authenticatedUser);

    return foundFridge.toJSON();
};

const updateFridge = async (id, dtoIn, authenticatedUser) => {
    if (!authenticatedUser || !authenticatedUser.id) {
        throw createServiceError(401, 'unauthorized', 'Access token required.');
    }

    const foundFridge = await getFridgeData(id, authenticatedUser);

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

    //Validate if user is authorized to access the fridge and that fridge exists
    const foundFridge = await getFridgeData(id, authenticatedUser);
    //Only owner can delete
    if (foundFridge.ownerId != authenticatedUser.id) {
        throw createServiceError(403, 'forbidden', 'You are not authorized to delete this fridge.');
    }

    try {
        const result = await fridgeModel.deleteOne({ fridgeId: id });
        return result.toJSON();
    } catch (error) {
        throw createServiceError(500, 'storageFailed', 'Failed to delete fridge record in the database.');
    }
}

const getFridgeMembers = async (id, authenticatedUser) => {
    if (!authenticatedUser || !authenticatedUser.id) {
        throw createServiceError(401, 'unauthorized', 'Access token required.');
    }

    const foundFridge = await getFridgeData(id, authenticatedUser);
    const members = foundFridge.memberIds.map((id) => userModel.findById(id).then((user) => { return { name: user.name, email: user.email } }))

    return members.toJSON();

}

const inviteFridgeMember = async (id, dtoIn, authenticatedUser) => {
    if (!authenticatedUser || !authenticatedUser.id) {
        throw createServiceError(401, 'unauthorized', 'Access token required.');
    }

    const foundFridge = await getFridgeData(id, authenticatedUser);
    //Only owner can invite
    if (foundFridge.ownerId != authenticatedUser.id) {
        throw createServiceError(403, 'forbidden', 'You are not authorized to invite members to this fridge.');
    }

    const invitedMember = await userModel.findOne({ name: dtoIn.name })

    if (!invitedMember) {
        throw createServiceError(400, 'userNotFound', `User with the name '${dtoIn.name}' does not exist.`);
    }

    if (foundFridge.memberIds.findIndex(invitedMember._id) != -1) {
        throw createServiceError(400, 'userIsMember', `User is already a member of this fridge`);
    }

    try {
        foundFridge.memberIds.push(invitedMember._id);
        const savedFridge = await foundFridge.save();

        return savedFridge.toJSON();
    } catch (error) {
        throw createServiceError(500, 'storageFailed', 'Failed to update fridge record in the database.');
    }
}

const removeFridgeMember = async (id, memberId, authenticatedUser) => {
    if (!authenticatedUser || !authenticatedUser.id) {
        throw createServiceError(401, 'unauthorized', 'Access token required.');
    }

    const foundFridge = await getFridgeData(id, authenticatedUser);
    //Only owner can invite
    if (foundFridge.ownerId != authenticatedUser.id && memberId != authenticatedUser.id) {
        throw createServiceError(403, 'forbidden', 'You are not authorized to remove other members from this fridge.');
    }

    //Is the user a member of the fridge?
    const removeAtIndex = foundFridge.memberIds.findIndex(memberId);
    if (removeAtIndex == -1) {
        throw createServiceError(400, 'userIsNotAMember', `User is not a member of this fridge`);
    }
    try {
        foundFridge.memberIds.splice(removeAtIndex, 1);
        const savedFridge = await foundFridge.save();

        return savedFridge.toJSON();
    } catch (error) {
        throw createServiceError(500, 'storageFailed', 'Failed to update fridge record in the database.');
    }
}

module.exports = {
    listFridges,

    createFridge,
    getFridge,
    updateFridge,
    deleteFridge,

    getFridgeMembers,
    inviteFridgeMember,
    removeFridgeMember
}