//dependencies
const ruleService = require('./ruleService');

const sendError = (res, error) => res.status(error.status || 500).send({
    code: error.code || 'internalServerError',
    message: error.message || 'Unexpected server error.'
});

const listRulesController = async (req, res) => {
    try {
        const dtoOut = await ruleService.listRules(req.params.fridgeId, req.user);

        return res.status(200).send(dtoOut);
    } catch (error) {
        return sendError(res, error);
    }
};

const createRuleController = async (req, res) => {
    try {
        const dtoOut = await ruleService.createRule(req.params.fridgeId, req.body, req.user);

        return res.status(201).send(dtoOut);
    } catch (error) {
        return sendError(res, error);
    }
};

const getRuleController = async (req, res) => {
    try {
        const dtoOut = await ruleService.getRule(req.params.id, req.user);

        return res.status(200).send(dtoOut);
    } catch (error) {
        return sendError(res, error);
    }
};

const updateRuleController = async (req, res) => {
    try {
        const dtoOut = await ruleService.updateRule(req.params.id, req.body, req.user);

        return res.status(200).send(dtoOut);
    } catch (error) {
        return sendError(res, error);
    }
};

const deleteRuleController = async (req, res) => {
    try {
        const dtoOut = await ruleService.deleteRule(req.params.id, req.user);

        return res.status(200).send(dtoOut);
    } catch (error) {
        return sendError(res, error);
    }
};

module.exports = {
    listRulesController,
    createRuleController,
    getRuleController,
    updateRuleController,
    deleteRuleController
};