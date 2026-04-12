//dependencies
const mongoose = require('mongoose');
const ruleModel = require('./ruleModel');
const fridgeModel = require('../fridge/fridgeModel');

//supported sensor types
const SUPPORTED_SENSOR_TYPES = ['temperature', 'humidity', 'illuminance'];

//threshold limits per sensor type
const THRESHOLD_LIMITS = {
    temperature: { min: -40, max: 70 },
    humidity: { min: 0, max: 100 },
    illuminance: { min: 0, max: 10000 }
};

//helper functions
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

//validate fridge ID
const validateFridgeId = (fridgeId) => {
    if (!hasRequiredString(fridgeId)) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }
};

//validate rule ID
const validateRuleId = (id) => {
    if (!isValidMongoId(id)) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }
};

//validate threshold values against sensor type limits
const validateThresholdLimits = (sensorType, minThreshold, maxThreshold) => {
    const limits = THRESHOLD_LIMITS[sensorType];

    if (minThreshold < limits.min || minThreshold > limits.max) {
        throw createServiceError(400, 'invalidThreshold', `Minimum threshold for ${sensorType} must be between ${limits.min} and ${limits.max}.`);
    }

    if (maxThreshold < limits.min || maxThreshold > limits.max) {
        throw createServiceError(400, 'invalidThreshold', `Maximum threshold for ${sensorType} must be between ${limits.min} and ${limits.max}.`);
    }

    if (minThreshold >= maxThreshold) {
        throw createServiceError(400, 'invalidThreshold', 'Minimum threshold must be less than maximum threshold.');
    }
};

//validate dtoIn for create rule
const validateCreateDtoIn = (fridgeId, dtoIn) => {
    validateFridgeId(fridgeId);

    if (!isPlainObject(dtoIn)) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    if (!hasRequiredString(dtoIn.name) || dtoIn.name.trim().length > 20) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    if (!hasRequiredString(dtoIn.sensorType) || !SUPPORTED_SENSOR_TYPES.includes(dtoIn.sensorType.trim().toLowerCase())) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    if (typeof dtoIn.minThreshold !== 'number' || Number.isNaN(dtoIn.minThreshold)) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    if (typeof dtoIn.maxThreshold !== 'number' || Number.isNaN(dtoIn.maxThreshold)) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    if (dtoIn.durationThreshold !== undefined && (!Number.isInteger(dtoIn.durationThreshold) || dtoIn.durationThreshold < 0)) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    if (dtoIn.isActive !== undefined && typeof dtoIn.isActive !== 'boolean') {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    validateThresholdLimits(
        dtoIn.sensorType.trim().toLowerCase(),
        dtoIn.minThreshold,
        dtoIn.maxThreshold
    );
};

//validate dtoIn for update rule
const validateUpdateDtoIn = (id, dtoIn) => {
    validateRuleId(id);

    if (!isPlainObject(dtoIn)) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    if (Object.keys(dtoIn).length === 0) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    if (dtoIn.name !== undefined && (!hasRequiredString(dtoIn.name) || dtoIn.name.trim().length > 20)) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    if (dtoIn.sensorType !== undefined && (!hasRequiredString(dtoIn.sensorType) || !SUPPORTED_SENSOR_TYPES.includes(dtoIn.sensorType.trim().toLowerCase()))) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    if (dtoIn.minThreshold !== undefined && (typeof dtoIn.minThreshold !== 'number' || Number.isNaN(dtoIn.minThreshold))) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    if (dtoIn.maxThreshold !== undefined && (typeof dtoIn.maxThreshold !== 'number' || Number.isNaN(dtoIn.maxThreshold))) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    if (dtoIn.durationThreshold !== undefined && (!Number.isInteger(dtoIn.durationThreshold) || dtoIn.durationThreshold < 0)) {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }

    if (dtoIn.isActive !== undefined && typeof dtoIn.isActive !== 'boolean') {
        throw createServiceError(400, 'invalidDtoIn', 'DtoIn is not valid.');
    }
};

//check if fridge exists
const getFridgeExistsOrThrow = async (fridgeId, loadErrorCode, loadErrorMessage) => {
    try {
        const exists = await fridgeModel.exists({ _id: fridgeId });

        return exists;
    } catch (error) {
        throw createServiceError(500, loadErrorCode, loadErrorMessage);
    }
};

//get rule by ID or throw
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

//list rules
const listRules = async (fridgeId, authenticatedUser) => {
    if (!authenticatedUser || !authenticatedUser.id) {
        throw createServiceError(401, 'unauthorized', 'Access token required.');
    }

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

//create rule
const createRule = async (fridgeId, dtoIn, authenticatedUser) => {
    if (!authenticatedUser || !authenticatedUser.id) {
        throw createServiceError(401, 'unauthorized', 'Access token required.');
    }

    validateCreateDtoIn(fridgeId, dtoIn);

    const normalizedFridgeId = fridgeId.trim();
    const normalizedName = dtoIn.name.trim();
    const normalizedSensorType = dtoIn.sensorType.trim().toLowerCase();

    const existingFridge = await getFridgeExistsOrThrow(normalizedFridgeId, 'ruleCreateFailed', 'Failed to create fridge rule.');

    if (!existingFridge) {
        throw createServiceError(404, 'fridgeDoesNotExist', 'Fridge does not exist.');
    }

    try {
        const createdRule = await ruleModel.create({
            fridgeId: normalizedFridgeId,
            name: normalizedName,
            sensorType: normalizedSensorType,
            minThreshold: dtoIn.minThreshold,
            maxThreshold: dtoIn.maxThreshold,
            durationThreshold: dtoIn.durationThreshold ?? 0,
            isActive: dtoIn.isActive ?? true
        });

        return normalizeRule(createdRule);
    } catch (error) {
        throw createServiceError(500, 'ruleCreateFailed', 'Failed to create fridge rule.');
    }
};

//get rule
const getRule = async (id, authenticatedUser) => {
    if (!authenticatedUser || !authenticatedUser.id) {
        throw createServiceError(401, 'unauthorized', 'Access token required.');
    }

    validateRuleId(id);

    const foundRule = await getRuleByIdOrThrow(id, 'ruleLoadFailed', 'Failed to load rule detail.');

    return normalizeRule(foundRule);
};

//update rule
const updateRule = async (id, dtoIn, authenticatedUser) => {
    if (!authenticatedUser || !authenticatedUser.id) {
        throw createServiceError(401, 'unauthorized', 'Access token required.');
    }

    validateUpdateDtoIn(id, dtoIn);

    const existingRule = await getRuleByIdOrThrow(id, 'ruleLoadFailed', 'Failed to load rule detail.');

    const sensorType = dtoIn.sensorType !== undefined ? dtoIn.sensorType.trim().toLowerCase() : existingRule.sensorType;
    const minThreshold = dtoIn.minThreshold !== undefined ? dtoIn.minThreshold : existingRule.minThreshold;
    const maxThreshold = dtoIn.maxThreshold !== undefined ? dtoIn.maxThreshold : existingRule.maxThreshold;

    validateThresholdLimits(sensorType, minThreshold, maxThreshold);

    try {
        if (dtoIn.name !== undefined) existingRule.name = dtoIn.name.trim();
        if (dtoIn.sensorType !== undefined) existingRule.sensorType = dtoIn.sensorType.trim().toLowerCase();
        if (dtoIn.minThreshold !== undefined) existingRule.minThreshold = dtoIn.minThreshold;
        if (dtoIn.maxThreshold !== undefined) existingRule.maxThreshold = dtoIn.maxThreshold;
        if (dtoIn.durationThreshold !== undefined) existingRule.durationThreshold = dtoIn.durationThreshold;
        if (dtoIn.isActive !== undefined) existingRule.isActive = dtoIn.isActive;

        const savedRule = await existingRule.save();

        return normalizeRule(savedRule);
    } catch (error) {
        throw createServiceError(500, 'ruleUpdateFailed', 'Failed to update rule.');
    }
};

//delete rule
const deleteRule = async (id, authenticatedUser) => {
    if (!authenticatedUser || !authenticatedUser.id) {
        throw createServiceError(401, 'unauthorized', 'Access token required.');
    }

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