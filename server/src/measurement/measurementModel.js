//dependencies
const mongoose = require("mongoose");

//define measurement schema
const measurementSchema = new mongoose.Schema(
    {
        monitorId: {
            type: String,
            ref: "Monitor",
            required: true,
        },
        fridgeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Fridge",
            required: true,
        },
        temperature: {
            type: Number,
            required: true,
        },
        humidity: {
            type: Number,
            required: true,
        },
        illuminance: {
            type: Number,
            required: true,
        },
        timestamp: {
            type: String,
            required: true,
        }
    },
    {
        timestamps: true,
    },
);

//export model
measurementSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.__v;

        return returnedObject;
    }
});

//export model
module.exports = mongoose.models.Measurement || mongoose.model("Measurement", measurementSchema);
