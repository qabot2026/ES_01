/**
 * Bot-wide phrase dictionary: exact English from Dialogflow → hi / mr.
 * Works on any intent, chips, dropdowns, carousels (display text only).
 */

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'phrase-translations.json');

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
  if (process.env.PHRASE_TRANSLATIONS_ENABLED === 'false') return false;
  if (process.env.PHRASE_TRANSLATIONS_ENABLED === 'true') return true;
  return fs.existsSync(DATA_PATH);
}

function loadPhrases() {
  if (!fs.existsSync(DATA_PATH)) {
    cache = {};
    return cache;
  }
  const stat = fs.statSync(DATA_PATH);
  if (cache && stat.mtimeMs === cacheMtime) return cache;

  const parsed = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  cache = {};
  Object.keys(parsed).forEach((key) => {
    if (key.startsWith('_')) return;
    cache[String(key).trim()] = parsed[key];
  });
  cacheMtime = stat.mtimeMs;
  return cache;
}

function translateLine(text, lang, phrases) {
  const key = String(text == null ? '' : text).trim();
  if (!key || lang === 'en') return text;
  const entry = phrases[key];
  if (!entry || typeof entry !== 'object') return text;
  const t = entry[lang];
  if (t != null && String(t).trim()) return String(t).trim();
  return text;
}

function translateMultiline(text, lang, phrases) {
  const raw = String(text == null ? '' : text);
  if (!raw.trim() || lang === 'en') return text;
  return raw
    .split('\n')
    .map((line) => translateLine(line, lang, phrases))
    .join('\n');
}

function applyToResult(result, uiLanguageCode) {
  if (!isEnabled() || !result) return result;
  const lang = normalizeLang(uiLanguageCode);
  if (lang === 'en') return result;

  const phrases = loadPhrases();
  const out = { ...result };
  let applied = false;

  function touch(field, fn) {
    if (out[field] == null) return;
    const next = fn(out[field]);
    if (next !== out[field]) {
      out[field] = next;
      applied = true;
    }
  }

  touch('reply', (v) => translateMultiline(v, lang, phrases));
  touch('chipHeading', (v) => translateMultiline(v, lang, phrases));

  if (Array.isArray(out.chips)) {
    out.chips = out.chips.map((chip) => {
      const label = translateLine(chip.label, lang, phrases);
      if (label === chip.label) return chip;
      applied = true;
      return { ...chip, label };
    });
  }

  if (Array.isArray(out.replyParts)) {
    out.replyParts = out.replyParts.map((p) => {
      if (p.type === 'text' && p.text) {
        const text = translateMultiline(p.text, lang, phrases);
        if (text === p.text) return p;
        applied = true;
        return { ...p, text };
      }
      if (p.type === 'link' && p.text) {
        const text = translateLine(p.text, lang, phrases);
        if (text === p.text) return p;
        applied = true;
        return { ...p, text };
      }
      return p;
    });
  }

  if (Array.isArray(out.dropdowns)) {
    out.dropdowns = out.dropdowns.map((d) => {
      let changed = false;
      const next = { ...d };
      if (d.message) {
        const m = translateLine(d.message, lang, phrases);
        if (m !== d.message) {
          next.message = m;
          changed = true;
        }
      }
      if (d.placeholder) {
        const p = translateLine(d.placeholder, lang, phrases);
        if (p !== d.placeholder) {
          next.placeholder = p;
          changed = true;
        }
      }
      if (Array.isArray(d.options)) {
        next.options = d.options.map((opt) => {
          const label = translateLine(opt.label, lang, phrases);
          if (label === opt.label) return opt;
          changed = true;
          return { ...opt, label };
        });
      }
      if (changed) applied = true;
      return next;
    });
  }

  if (Array.isArray(out.galleries)) {
    out.galleries = out.galleries.map((g) => {
      const message = g.message
        ? translateLine(g.message, lang, phrases)
        : g.message;
      if (message === g.message) return g;
      applied = true;
      return { ...g, message };
    });
  }

  if (Array.isArray(out.cardCarousels)) {
    out.cardCarousels = out.cardCarousels.map((car) => {
      let changed = false;
      const next = { ...car };
      if (car.message) {
        const m = translateLine(car.message, lang, phrases);
        if (m !== car.message) {
          next.message = m;
          changed = true;
        }
      }
      if (Array.isArray(car.cards)) {
        next.cards = car.cards.map((card) => {
          let cardChanged = false;
          const c = { ...card };
          ['title', 'subtitle', 'ctaLabel'].forEach((k) => {
            if (!card[k]) return;
            const t = translateLine(card[k], lang, phrases);
            if (t !== card[k]) {
              c[k] = t;
              cardChanged = true;
            }
          });
          if (Array.isArray(card.buttons)) {
            c.buttons = card.buttons.map((btn) => {
              const label = translateLine(btn.label, lang, phrases);
              if (label === btn.label) return btn;
              cardChanged = true;
              return { ...btn, label };
            });
          }
          if (cardChanged) changed = true;
          return c;
        });
      }
      if (changed) applied = true;
      return next;
    });
  }

  if (Array.isArray(out.infoCards)) {
    out.infoCards = out.infoCards.map((card) => {
      let changed = false;
      const c = { ...card };
      ['title', 'subtitle', 'description'].forEach((k) => {
        if (!card[k]) return;
        const t = translateLine(card[k], lang, phrases);
        if (t !== card[k]) {
          c[k] = t;
          changed = true;
        }
      });
      if (changed) applied = true;
      return c;
    });
  }

  if (applied) {
    out.localizedFromPhrases = true;
    out.uiLanguageCode = lang;
  }
  return out;
}

module.exports = {
  applyToResult,
  isEnabled,
  DATA_PATH,
  translateLine,
};
