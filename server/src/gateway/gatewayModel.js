//dependencies
const mongoose = require('mongoose');

//define gateway schema
const gatewaySchema = new mongoose.Schema(
    {
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        name: {
            type: String,
            required: true,
            trim: true,
            minLength: 1,
            maxLength: 20
        },
        apiKey: {
            type: String,
            required: true,
            unique: true
        },
        status: {
            type: String,
            enum: ['active', 'offline'],
            default: 'active'
        },
        lastSeen: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

gatewaySchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.__v;
        return returnedObject;
    }
});

module.exports = mongoose.models.Gateway || mongoose.model('Gateway', gatewaySchema);