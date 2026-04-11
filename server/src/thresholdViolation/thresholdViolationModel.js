//dependencies
const mongoose = require('mongoose');

//define threshold violation schema
const thresholdViolationSchema = new mongoose.Schema(
    {
        ruleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Rule',
            required: true
        },
        fridgeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Fridge',
            required: true
        },
        violationStart: {
            type: Date,
            required: true,
            default: Date.now
        },
        notified: {
            type: Boolean,
            required: true,
            default: false
        }
    },
    {
        timestamps: true
    }
);

thresholdViolationSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.__v;

        return returnedObject;
    }
});

module.exports = mongoose.models.ThresholdViolation || mongoose.model('ThresholdViolation', thresholdViolationSchema);