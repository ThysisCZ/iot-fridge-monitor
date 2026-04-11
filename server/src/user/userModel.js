//dependencies
const mongoose = require('mongoose');

//define user schema
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minLength: 1,
        maxLength: 20
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address.']
    },
    passwordHash: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

//export model
userSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.__v;

        return returnedObject;
    }
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);