/**
 * Form support APIs: nearest branches, appointment slot availability.
 */

const fs = require('fs');
const path = require('path');

const BRANCHES_PATH = path.join(__dirname, '..', 'data', 'branches.json');
const BOOKED_PATH = path.join(__dirname, '..', 'data', 'appointment-booked.json');

const COUNTRY_DIAL = {
  IN: '+91',
  US: '+1',
  CA: '+1',
  GB: '+44',
  AE: '+971',
  AU: '+61',
  SG: '+65',
  SA: '+966',
  QA: '+974',
  OM: '+968',
  KW: '+965',
  BH: '+973',
  NP: '+977',
  BD: '+880',
  LK: '+94',
  PK: '+92',
  MY: '+60',
  DE: '+49',
  FR: '+33',
  IT: '+39',
  ES: '+34',
};

function isoToFlag(iso) {
  const up = String(iso || '')
    .trim()
    .toUpperCase();
  if (up.length !== 2) return '';
  return String.fromCodePoint(
    ...[...up].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}

function countryToDial(iso) {
  const cc = String(iso || '')
    .trim()
    .toUpperCase();
  return COUNTRY_DIAL[cc] || '+91';
}

async function detectCountryFromCoords(lat, lng) {
  const latN = Number(lat);
  const lngN = Number(lng);
  if (!Number.isFinite(latN) || !Number.isFinite(lngN)) {
    return { error: 'invalid_coordinates' };
  }
  try {
    const url =
      'https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=' +
      encodeURIComponent(latN) +
      '&longitude=' +
      encodeURIComponent(lngN) +
      '&localityLanguage=en';
    const res = await fetch(url);
    if (!res.ok) throw new Error('geocode_http_' + res.status);
    const data = await res.json();
    const countryCode = String(data.countryCode || '').toUpperCase();
    const dialCode = countryToDial(countryCode);
    const flag = isoToFlag(countryCode);
    return { countryCode, dialCode, flag };
  } catch (err) {
    return { error: 'geocode_failed', message: err.message };
  }
}

function loadJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function loadBranches() {
  const raw = loadJson(BRANCHES_PATH, []);
  return Array.isArray(raw) ? raw : [];
}

function loadBooked() {
  const raw = loadJson(BOOKED_PATH, {});
  return raw && typeof raw === 'object' ? raw : {};
}

function nearestBranches(lat, lng, limit = 5) {
  const latN = Number(lat);
  const lngN = Number(lng);
  if (!Number.isFinite(latN) || !Number.isFinite(lngN)) {
    return { branches: [], error: 'invalid_coordinates' };
  }
  const max = Math.min(Math.max(parseInt(limit, 10) || 5, 1), 20);
  const branches = loadBranches()
    .map((b) => {
      const dist = haversineKm(latN, lngN, Number(b.lat), Number(b.lng));
      return {
        id: String(b.id || ''),
        name: String(b.name || ''),
        city: String(b.city || ''),
        area: String(b.area || ''),
        distanceKm: Math.round(dist * 10) / 10,
      };
    })
    .filter((b) => b.id && b.name)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, max);
  return { branches };
}

function parseTimeToMinutes(t) {
  const m = String(t || '').match(/^(\d{1,2}):(\d{2})$/);
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

function appointmentSlots(scope, doctorId, date, options = {}) {
  const day = String(date || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return { error: 'invalid_date', bookedTimes: [], fullyBookedDates: [] };
  }
  const booked = loadBooked();
  const dayStart = options.dayStart || '09:00';
  const dayEnd = options.dayEnd || '18:00';
  const slotMinutes = options.slotMinutes || 30;
  const allSlots = buildSlotList(dayStart, dayEnd, slotMinutes);

  let fullyBookedDates = [];
  let bookedTimes = [];

  if (scope === 'doctor' && doctorId) {
    const doc = booked.doctors && booked.doctors[String(doctorId)];
    if (doc) {
      fullyBookedDates = Array.isArray(doc.fullyBookedDates) ? doc.fullyBookedDates : [];
      const byDate = doc.slotsByDate && doc.slotsByDate[day];
      bookedTimes = Array.isArray(byDate) ? byDate : [];
    }
  } else {
    const gen = booked.general || {};
    fullyBookedDates = Array.isArray(gen.fullyBookedDates) ? gen.fullyBookedDates : [];
    const byDate = gen.slotsByDate && gen.slotsByDate[day];
    bookedTimes = Array.isArray(byDate) ? byDate : [];
  }

  const availableTimes = allSlots.filter((t) => bookedTimes.indexOf(t) < 0);

  return {
    date: day,
    scope: scope === 'doctor' ? 'doctor' : 'general',
    doctorId: doctorId || '',
    fullyBookedDates,
    bookedTimes,
    availableTimes,
    allSlots,
  };
}

module.exports = {
  nearestBranches,
  appointmentSlots,
  detectCountryFromCoords,
  countryToDial,
  isoToFlag,
  COUNTRY_DIAL,
  BRANCHES_PATH,
  BOOKED_PATH,
};
