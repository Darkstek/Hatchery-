const mongoose = require("mongoose");
 
const measurementSchema = new mongoose.Schema({
  gatewayId: {
    type: String,
    required: true,
  },
  nodeId: {
    type: Number, // Pavlovo "id"
  },
  temperature: {
    type: Number,
    default: null, // může být null když senzor offline
  },
  msg: {
    type: String,
    default: "OK",
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});
 
measurementSchema.index({ timestamp: -1 });
measurementSchema.index({ gatewayId: 1, timestamp: -1 });
 
module.exports = mongoose.model("Measurement", measurementSchema);
 