//dependencies
const mongoose = require('mongoose');

//define rule schema
const ruleSchema = new mongoose.Schema(
    {
        fridgeId: {
            type: String,
            required: true,
            trim: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        metric: {
            type: String,
            required: true,
            trim: true
        },
        operator: {
            type: String,
            required: true,
            trim: true
        },
        threshold: {
            type: Number,
            required: true
        },
        durationMinutes: {
            type: Number,
            required: true,
            default: 0
        },
        isActive: {
            type: Boolean,
            required: true,
            default: true
        }
    },
    {
        timestamps: true
    }
);

ruleSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.__v;

        return returnedObject;
    }
});

module.exports = mongoose.models.Rule || mongoose.model('Rule', ruleSchema);