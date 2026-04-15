//dependencies
const fridgeService = require('./fridgeService');

const createFridgeController = async (req, res) => {
    try {
        const dtoOut = await fridgeService.createFridge(req.body, req.user);
        return res.status(201).send(dtoOut);
    } catch (error) {
        return res.status(error.status || 500).send({ code: error.code, message: error.message });
    }
};

const getFridgeController = async (req, res) => {
    try {
        const dtoOut = await fridgeService.getFridge(req.params.id, req.user);
        return res.status(201).send(dtoOut);
    } catch (error) {
        return res.status(error.status || 500).send({ code: error.code, message: error.message });
    }
};

const updateFridgeController = async (req, res) => {
    try {
        const dtoOut = await fridgeService.updateFridge(req.params.id, req.body, req.user);
        return res.status(201).send(dtoOut);
    } catch (error) {
        return res.status(error.status || 500).send({ code: error.code, message: error.message });
    }
};

const deleteFridgeController = async (req, res) => {
    try {
        const dtoOut = await fridgeService.deleteFridge(req.params.id, req.user);
        return res.status(201).send(dtoOut);
    } catch (error) {
        return res.status(error.status || 500).send({ code: error.code, message: error.message });
    }
};


const getFridgeMembersController = async (req, res) => {
    try {
        const dtoOut = await fridgeService.getFridgeMembers(req.params.fridgeId, req.user);
        return res.status(201).send(dtoOut);
    } catch (error) {
        return res.status(error.status || 500).send({ code: error.code, message: error.message });
    }
};


const inviteFridgeMemberController = async (req, res) => {
    try {
        const dtoOut = await fridgeService.inviteFridgeMember(req.params.fridgeId, req.body, req.user);
        return res.status(201).send(dtoOut);
    } catch (error) {
        return res.status(error.status || 500).send({ code: error.code, message: error.message });
    }
};

module.exports = {
    createFridgeController,
    getFridgeController,
    updateFridgeController,
    deleteFridgeController,
    getFridgeMembersController,
    inviteFridgeMemberController
}