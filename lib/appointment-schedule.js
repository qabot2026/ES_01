/**
 * Appointment timing: per weekday, date overrides, slot period (minutes).
 * Edit data/appointment-schedule.json (or set APPOINTMENT_SCHEDULE_PATH).
 */

const fs = require('fs');
const path = require('path');
const { to24h, to12h } = require('./time-format');

const SCHEDULE_PATH =
  process.env.APPOINTMENT_SCHEDULE_PATH ||
  path.join(__dirname, '..', 'data', 'appointment-schedule.json');

const WEEKDAY_NAMES = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

function loadJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function defaultSchedule() {
  return {
    slotMinutes: 30,
    default: {
      periods: [{ start: '9:00 AM', end: '6:00 PM' }],
    },
    weekdays: {
      sunday: { closed: true },
    },
    dates: {},
    scopes: {},
  };
}

function loadSchedule() {
  const raw = loadJson(SCHEDULE_PATH, defaultSchedule());
  if (!raw || typeof raw !== 'object') return defaultSchedule();
  return raw;
}

function parseTimeToMinutes(t) {
  const s24 = to24h(t);
  const m = String(s24 || '').match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

function minutesToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

function buildSlotList(dayStart, dayEnd, slotMinutes) {
  const start = parseTimeToMinutes(dayStart) ?? 9 * 60;
  const end = parseTimeToMinutes(dayEnd) ?? 18 * 60;
  const step = Math.max(parseInt(slotMinutes, 10) || 30, 5);
  const slots = [];
  for (let t = start; t < end; t += step) {
    slots.push(minutesToTime(t));
  }
  return slots;
}

/** Normalize day config → [{ start, end }, ...] (12h strings preserved for display). */
function normalizePeriods(dayCfg) {
  if (!dayCfg || dayCfg.closed) return [];
  let raw = [];
  if (Array.isArray(dayCfg.periods) && dayCfg.periods.length) {
    raw = dayCfg.periods.map((p) => ({
      start: String(p.start || p.dayStart || '').trim(),
      end: String(p.end || p.dayEnd || '').trim(),
    }));
  } else {
    const start = dayCfg.dayStart || dayCfg.start;
    const end = dayCfg.dayEnd || dayCfg.end;
    if (start && end) raw = [{ start: String(start), end: String(end) }];
  }
  return raw
    .filter((p) => p.start && p.end)
    .map((p) => ({
      start: to12h(p.start),
      end: to12h(p.end),
    }))
    .filter((p) => to24h(p.start) && to24h(p.end));
}

function weekdayNameFromIso(dateIso) {
  const parts = String(dateIso || '').split('-').map((x) => parseInt(x, 10));
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return 'monday';
  const d = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
  return WEEKDAY_NAMES[d.getDay()] || 'monday';
}

function pickSlotMinutes(...candidates) {
  for (let i = 0; i < candidates.length; i += 1) {
    const n = parseInt(candidates[i], 10);
    if (Number.isFinite(n) && n >= 5) return Math.min(n, 240);
  }
  return 30;
}

function applyDayLayer(base, layer) {
  if (!layer || typeof layer !== 'object') return base;
  if (layer.closed) {
    return { closed: true, slotMinutes: base.slotMinutes, periods: [] };
  }
  const next = {
    closed: false,
    slotMinutes: pickSlotMinutes(layer.slotMinutes, base.slotMinutes),
    periods: base.periods.slice(),
  };
  const periods = normalizePeriods(layer);
  if (periods.length) next.periods = periods;
  return next;
}

/**
 * Resolve hours + slot period for a calendar date and scope (general | doctor).
 */
function resolveForDate(scope, dateIso) {
  const schedule = loadSchedule();
  const scopeKey = String(scope || 'general').toLowerCase() === 'doctor' ? 'doctor' : 'general';
  const scopeBlock =
    schedule.scopes && schedule.scopes[scopeKey] ? schedule.scopes[scopeKey] : null;

  let slotMinutes = pickSlotMinutes(
    scopeBlock && scopeBlock.slotMinutes,
    schedule.slotMinutes
  );

  let periods = normalizePeriods(schedule.default);
  if (!periods.length) periods = [{ start: '9:00 AM', end: '6:00 PM' }];

  if (scopeBlock && scopeBlock.default) {
    const scopeDefault = normalizePeriods(scopeBlock.default);
    if (scopeDefault.length) periods = scopeDefault;
    slotMinutes = pickSlotMinutes(scopeBlock.slotMinutes, slotMinutes);
  }

  const weekday = weekdayNameFromIso(dateIso);
  const weekdayLayer =
    (scopeBlock && scopeBlock.weekdays && scopeBlock.weekdays[weekday]) ||
    (schedule.weekdays && schedule.weekdays[weekday]);

  let resolved = applyDayLayer(
    { closed: false, slotMinutes, periods },
    weekdayLayer
  );

  const dateLayer =
    (scopeBlock && scopeBlock.dates && scopeBlock.dates[dateIso]) ||
    (schedule.dates && schedule.dates[dateIso]);

  if (dateLayer) {
    resolved = applyDayLayer(resolved, dateLayer);
  }

  return {
    closed: !!resolved.closed,
    slotMinutes: resolved.slotMinutes,
    periods: resolved.periods,
    weekday,
    date: dateIso,
    scope: scopeKey,
  };
}

function buildAllSlots(resolved) {
  if (!resolved || resolved.closed || !resolved.periods.length) return [];
  const seen = {};
  const all = [];
  resolved.periods.forEach((per) => {
    buildSlotList(per.start, per.end, resolved.slotMinutes).forEach((slot) => {
      if (!seen[slot]) {
        seen[slot] = true;
        all.push(slot);
      }
    });
  });
  return all.sort();
}

function getScheduleForClient() {
  const s = loadSchedule();
  return {
    path: SCHEDULE_PATH,
    slotMinutes: s.slotMinutes ?? 30,
    default: s.default || { periods: [{ start: '9:00 AM', end: '6:00 PM' }] },
    weekdays: s.weekdays || {},
    dates: s.dates || {},
    scopes: s.scopes || {},
    weekdayNames: WEEKDAY_NAMES,
  };
}

module.exports = {
  SCHEDULE_PATH,
  WEEKDAY_NAMES,
  loadSchedule,
  resolveForDate,
  buildAllSlots,
  buildSlotList,
  getScheduleForClient,
  normalizePeriods,
};
