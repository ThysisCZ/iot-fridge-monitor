//dependencies
const mongoose = require("mongoose");

//define monitor schema
const monitorSchema = new mongoose.Schema(
    {
        _id: { type: String }, // allow radio ID string
        fridgeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Fridge",
            required: false,
            default: null
        },
        gatewayId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Gateway",
            required: true,
        },
        firmwareVersion: {
            type: String,
            required: true,
            trim: true,
        },
        batteryLevel: {
            type: Number,
            required: false,
            min: 0,
        },
        pairedAt: {
            type: Date,
            required: false,
            default: null
        },
        status: {
            type: String,
            enum: ["active", "offline"],
            required: true,
            default: "active",
        },
    },
    {
        timestamps: true,
    },
);

// export model
monitorSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.__v;

        return returnedObject;
    }
});

module.exports = mongoose.models.Monitor || mongoose.model('Monitor', monitorSchema);
