const mongoose = require('mongoose');

const revokedTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true
    },
    revokedAt: {
        type: Date,
        default: Date.now,
        expires: 86400 //automatically deleted after 24 hours
    }
});

module.exports = mongoose.model('RevokedToken', revokedTokenSchema);