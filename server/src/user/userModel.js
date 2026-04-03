//dependencies
const mongoose = require('mongoose');

//define user schema
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minLength: 1,
        maxLength: 16
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        minlength: 11,
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
module.exports = mongoose.model('User', userSchema);