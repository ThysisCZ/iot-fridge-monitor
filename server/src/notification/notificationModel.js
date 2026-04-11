//dependencies
const mongoose = require('mongoose');

//define notification schema
const notificationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        ruleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Rule',
            required: true
        },
        fridgeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Fridge",
            required: true,
        },
        message: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

notificationSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.__v;

        return returnedObject;
    }
});

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);