//dependencies
const mongoose = require("mongoose");

//define measurement schema
const measurementSchema = new mongoose.Schema(
  {
    monitorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MonitorScheme",
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
  },
  {
    timestamps: true,
  },
);

//export model
module.exports = mongoose.model("Measurement", measurementSchema);
