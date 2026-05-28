/**
 * One-file Hindi / Marathi / English replies by Dialogflow intent name.
 * No Google Translate API — applied on server after detectIntent (same API count).
 */

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'intent-responses.json');

let cache = null;
let cacheMtime = 0;

function normalizeLang(code) {
  const c = String(code || '')
    .trim()
    .toLowerCase();
  if (!c || c === 'en') return 'en';
  return c.split('-')[0];
}

function isEnabled() {
  if (process.env.INTENT_RESPONSES_ENABLED === 'false') return false;
  if (process.env.INTENT_RESPONSES_ENABLED === 'true') return true;
  return fs.existsSync(DATA_PATH);
}

function loadData() {
  if (!fs.existsSync(DATA_PATH)) {
    cache = {};
    return cache;
  }
  const stat = fs.statSync(DATA_PATH);
  if (cache && stat.mtimeMs === cacheMtime) return cache;

  const raw = fs.readFileSync(DATA_PATH, 'utf8');
  const parsed = JSON.parse(raw);
  cache = {};
  Object.keys(parsed).forEach((key) => {
    if (key.startsWith('_')) return;
    cache[key.trim()] = parsed[key];
  });
  cacheMtime = stat.mtimeMs;
  return cache;
}

function pickLocalized(block, lang) {
  if (!block || typeof block !== 'object') return null;
  const L = normalizeLang(lang);
  if (block[L] != null && String(block[L]).trim()) return String(block[L]).trim();
  if (block.en != null && String(block.en).trim()) return String(block.en).trim();
  return null;
}

function pickLocalizedList(block, lang) {
  if (!block || typeof block !== 'object') return null;
  const L = normalizeLang(lang);
  const list = block[L] || block.en;
  if (!Array.isArray(list)) return null;
  return list.map((x) => String(x == null ? '' : x));
}

function lookupEntry(intentName, eventName) {
  const data = loadData();
  if (eventName) {
    const eventKey = '@event:' + String(eventName).trim();
    if (data[eventKey]) return data[eventKey];
  }
  if (!intentName) return null;
  const name = String(intentName).trim();
  if (data[name]) return data[name];
  const lower = name.toLowerCase();
  const found = Object.keys(data).find((k) => k.toLowerCase() === lower);
  return found ? data[found] : null;
}

/**
 * @param {object} result — dialogflow parseQueryResult output
 * @param {string} uiLanguageCode — en | hi | mr (from widget UI)
 * @param {string} [eventName]
 */
function applyToResult(result, uiLanguageCode, eventName) {
  if (!isEnabled() || !result) return result;
  const lang = normalizeLang(uiLanguageCode);
  if (lang === 'en') return result;

  const entry = lookupEntry(result.intent, eventName);
  if (!entry) return result;

  const out = { ...result };
  let applied = false;

  const reply = pickLocalized(entry.reply, lang);
  if (reply) {
    out.reply = reply;
    applied = true;
  }

  const chipHeading = pickLocalized(entry.chipHeading, lang);
  if (chipHeading) {
    out.chipHeading = chipHeading;
    applied = true;
  }

  const chipLabels = pickLocalizedList(entry.chips, lang);
  if (chipLabels && Array.isArray(out.chips) && out.chips.length) {
    out.chips = out.chips.map((chip, i) => {
      if (chipLabels[i] == null) return chip;
      return { ...chip, label: chipLabels[i] };
    });
    applied = true;
  }

  if (applied) {
    out.localizedFromFile = true;
    out.uiLanguageCode = lang;
  }
  return out;
}

function reload() {
  cache = null;
  cacheMtime = 0;
  return loadData();
}

module.exports = {
  applyToResult,
  isEnabled,
  reload,
  DATA_PATH,
};
