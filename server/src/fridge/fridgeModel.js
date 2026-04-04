//dependencies
const mongoose = require('mongoose');

//define fridge schema
const fridgeSchema = new mongoose.Schema(
    {
        fridgeId: {
            type: String,
            trim: true
        }
    },
    {
        strict: false,
        timestamps: true
    }
);

module.exports = mongoose.models.Fridge || mongoose.model('Fridge', fridgeSchema);