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
  /* Off by default — use phrase-translations.json for whole-bot text. Set true to enable. */
  if (process.env.INTENT_RESPONSES_ENABLED === 'true') return true;
  if (process.env.USE_INTENT_RESPONSE_FILE === 'true') return fs.existsSync(DATA_PATH);
  return false;
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

/** Text field: string or string[] (multiple lines joined with newline). */
function pickLocalized(block, lang) {
  if (!block || typeof block !== 'object') return null;
  const L = normalizeLang(lang);
  let val = block[L] != null ? block[L] : block.en;
  if (Array.isArray(val)) {
    const lines = val.map((x) => String(x == null ? '' : x).trim()).filter(Boolean);
    return lines.length ? lines.join('\n') : null;
  }
  if (val != null && String(val).trim()) return String(val).trim();
  return null;
}

function pickLocalizedList(block, lang) {
  if (!block || typeof block !== 'object') return null;
  const L = normalizeLang(lang);
  const list = block[L] || block.en;
  if (!Array.isArray(list)) return null;
  return list.map((x) => String(x == null ? '' : x));
}

function entryAliases(entry) {
  if (!entry || typeof entry !== 'object') return [];
  const raw = entry.aliases;
  if (!Array.isArray(raw)) return [];
  return raw.map((a) => String(a).trim()).filter(Boolean);
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
  let found = Object.keys(data).find((k) => k.toLowerCase() === lower);
  if (found) return data[found];
  found = Object.keys(data).find((k) =>
    entryAliases(data[k]).some((a) => a.toLowerCase() === lower)
  );
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

  const entry = lookupEntry(result.intent, eventName);
  if (!entry) {
    if (lang !== 'en' && result.intent) {
      return {
        ...result,
        intentResponseMiss: true,
      };
    }
    return result;
  }

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
