const mongoose = require("mongoose");

const gatewaySchema = new mongoose.Schema({
  gatewayId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    default: "Kurník",
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
  registeredAt: {
    type: Date,
    default: Date.now,
  },
  tempMin: {
    type: Number,
    default: 20,
  },
  tempMax: {
    type: Number,
    default: 25,
  },
  prevWasAlert: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Gateway", gatewaySchema);
