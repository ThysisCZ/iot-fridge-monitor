//dependencies
const ruleService = require('./ruleService');

const sendError = (res, error) => res.status(error.status || 500).send({
    code: error.code || 'internalServerError',
    message: error.message || 'Unexpected server error.'
});

const listRules = async (req, res) => {
    try {
        const dtoOut = await ruleService.listRules(req.params.fridgeId);

        return res.status(200).send(dtoOut);
    } catch (error) {
        return sendError(res, error);
    }
};

const createRule = async (req, res) => {
    try {
        const dtoOut = await ruleService.createRule(req.params.fridgeId, req.body);

        return res.status(201).send(dtoOut);
    } catch (error) {
        return sendError(res, error);
    }
};

const getRule = async (req, res) => {
    try {
        const dtoOut = await ruleService.getRule(req.params.id);

        return res.status(200).send(dtoOut);
    } catch (error) {
        return sendError(res, error);
    }
};

const updateRule = async (req, res) => {
    try {
        const dtoOut = await ruleService.updateRule(req.params.id, req.body);

        return res.status(200).send(dtoOut);
    } catch (error) {
        return sendError(res, error);
    }
};

const deleteRule = async (req, res) => {
    try {
        const dtoOut = await ruleService.deleteRule(req.params.id);

        return res.status(200).send(dtoOut);
    } catch (error) {
        return sendError(res, error);
    }
};

module.exports = {
    listRules,
    createRule,
    getRule,
    updateRule,
    deleteRule
};
