const MONTHS_TR = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];
const DAYS_TR = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

const STATUS_META = {
  onaylandi: { label: "Onaylandı", accent: "#1f5a44", bg: "#e5efe8" },
  beklemede: { label: "Onay bekliyor", accent: "#9c6a11", bg: "#faf0dc" },
  iptal: { label: "İptal", accent: "#a8433a", bg: "#f8e6e3" },
};

const state = {
  viewYear: new Date().getFullYear(),
  viewMonth: new Date().getMonth() + 1, // 1-12
  selectedDate: formatDateKey(new Date()),
  calendarSummary: {},
};

function pad(n) { return String(n).padStart(2, "0"); }

function formatDateKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseDateKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function greetingByHour() {
  const h = new Date().getHours();
  if (h < 6) return "İyi geceler";
  if (h < 12) return "Günaydın";
  if (h < 18) return "İyi günler";
  return "İyi akşamlar";
}

async function fetchJSON(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

// ---------- Header ----------
async function loadUser() {
  try {
    const user = await fetchJSON("/api/user");
    document.getElementById("userName").textContent = `${greetingByHour()}, ${user.name}`;
    document.getElementById("greetingText").innerHTML =
      `${greetingByHour()}, ${user.name} <span class="wave">👋</span>`;
    document.getElementById("businessLine").textContent = user.businessName || "";
    const statusEl = document.getElementById("botStatus");
    statusEl.innerHTML = user.botActive
      ? '<span class="dot dot--on"></span> Bot aktif'
      : '<span class="dot" style="background:#a8433a"></span> Bot pasif';
  } catch (e) {
    document.getElementById("businessLine").textContent = "Veriler yüklenemedi";
  }
}

// ---------- Stats ----------
function formatCurrency(value) {
  return "₺" + Number(value).toLocaleString("tr-TR");
}

function renderStatCard({ label, value, changePercent, period, accent }) {
  const up = changePercent >= 0;
  return `
    <div class="stat-card" style="--stat-accent:${accent}">
      <p class="stat-label">${label}</p>
      <p class="stat-value">${value}</p>
      <div class="stat-foot">
        <span class="stat-period">${period}</span>
        <span class="stat-change ${up ? "stat-change--up" : "stat-change--down"}">
          ${up ? "+" : ""}${changePercent}%
        </span>
      </div>
    </div>`;
}

async function loadStats() {
  const grid = document.getElementById("statGrid");
  try {
    const s = await fetchJSON("/api/stats");
    grid.innerHTML = [
      renderStatCard({
        label: "Bot sayesinde alınan randevu",
        value: s.botSayesindeAlinan.value,
        changePercent: s.botSayesindeAlinan.changePercent,
        period: s.botSayesindeAlinan.period,
        accent: "#1f5a44",
      }),
      renderStatCard({
        label: "Tahmini kazandırılan",
        value: formatCurrency(s.tahminiKazandirilan.value),
        changePercent: s.tahminiKazandirilan.changePercent,
        period: s.tahminiKazandirilan.period,
        accent: "#1f5a44",
      }),
      renderStatCard({
        label: "Cevaplanan mesaj",
        value: s.cevaplananMesaj.value,
        changePercent: s.cevaplananMesaj.changePercent,
        period: s.cevaplananMesaj.period,
        accent: "#1f5a44",
      }),
      renderStatCard({
        label: "No-show oranı",
        value: s.noShowOrani.value + "%",
        changePercent: s.noShowOrani.changePercent,
        period: s.noShowOrani.period,
        accent: "#a8433a",
      }),
    ].join("");
  } catch (e) {
    grid.innerHTML = `<p class="empty-state">İstatistikler yüklenemedi.</p>`;
  }
}

// ---------- Calendar ----------
async function loadCalendarSummary() {
  try {
    state.calendarSummary = await fetchJSON(
      `/api/calendar-summary?year=${state.viewYear}&month=${state.viewMonth}`
    );
  } catch (e) {
    state.calendarSummary = {};
  }
}

function renderCalendar() {
  document.getElementById("monthLabel").textContent =
    `${MONTHS_TR[state.viewMonth - 1]} ${state.viewYear}`;

  const grid = document.getElementById("dayGrid");
  grid.innerHTML = "";

  const firstOfMonth = new Date(state.viewYear, state.viewMonth - 1, 1);
  // Pazartesi=0 ... Pazar=6 olacak şekilde kaydır
  const jsDay = firstOfMonth.getDay(); // 0=Pazar
  const leadingBlank = (jsDay + 6) % 7;

  const daysInMonth = new Date(state.viewYear, state.viewMonth, 0).getDate();
  const todayKey = formatDateKey(new Date());

  for (let i = 0; i < leadingBlank; i++) {
    const cell = document.createElement("div");
    cell.className = "day-cell is-muted";
    grid.appendChild(cell);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(state.viewYear, state.viewMonth - 1, day);
    const key = formatDateKey(dateObj);
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "day-cell";
    if (key === todayKey) cell.classList.add("is-today");
    if (key === state.selectedDate) cell.classList.add("is-selected");

    const count = state.calendarSummary[key] || 0;
    let dotsHtml = "";
    if (count > 0) {
      // basit gösterim: onaylandı rengini kullan (özet API'si sadece adet döndürüyor)
      dotsHtml = `<span class="day-dots"><span class="day-dot day-dot--onaylandi"></span></span>`;
    }

    cell.innerHTML = `<span>${day}</span>${dotsHtml}`;
    cell.addEventListener("click", () => selectDate(key));
    grid.appendChild(cell);
  }
}

function changeMonth(delta) {
  let m = state.viewMonth + delta;
  let y = state.viewYear;
  if (m < 1) { m = 12; y -= 1; }
  if (m > 12) { m = 1; y += 1; }
  state.viewMonth = m;
  state.viewYear = y;
  loadCalendarSummary().then(renderCalendar);
}

// ---------- Appointments ----------
function renderAppointments(dateKey, items) {
  const dateObj = parseDateKey(dateKey);
  const label = `${dateObj.getDate()} ${MONTHS_TR[dateObj.getMonth()]} ${dateObj.getFullYear()}, ${DAYS_TR[(dateObj.getDay() + 6) % 7]}`;
  document.getElementById("selectedDateLabel").textContent = label;

  const list = document.getElementById("appointmentsList");
  if (!items || items.length === 0) {
    list.innerHTML = `<p class="empty-state">Bu tarihte randevu yok.</p>`;
    return;
  }

  list.innerHTML = items.map((item) => {
    const meta = STATUS_META[item.status] || STATUS_META.onaylandi;
    return `
      <div class="appointment-row" style="--row-accent:${meta.accent}; --row-bg:${meta.bg}">
        <span class="appointment-time">${item.time}</span>
        <div>
          <p class="appointment-name">${item.customerName}</p>
          <p class="appointment-note">${item.note || "Randevu"}</p>
        </div>
        <span class="appointment-status">${meta.label}</span>
      </div>`;
  }).join("");
}

async function selectDate(dateKey) {
  state.selectedDate = dateKey;
  renderCalendar();
  const list = document.getElementById("appointmentsList");
  list.innerHTML = `<p class="empty-state">Yükleniyor…</p>`;
  try {
    const data = await fetchJSON(`/api/appointments?date=${dateKey}`);
    renderAppointments(dateKey, data.items);
  } catch (e) {
    list.innerHTML = `<p class="empty-state">Randevular yüklenemedi.</p>`;
  }
}

// ---------- Init ----------
document.getElementById("prevMonth").addEventListener("click", () => changeMonth(-1));
document.getElementById("nextMonth").addEventListener("click", () => changeMonth(1));
document.getElementById("todayBtn").addEventListener("click", () => {
  const now = new Date();
  state.viewYear = now.getFullYear();
  state.viewMonth = now.getMonth() + 1;
  loadCalendarSummary().then(() => {
    renderCalendar();
    selectDate(formatDateKey(now));
  });
});

(async function init() {
  loadUser();
  loadStats();
  await loadCalendarSummary();
  renderCalendar();
  selectDate(state.selectedDate);
})();
