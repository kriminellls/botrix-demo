// n8n henüz bağlanmadığında panelin boş görünmemesi için örnek veriler.
// n8n devreye girince bu dosyaya hiç ihtiyaç kalmaz; services/n8nService.js
// gerçek veriyi çekemezse otomatik olarak buraya düşer (fallback).

function pad(n) {
  return String(n).padStart(2, "0");
}

function toKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const today = new Date();

const names = [
  "Ece Şahin",
  "Mert Yılmaz",
  "Zeynep Arslan",
  "Ayşe Demir",
  "Seda Kılıç",
  "Can Öztürk",
  "Elif Kaya",
];

function buildAppointments() {
  const map = {};
  for (let offset = -3; offset <= 5; offset++) {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    const key = toKey(d);
    const count = Math.abs((offset * 7) % 4);
    const items = [];
    const times = ["10:00", "11:30", "14:00", "15:30", "17:00"];
    const statuses = ["onaylandi", "onaylandi", "beklemede", "iptal"];
    for (let i = 0; i < Math.max(1, count); i++) {
      items.push({
        id: `${key}-${i}`,
        time: times[i % times.length],
        customerName: names[(i + offset + names.length) % names.length],
        status: statuses[(i + offset + statuses.length) % statuses.length],
        note: "Randevu",
      });
    }
    map[key] = items.sort((a, b) => a.time.localeCompare(b.time));
  }
  return map;
}

const mockAppointmentsByDate = buildAppointments();

const mockStats = {
  botSayesindeAlinan: { value: 28, changePercent: 12, period: "Bu hafta" },
  tahminiKazandirilan: { value: 14860, currency: "TRY", changePercent: 18, period: "Bu hafta" },
  cevaplananMesaj: { value: 186, changePercent: 24, period: "Son 7 gün" },
  noShowOrani: { value: 4.2, changePercent: -1.8, period: "Geçen aya göre" },
};

const mockUser = {
  name: "Berke",
  businessName: "Luna Studio",
  botActive: true,
};

module.exports = { mockAppointmentsByDate, mockStats, mockUser, toKey };
