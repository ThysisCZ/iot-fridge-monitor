//dependencies
const mongoose = require('mongoose');

//define fridge schema
const fridgeSchema = new mongoose.Schema(
    {
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        monitorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Monitor",
            required: false,
            default: null
        },
        memberIds: {
            type: Array,
            required: true
        },
        name: {
            type: String,
            required: true,
            minLength: 1,
            maxLength: 20
        },
        location: {
            type: String,
            required: true,
            minLength: 1,
            maxLength: 20
        },
        description: {
            type: String,
            required: false,
            maxLength: 30
        },
    },
    {
        timestamps: true,
    },
);

// export model
fridgeSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.__v;

        return returnedObject;
    }
});

module.exports = mongoose.models.Fridge || mongoose.model('Fridge', fridgeSchema);