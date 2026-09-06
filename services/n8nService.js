const axios = require("axios");
const store = require("./dataStore");
const { mockAppointmentsByDate, mockStats, mockUser } = require("../data/mock");

const {
  N8N_BASE_URL,
  N8N_STATS_PATH,
  N8N_APPOINTMENTS_PATH,
  N8N_USER_PATH,
  N8N_SHARED_SECRET,
} = process.env;

const n8nEnabled = Boolean(N8N_BASE_URL);

const client = axios.create({
  baseURL: N8N_BASE_URL || undefined,
  timeout: 8000,
  headers: N8N_SHARED_SECRET ? { "x-webhook-secret": N8N_SHARED_SECRET } : {},
});

/**
 * PULL modeli: n8n'deki Webhook node'unu doğrudan çağırır.
 * n8n tarafında path GET isteği kabul etmeli ve "Respond to Webhook" node'u
 * ile aşağıdaki şekillerden birine uygun JSON döndürmeli.
 */
async function fetchFromN8n(path, params) {
  if (!n8nEnabled) return null;
  try {
    const res = await client.get(path, { params });
    return res.data;
  } catch (err) {
    console.error(`[n8n] ${path} çağrısı başarısız:`, err.message);
    return null;
  }
}

// ---- STATS ----
// Beklenen n8n cevabı (JSON):
// {
//   "botSayesindeAlinan": { "value": 28, "changePercent": 12, "period": "Bu hafta" },
//   "tahminiKazandirilan": { "value": 14860, "currency": "TRY", "changePercent": 18, "period": "Bu hafta" },
//   "cevaplananMesaj": { "value": 186, "changePercent": 24, "period": "Son 7 gün" },
//   "noShowOrani": { "value": 4.2, "changePercent": -1.8, "period": "Geçen aya göre" }
// }
async function getStats() {
  const pushed = store.getStats();
  if (pushed) return pushed;

  const pulled = await fetchFromN8n(N8N_STATS_PATH);
  if (pulled) return pulled;

  return mockStats;
}

// ---- USER / HEADER ----
// Beklenen n8n cevabı:
// { "name": "Berke", "businessName": "Luna Studio", "botActive": true }
async function getUser() {
  const pushed = store.getUser();
  if (pushed) return pushed;

  const pulled = await fetchFromN8n(N8N_USER_PATH);
  if (pulled) return pulled;

  return mockUser;
}

// ---- APPOINTMENTS ----
// dateKey formatı: "YYYY-MM-DD"
// Beklenen n8n cevabı (o gün için dizi):
// [
//   { "id": "abc123", "time": "15:30", "customerName": "Ayşe Demir",
//     "status": "onaylandi" | "beklemede" | "iptal", "note": "Randevu" }
// ]
async function getAppointmentsByDate(dateKey) {
  const pushed = store.getAppointments(dateKey);
  if (pushed) return pushed;

  const pulled = await fetchFromN8n(N8N_APPOINTMENTS_PATH, { date: dateKey });
  if (pulled) return pulled;

  return mockAppointmentsByDate[dateKey] || [];
}

// Takvimde hangi günlerde kaç randevu olduğunu göstermek için (nokta/badge).
// Şimdilik mock veriden ya da push edilen önbellekten türetiyoruz;
// istersen n8n'e ayrı bir "aylık özet" endpoint'i de ekleyebilirsin.
async function getMonthSummary(year, month) {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  const summary = {};

  Object.entries(mockAppointmentsByDate).forEach(([key, items]) => {
    if (key.startsWith(prefix)) summary[key] = items.length;
  });

  // Push edilen (n8n'den gerçek zamanlı gelen) veriler varsa üzerine yazsın
  const lastUpdated = store.getLastUpdated();
  if (lastUpdated.appointments) {
    // dataStore içindeki appointmentsByDate private olduğu için burada
    // basitçe getAppointments üzerinden erişmek yerine, ileride istersen
    // dataStore'a getAllAppointments() ekleyebilirsin.
  }

  return summary;
}

module.exports = {
  n8nEnabled,
  getStats,
  getUser,
  getAppointmentsByDate,
  getMonthSummary,
};
