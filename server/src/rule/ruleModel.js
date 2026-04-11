//dependencies
const mongoose = require('mongoose');

//define rule schema
const ruleSchema = new mongoose.Schema(
    {
        fridgeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Fridge',
            required: true
        },
        name: {
            type: String,
            required: true,
            trim: true,
            minLength: 1,
            maxLength: 20
        },
        sensorType: {
            type: String,
            required: true,
            trim: true,
            enum: ['temperature', 'humidity', 'illuminance']
        },
        minThreshold: {
            type: Number,
            required: true
        },
        maxThreshold: {
            type: Number,
            required: true
        },
        durationThreshold: {
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