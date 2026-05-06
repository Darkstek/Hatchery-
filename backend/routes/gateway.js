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

    // OPRAVA: Používáme korigovaný čas (-2h) pro konzistenci s data.js
    const nowCorrected = new Date(new Date().getTime() - 2 * 60 * 60 * 1000);

    const gateway = await Gateway.findOneAndUpdate(
      { gatewayId },
      { 
        gatewayId, 
        name, 
        location: location || "Inkubator - Domov", 
        lastSeen: nowCorrected 
      },
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
      // OPRAVA: Práh musíme počítat také z korigovaného času!
      // Pokud v DB máme 17:00 (korigovaných 19:00), 
      // musíme threshold počítat jako (19:00 - 2h) - 1 minuta = 16:59.
      const nowCorrected = new Date(new Date().getTime() - 2 * 60 * 60 * 1000);
      const threshold = new Date(nowCorrected.getTime() - 1 * 60 * 1000); // 1 minuta neaktivity

      return {
        ...gw.toObject(),
        // Porovnáváme korigovaný lastSeen s korigovaným prahem
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

// GET /api/gateway/settings — načte teplotní rozsah pro konkrétní gateway (chráněno JWT)
router.get("/settings", jwtAuth, async (req, res) => {
  try {
    const { gatewayId } = req.query;

    if (!gatewayId) {
      return res.status(400).json({ error: "Chybí gatewayId v dotazu (query)" });
    }

    const gateway = await Gateway.findOne({ gatewayId });

    if (!gateway) {
      return res.status(404).json({ error: "Gateway nenalezena" });
    }
 
    res.json({
      gatewayId: gateway.gatewayId,
      tempMin: gateway.tempMin,
      tempMax: gateway.tempMax,
      location: gateway.location,
      name: gateway.name
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba serveru při načítání nastavení" });
  }
});

module.exports = router;