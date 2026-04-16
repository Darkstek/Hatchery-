const express = require("express");
const router = express.Router();
const Gateway = require("../models/Gateway");
const apiKeyAuth = require("../middleware/apiKeyAuth");
const jwtAuth = require("../middleware/jwtAuth");

// POST /api/gateway/register — gateway se zaregistruje (chráněno API klíčem)
router.post("/register", apiKeyAuth, async (req, res) => {
  try {
    const { gatewayId, name, location } = req.body;

    if (!gatewayId || !name) {
      return res.status(400).json({ error: "Chybí gatewayId nebo name" });
    }

    const gateway = await Gateway.findOneAndUpdate(
      { gatewayId },
      { gatewayId, name, location: location || "Kurník", lastSeen: new Date() },
      { upsert: true, new: true },
    );

    res.status(201).json({ message: "Gateway zaregistrována", gateway });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba serveru" });
  }
});

// GET /api/gateway — seznam všech gateway (chráněno JWT)
router.get("/", jwtAuth, async (req, res) => {
  try {
    const gateways = await Gateway.find().sort({ lastSeen: -1 });

    const gatewaysWithStatus = gateways.map((gw) => {
      const threshold = new Date(Date.now() - 20 * 60 * 1000);
      return {
        ...gw.toObject(),
        online: gw.lastSeen > threshold,
      };
    });

    res.json(gatewaysWithStatus);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba serveru" });
  }
});

// PATCH /api/gateway/settings — uloží teplotní rozsah (chráněno JWT)
router.patch("/settings", jwtAuth, async (req, res) => {
  try {
    const { gatewayId, tempMin, tempMax } = req.body;

    if (!gatewayId || tempMin === undefined || tempMax === undefined) {
      return res
        .status(400)
        .json({ error: "Chybí gatewayId, tempMin nebo tempMax" });
    }

    const gateway = await Gateway.findOneAndUpdate(
      { gatewayId },
      { tempMin, tempMax },
      { new: true },
    );

    if (!gateway) {
      return res.status(404).json({ error: "Gateway nenalezena" });
    }

    res.json({
      message: "Nastavení uloženo",
      tempMin: gateway.tempMin,
      tempMax: gateway.tempMax,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba serveru" });
  }
});

module.exports = router;
