const express = require("express");
const router = express.Router();
const n8nService = require("../services/n8nService");
const store = require("../services/dataStore");

function isValidDateKey(str) {
  return /^\d{4}-\d{2}-\d{2}$/.test(str || "");
}

// ---------- FRONTEND'İN OKUDUĞU UÇLAR (dashboard bunları çağırır) ----------

router.get("/user", async (req, res) => {
  const user = await n8nService.getUser();
  res.json(user);
});

router.get("/stats", async (req, res) => {
  const stats = await n8nService.getStats();
  res.json(stats);
});

router.get("/appointments", async (req, res) => {
  const { date } = req.query;
  if (!isValidDateKey(date)) {
    return res.status(400).json({ error: "date parametresi YYYY-MM-DD formatında olmalı" });
  }
  const items = await n8nService.getAppointmentsByDate(date);
  res.json({ date, items });
});

router.get("/calendar-summary", async (req, res) => {
  const year = parseInt(req.query.year, 10);
  const month = parseInt(req.query.month, 10); // 1-12
  if (!year || !month) {
    return res.status(400).json({ error: "year ve month parametreleri gerekli" });
  }
  const summary = await n8nService.getMonthSummary(year, month);
  res.json(summary);
});

// ---------- n8n'İN BİZE VERİ GÖNDERDİĞİ UÇLAR (PUSH modeli) ----------
// n8n workflow'unda bir HTTP Request node ile bu adreslere POST atarsan,
// panel bir sonraki n8n çağrısını beklemeden anında güncellenir.

function checkInboundSecret(req, res, next) {
  const expected = process.env.INBOUND_WEBHOOK_SECRET;
  if (!expected) return next(); // secret tanımlı değilse (dev ortamı) kontrolü atla
  const given = req.header("x-webhook-secret");
  if (given !== expected) {
    return res.status(401).json({ error: "Geçersiz webhook secret" });
  }
  next();
}

router.post("/webhook/stats", checkInboundSecret, (req, res) => {
  store.setStats(req.body);
  res.json({ ok: true });
});

router.post("/webhook/user", checkInboundSecret, (req, res) => {
  store.setUser(req.body);
  res.json({ ok: true });
});

// Body: { "date": "2026-09-05", "items": [ ... ] }
router.post("/webhook/appointments", checkInboundSecret, (req, res) => {
  const { date, items } = req.body || {};
  if (!isValidDateKey(date) || !Array.isArray(items)) {
    return res.status(400).json({ error: "Body: { date: 'YYYY-MM-DD', items: [...] } olmalı" });
  }
  store.setAppointmentsForDate(date, items);
  res.json({ ok: true });
});

// Body: { "2026-09-05": [ ... ], "2026-09-06": [ ... ] }
router.post("/webhook/appointments-bulk", checkInboundSecret, (req, res) => {
  store.setAppointmentsBulk(req.body || {});
  res.json({ ok: true });
});

module.exports = router;
