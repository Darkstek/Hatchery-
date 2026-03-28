const express = require("express");
const router = express.Router();
const Measurement = require("../models/Measurement");
const Gateway = require("../models/Gateway");
const apiKeyAuth = require("../middleware/apiKeyAuth");
const jwtAuth = require("../middleware/jwtAuth");

// POST /api/data — gateway pošle batch měření (chráněno API klíčem)
// Přijímá pole objektů: [{ id, temp, time, msg }, ...]
router.post("/", apiKeyAuth, async (req, res) => {
  try {
    const gatewayId = req.headers["x-gateway-id"] || "gateway-01";
    const batch = Array.isArray(req.body) ? req.body : [req.body];

    if (batch.length === 0) {
      return res.status(400).json({ error: "Prázdný batch" });
    }

    // Převod Pavlova formátu na náš model
    const docs = batch.map((item) => ({
      gatewayId,
      nodeId: item.id,
      temperature: item.temp ?? null,
      msg: item.msg || "OK",
      timestamp: item.time ? new Date(item.time) : new Date(),
    }));

    await Measurement.insertMany(docs);

    // Aktualizace lastSeen u gateway
    await Gateway.findOneAndUpdate(
      { gatewayId },
      { lastSeen: new Date() }
    );

    res.status(201).json({ message: "Data uložena", count: docs.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba serveru" });
  }
});

// GET /api/data — frontend si stáhne historii měření (chráněno JWT)
router.get("/", jwtAuth, async (req, res) => {
  try {
    const { gatewayId, limit = 100, from, to } = req.query;

    const filter = {};
    if (gatewayId) filter.gatewayId = gatewayId;
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(to);
    }

    const measurements = await Measurement.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json(measurements);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba serveru" });
  }
});

// GET /api/data/latest — poslední měření pro každou gateway (chráněno JWT)
router.get("/latest", jwtAuth, async (req, res) => {
  try {
    const { gatewayId } = req.query;
    const filter = gatewayId ? { gatewayId } : {};

    const latest = await Measurement.findOne(filter).sort({ timestamp: -1 });

    if (!latest) {
      return res.status(404).json({ error: "Žádná data nenalezena" });
    }

    res.json(latest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba serveru" });
  }
});

// GET /api/data/alerts — záznamy kde msg není OK (chráněno JWT)
router.get("/alerts", jwtAuth, async (req, res) => {
  try {
    const alerts = await Measurement.find({ msg: { $ne: "OK" } })
      .sort({ timestamp: -1 })
      .limit(50);

    res.json(alerts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba serveru" });
  }
});

// PATCH /api/data/:id/dismiss — označí alert jako vyřešený (chráněno JWT)
router.patch("/:id/dismiss", jwtAuth, async (req, res) => {
  try {
    const updated = await Measurement.findByIdAndUpdate(
      req.params.id,
      { dismissed: true },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: "Záznam nenalezen" });
    }
    res.json({ message: "Alert vyřešen" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba serveru" });
  }
});

module.exports = router;