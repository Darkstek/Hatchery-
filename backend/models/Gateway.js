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
});
 
module.exports = mongoose.model("Gateway", gatewaySchema);