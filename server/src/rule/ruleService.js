//dependencies
const mongoose = require('mongoose');
const ruleModel = require('./ruleModel');
const fridgeModel = require('../fridge/fridgeModel');

const SUPPORTED_METRICS = ['temperature', 'humidity', 'illuminance'];
const SUPPORTED_OPERATORS = ['>', '>=', '<', '<=', '=', '==', '!='];
const RULE_CREATE_FIELDS = ['name', 'metric', 'operator', 'threshold', 'durationMinutes', 'isActive'];
const RULE_UPDATABLE_FIELDS = ['name', 'metric', 'operator', 'threshold', 'durationMinutes', 'isActive'];

const createServiceError = (status, code, message) => {
    const error = new Error(message);
    error.status = status;
    error.code = code;

    return error;
};

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const hasRequiredString = (value) => typeof value === 'string' && value.trim().length > 0;

const isValidMongoId = (value) => typeof value === 'string' && mongoose.Types.ObjectId.isValid(value);

const normalizeRule = (rule) => {
    const dtoOut = rule.toJSON();
    dtoOut.createdAt = new Date(dtoOut.createdAt).toISOString();
    dtoOut.updatedAt = new Date(dtoOut.updatedAt).toISOString();

    return dtoOut;
};

const validateFridgeId = (fridgeId) => {
    if (!hasRequiredString(fridgeId)) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }
};

const validateRuleId = (id) => {
    if (!isValidMongoId(id)) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }
};

const validateCreateDtoIn = (fridgeId, dtoIn) => {
    validateFridgeId(fridgeId);

    if (!isPlainObject(dtoIn)) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    if (Object.keys(dtoIn).some((field) => !RULE_CREATE_FIELDS.includes(field))) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    if (
        !hasRequiredString(dtoIn.name) ||
        !hasRequiredString(dtoIn.metric) ||
        !hasRequiredString(dtoIn.operator) ||
        typeof dtoIn.threshold !== 'number' ||
        Number.isNaN(dtoIn.threshold)
    ) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    if (
        dtoIn.durationMinutes !== undefined &&
        (!Number.isInteger(dtoIn.durationMinutes) || dtoIn.durationMinutes < 0)
    ) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    if (dtoIn.isActive !== undefined && typeof dtoIn.isActive !== 'boolean') {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }
};

const validateUpdateDtoIn = (id, dtoIn) => {
    validateRuleId(id);

    if (!isPlainObject(dtoIn)) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    const providedFields = Object.keys(dtoIn);

    if (providedFields.length === 0) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    if (providedFields.some((field) => !RULE_UPDATABLE_FIELDS.includes(field))) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    if (dtoIn.name !== undefined && !hasRequiredString(dtoIn.name)) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    if (dtoIn.metric !== undefined && !hasRequiredString(dtoIn.metric)) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    if (dtoIn.operator !== undefined && !hasRequiredString(dtoIn.operator)) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    if (dtoIn.threshold !== undefined && (typeof dtoIn.threshold !== 'number' || Number.isNaN(dtoIn.threshold))) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    if (
        dtoIn.durationMinutes !== undefined &&
        (!Number.isInteger(dtoIn.durationMinutes) || dtoIn.durationMinutes < 0)
    ) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    if (dtoIn.isActive !== undefined && typeof dtoIn.isActive !== 'boolean') {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }
};

const validateRuleDefinition = (ruleData) => {
    if (!SUPPORTED_METRICS.includes(ruleData.metric) || !SUPPORTED_OPERATORS.includes(ruleData.operator)) {
        throw createServiceError(400, 'invalidRuleDefinition', 'Rule definition is not valid.');
    }
};

const normalizeCreatePayload = (fridgeId, dtoIn) => ({
    fridgeId: fridgeId.trim(),
    name: dtoIn.name.trim(),
    metric: dtoIn.metric.trim().toLowerCase(),
    operator: dtoIn.operator.trim(),
    threshold: dtoIn.threshold,
    durationMinutes: dtoIn.durationMinutes ?? 0,
    isActive: dtoIn.isActive ?? true
});

const fridgeExists = async (fridgeId) => {
    const filters = [{ fridgeId }];

    if (mongoose.Types.ObjectId.isValid(fridgeId)) {
        filters.push({ _id: fridgeId });
    }

    return fridgeModel.exists({ $or: filters });
};

const getFridgeExistsOrThrow = async (fridgeId, loadErrorCode, loadErrorMessage) => {
    try {
        return await fridgeExists(fridgeId);
    } catch (error) {
        throw createServiceError(500, loadErrorCode, loadErrorMessage);
    }
};

const getRuleByIdOrThrow = async (id, loadErrorCode, loadErrorMessage) => {
    try {
        const foundRule = await ruleModel.findById(id);

        if (!foundRule) {
            throw createServiceError(404, 'ruleDoesNotExist', 'Rule does not exist.');
        }

        return foundRule;
    } catch (error) {
        if (error.code === 'ruleDoesNotExist') {
            throw error;
        }

        throw createServiceError(500, loadErrorCode, loadErrorMessage);
    }
};

const listRules = async (fridgeId) => {
    validateFridgeId(fridgeId);

    const normalizedFridgeId = fridgeId.trim();
    const existingFridge = await getFridgeExistsOrThrow(normalizedFridgeId, 'rulesLoadFailed', 'Failed to load fridge rules.');

    if (!existingFridge) {
        throw createServiceError(404, 'fridgeDoesNotExist', 'Fridge does not exist.');
    }

    try {
        const itemList = await ruleModel.find({ fridgeId: normalizedFridgeId }).sort({ createdAt: -1 });

        return {
            itemList: itemList.map((rule) => normalizeRule(rule))
        };
    } catch (error) {
        throw createServiceError(500, 'rulesLoadFailed', 'Failed to load fridge rules.');
    }
};

const createRule = async (fridgeId, dtoIn) => {
    validateCreateDtoIn(fridgeId, dtoIn);

    const normalizedRule = normalizeCreatePayload(fridgeId, dtoIn);
    validateRuleDefinition(normalizedRule);

    const existingFridge = await getFridgeExistsOrThrow(normalizedRule.fridgeId, 'ruleCreateFailed', 'Failed to create fridge rule.');

    if (!existingFridge) {
        throw createServiceError(404, 'fridgeDoesNotExist', 'Fridge does not exist.');
    }

    let duplicateRule;

    try {
        duplicateRule = await ruleModel.exists({
            fridgeId: normalizedRule.fridgeId,
            name: normalizedRule.name,
            metric: normalizedRule.metric,
            operator: normalizedRule.operator,
            threshold: normalizedRule.threshold,
            durationMinutes: normalizedRule.durationMinutes,
            isActive: normalizedRule.isActive
        });
    } catch (error) {
        throw createServiceError(500, 'ruleCreateFailed', 'Failed to create fridge rule.');
    }

    if (duplicateRule) {
        throw createServiceError(409, 'ruleAlreadyExists', 'A rule with the same configuration already exists.');
    }

    try {
        const createdRule = await ruleModel.create(normalizedRule);

        return normalizeRule(createdRule);
    } catch (error) {
        throw createServiceError(500, 'ruleCreateFailed', 'Failed to create fridge rule.');
    }
};

const getRule = async (id) => {
    validateRuleId(id);

    const foundRule = await getRuleByIdOrThrow(id, 'ruleLoadFailed', 'Failed to load rule detail.');

    return normalizeRule(foundRule);
};

const updateRule = async (id, dtoIn) => {
    validateUpdateDtoIn(id, dtoIn);

    const existingRule = await getRuleByIdOrThrow(id, 'ruleLoadFailed', 'Failed to load rule detail.');
    const updatedRuleData = {
        name: dtoIn.name !== undefined ? dtoIn.name.trim() : existingRule.name,
        metric: dtoIn.metric !== undefined ? dtoIn.metric.trim().toLowerCase() : existingRule.metric,
        operator: dtoIn.operator !== undefined ? dtoIn.operator.trim() : existingRule.operator,
        threshold: dtoIn.threshold !== undefined ? dtoIn.threshold : existingRule.threshold,
        durationMinutes: dtoIn.durationMinutes !== undefined ? dtoIn.durationMinutes : existingRule.durationMinutes,
        isActive: dtoIn.isActive !== undefined ? dtoIn.isActive : existingRule.isActive
    };

    validateRuleDefinition(updatedRuleData);

    try {
        const ruleToUpdate = await ruleModel.findById(id);

        if (!ruleToUpdate) {
            throw createServiceError(404, 'ruleDoesNotExist', 'Rule does not exist.');
        }

        RULE_UPDATABLE_FIELDS.forEach((field) => {
            if (dtoIn[field] !== undefined) {
                ruleToUpdate[field] = updatedRuleData[field];
            }
        });

        const savedRule = await ruleToUpdate.save();

        return normalizeRule(savedRule);
    } catch (error) {
        if (error.code === 'ruleDoesNotExist') {
            throw error;
        }

        throw createServiceError(500, 'ruleUpdateFailed', 'Failed to update rule.');
    }
};

const deleteRule = async (id) => {
    validateRuleId(id);

    const existingRule = await getRuleByIdOrThrow(id, 'ruleLoadFailed', 'Failed to load rule detail.');

    try {
        const deleteResult = await ruleModel.deleteOne({ _id: existingRule.id });

        if (deleteResult.deletedCount !== 1) {
            throw new Error('Delete operation failed.');
        }

        return {
            id: existingRule.id,
            deleted: true
        };
    } catch (error) {
        throw createServiceError(500, 'ruleDeleteFailed', 'Failed to delete rule.');
    }
};

module.exports = {
    listRules,
    createRule,
    getRule,
    updateRule,
    deleteRule
};