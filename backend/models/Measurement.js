const mongoose = require("mongoose");

const measurementSchema = new mongoose.Schema({
  gatewayId: {
    type: String,
    required: true,
  },
  nodeId: {
    type: Number,
  },
  temperature: {
    type: Number,
    default: null,
  },
  msg: {
    type: String,
    default: "OK",
  },
  dismissed: {
    type: Boolean,
    default: false,
  },
  isAlert: {
    type: Boolean,
    default: false,
  },
  alertReason: {
    type: String,
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

measurementSchema.index({ timestamp: -1 });
measurementSchema.index({ gatewayId: 1, timestamp: -1 });

module.exports = mongoose.model("Measurement", measurementSchema);
