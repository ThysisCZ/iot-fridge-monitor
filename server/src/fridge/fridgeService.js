//dependencies
const fridgeModel = require('./fridgeModel');
const userModel = require('../user/userModel');

const createServiceError = (status, code, message) => {
    const error = new Error(message);
    error.status = status;
    error.code = code;
    return error;
};

const listFridges = async (authenticatedUser) => {

    if (!authenticatedUser || !authenticatedUser.id) {
        throw createServiceError(401, 'unauthorized', 'Access token required.');
    }

    try {
        //Find all fridges with authenticated user id in the memberIds array
        const fridges = await fridgeModel.find({ memberIds: authenticatedUser.id });

        return fridges.map((f) => f.toJSON());
    } catch (error) {
        throw createServiceError(500, 'retrievalFailed', 'Failed to return list of fridges from the database.');
    }

}

const createFridge = async (dtoIn, authenticatedUser) => {
    if (!authenticatedUser || !authenticatedUser.id) {
        throw createServiceError(401, 'unauthorized', 'Access token required.');
    }

    if (!dtoIn.name) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
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

    if (!id) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    try {
        const foundFridge = await fridgeModel.findById(id);

        return foundFridge.toJSON();
    } catch (error) {
        throw createServiceError(500, 'storageFailed', 'Failed to get fridge record from the database.');
    }
};

const updateFridge = async (id, dtoIn, authenticatedUser) => {
    if (!authenticatedUser || !authenticatedUser.id) {
        throw createServiceError(401, 'unauthorized', 'Access token required.');
    }

    if (!id || !dtoIn.name) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    // Try updating fridge
    try {
        const foundFridge = await fridgeModel.findById(id);

        foundFridge.name = dtoIn.name;

        if (dtoIn.description) {
            foundFridge.description = dtoIn.description;
        }

        await foundFridge.save();

        return foundFridge.toJSON();
    } catch (error) {
        throw createServiceError(500, 'storageFailed', 'Failed to update fridge record in the database.');
    }
};

const deleteFridge = async (id, authenticatedUser) => {
    if (!authenticatedUser || !authenticatedUser.id) {
        throw createServiceError(401, 'unauthorized', 'Access token required.');
    }

    if (!id) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    try {
        //Validate if user is authorized to access the fridge and that fridge exists
        const foundFridge = await fridgeModel.findById(id);

        //Only owner can delete
        if (foundFridge.ownerId != authenticatedUser.id) {
            throw createServiceError(403, 'forbidden', 'You are not authorized to delete this fridge.');
        }

        await fridgeModel.deleteOne({ _id: id });
        return { id: id, status: 'deleted' };
    } catch (error) {
        throw createServiceError(500, 'deleteFailed', 'Failed to delete fridge record in the database.');
    }
}

const getFridgeMembers = async (id, authenticatedUser) => {
    if (!authenticatedUser || !authenticatedUser.id) {
        throw createServiceError(401, 'unauthorized', 'Access token required.');
    }

    if (!id) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    try {
        const foundFridge = await fridgeModel.findById(id);
        const memberIds = foundFridge.memberIds;

        //Find members based on ID
        const members = await userModel.find({ _id: { $in: memberIds } });

        return members.map(member => ({ id: member.id, name: member.name, email: member.email }));
    } catch (error) {
        throw createServiceError(500, 'retrievalFailed', 'Failed to return fridge members from the database.');
    }

}

const inviteFridgeMember = async (id, dtoIn, authenticatedUser) => {
    if (!authenticatedUser || !authenticatedUser.id) {
        throw createServiceError(401, 'unauthorized', 'Access token required.');
    }

    if (!id || !dtoIn.name) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    try {
        const foundFridge = await fridgeModel.findById(id);
        //Only owner can invite
        if (foundFridge.ownerId != authenticatedUser.id) {
            throw createServiceError(403, 'forbidden', 'You are not authorized to invite members to this fridge.');
        }

        const invitedMember = await userModel.findOne({ name: dtoIn.name })

        if (!invitedMember) {
            throw createServiceError(400, 'userNotFound', `User with the name '${dtoIn.name}' does not exist.`);
        }

        if (foundFridge.memberIds.includes(invitedMember._id)) {
            throw createServiceError(400, 'userIsMember', `User is already a member of this fridge`);
        }

        const updatedIds = [...foundFridge.memberIds, invitedMember._id.toString()];
        foundFridge.memberIds = updatedIds;

        foundFridge.save();

        return foundFridge.toJSON();
    } catch (error) {
        throw createServiceError(500, 'storageFailed', 'Failed to update fridge record in the database.');
    }
}

const removeFridgeMember = async (id, memberId, authenticatedUser) => {
    if (!authenticatedUser || !authenticatedUser.id) {
        throw createServiceError(401, 'unauthorized', 'Access token required.');
    }

    if (!id || !memberId) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    try {
        const foundFridge = await fridgeModel.findById(id);

        //Only owner can invite
        if (foundFridge.ownerId != authenticatedUser.id && memberId != authenticatedUser.id) {
            throw createServiceError(403, 'forbidden', 'You are not authorized to remove other members from this fridge.');
        }

        //The member doesn't exist
        if (!foundFridge.memberIds.includes(memberId)) {
            throw createServiceError(400, 'userIsNotMember', `The user is not a member of this fridge.`);
        }

        //Remove the member ID
        const memberIds = foundFridge.memberIds;
        const deletions = 1;
        const index = memberIds.indexOf(memberId);
        memberIds.splice(index, deletions);

        foundFridge.memberIds = memberIds;

        await foundFridge.save();

        return foundFridge.toJSON();
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