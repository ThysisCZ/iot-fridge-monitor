//dependencies
const mongoose = require("mongoose");

//define monitor schema
const monitorSchema = new mongoose.Schema(
  {
    fridgeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fridge",
      required: true,
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
      required: true,
      min: 0,
    },
    pairedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["active", "offline", "sleeping"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);

// export model
module.exports = mongoose.model("MonitorSchema", monitorSchema);
