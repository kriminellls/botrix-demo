// n8n workflow'u veriyi bize PUSH ederse (POST /api/webhook/...), o veriyi
// bir sonraki istek gelene kadar bellekte tutan basit bir önbellek.
// Küçük/orta ölçek için yeterlidir; kalıcılık istersen bunun yerine bir DB
// (SQLite, Postgres vs.) kullanabilirsin.

const store = {
  stats: null,
  user: null,
  appointmentsByDate: {}, // { "2026-09-05": [ ... ] }
  lastUpdated: {
    stats: null,
    user: null,
    appointments: null,
  },
};

module.exports = {
  getStats: () => store.stats,
  setStats: (data) => {
    store.stats = data;
    store.lastUpdated.stats = new Date().toISOString();
  },
  getUser: () => store.user,
  setUser: (data) => {
    store.user = data;
    store.lastUpdated.user = new Date().toISOString();
  },
  getAppointments: (dateKey) => store.appointmentsByDate[dateKey],
  setAppointmentsForDate: (dateKey, items) => {
    store.appointmentsByDate[dateKey] = items;
    store.lastUpdated.appointments = new Date().toISOString();
  },
  // n8n toplu gönderirse (birden fazla günü tek seferde), hepsini birden yaz
  setAppointmentsBulk: (byDateObj) => {
    store.appointmentsByDate = { ...store.appointmentsByDate, ...byDateObj };
    store.lastUpdated.appointments = new Date().toISOString();
  },
  getLastUpdated: () => store.lastUpdated,
};
