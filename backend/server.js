require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
 
const dataRoutes = require("./routes/data");
const gatewayRoutes = require("./routes/gateway");
const authRoutes = require("./routes/auth");
 
const app = express();
 
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "DELETE", "PUT", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-api-key", "x-gateway-id"],
}));
app.options("*", cors());
app.use(express.json());
 
// API routes
app.use("/api/data", dataRoutes);
app.use("/api/gateway", gatewayRoutes);
app.use("/api/auth", authRoutes);
 
// Health check
app.get("/api/status", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});
 
// Připojení k MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB připojeno"))
  .catch((err) => console.error("MongoDB chyba:", err));
 
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server běží na portu ${PORT}`));
 