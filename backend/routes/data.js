const express = require("express");
const router = express.Router();
const Measurement = require("../models/Measurement");
const Gateway = require("../models/Gateway");
const apiKeyAuth = require("../middleware/apiKeyAuth");
const jwtAuth = require("../middleware/jwtAuth");

// POST /api/data — gateway pošle batch měření (chráněno API klíčem)
router.post("/", apiKeyAuth, async (req, res) => {
  try {
    const gatewayId = req.headers["x-gateway-id"] || "gateway-01";
    const batch = Array.isArray(req.body) ? req.body : [req.body];

    if (batch.length === 0) {
      return res.status(400).json({ error: "Prázdný batch" });
    }

    // Načteme gateway s rozsahem teplot a předchozím stavem
    const gateway = await Gateway.findOne({ gatewayId });
    const tempMin = gateway?.tempMin ?? 20;
    const tempMax = gateway?.tempMax ?? 25;
    let prevWasAlert = gateway?.prevWasAlert ?? false;

    const docs = batch.map((item) => {
      const temp = item.temp ?? null;
      const msg = item.msg || "OK";

      // 1. Definujeme aktuální stav (problém vs. pohoda)
      const isCurrentlyInError = msg !== "OK" || temp === null || temp < tempMin || temp > tempMax;

      // 2. LOGIKA ZAZNAMENÁVÁNÍ ZMĚN (Stavový automat)
      const shouldAlert = isCurrentlyInError !== prevWasAlert;

      // Aktualizujeme stav pro další prvek v batchi
      prevWasAlert = isCurrentlyInError;

      let alertReason = null;
      if (shouldAlert) {
        if (isCurrentlyInError) {
          if (msg !== "OK") alertReason = msg;
          else if (temp === null) alertReason = "Senzor offline";
          else if (temp < tempMin) alertReason = "Teplota pod minimem";
          else if (temp > tempMax) alertReason = "Teplota nad maximem";
        } else {
          alertReason = "Teplota se vrátila do normy";
        }
      }

      // 3. OPRAVA ČASOVÉHO POSUNU (Vynucení UTC)
      // Vytvoříme aktuální čas a odečteme od něj 2 hodiny (7200000 ms), 
      // aby v DB bylo např. 17:13, když je u vás 19:13.
      const now = new Date();
      const correctedTimestamp = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      return {
        gatewayId,
        nodeId: item.nodeId || String(item.id),
        temperature: temp,
        msg,
        isAlert: shouldAlert,
        alertReason,
        dismissed: false,
        timestamp: correctedTimestamp,
      };
    });

    await Measurement.insertMany(docs);

    // Aktualizace brány se stejnou časovou korekcí
    const lastSeenCorrected = new Date(new Date().getTime() - 2 * 60 * 60 * 1000);

    // Aktualizace brány (lastSeen dostane čistý aktuální čas)
    await Gateway.findOneAndUpdate(
      { gatewayId },
      { lastSeen: lastSeenCorrected, prevWasAlert },
    );

    res.status(201).json({ message: "Data uložena", count: docs.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba serveru" });
  }
});

// GET /api/data — frontend si stáhne historii měření
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

// GET /api/data/latest — poslední měření
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

// GET /api/data/alerts — záznamy historie změn stavu
router.get("/alerts", jwtAuth, async (req, res) => {
  try {
    const alerts = await Measurement.find({
      isAlert: true,
      dismissed: { $ne: true },
    })
      .sort({ timestamp: -1 })
      .limit(50);

    res.json(alerts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba serveru" });
  }
});

// PATCH /api/data/:id/dismiss
router.patch("/:id/dismiss", jwtAuth, async (req, res) => {
  try {
    const updated = await Measurement.findByIdAndUpdate(
      req.params.id,
      { dismissed: true },
      { new: true },
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