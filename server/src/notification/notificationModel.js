//dependencies
const mongoose = require('mongoose');

//define notification schema
const notificationSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            trim: true
        },
        fridgeId: {
            type: String,
            trim: true
        },
        ruleId: {
            type: String,
            trim: true
        },
        type: {
            type: String,
            required: true,
            trim: true
        },
        message: {
            type: String,
            required: true,
            trim: true
        },
        isRead: {
            type: Boolean,
            required: true,
            default: false
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
