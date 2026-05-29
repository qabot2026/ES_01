/**
 * Bot-wide phrase dictionary: exact English from Dialogflow → hi / mr.
 * Display text only — chip/dropdown send values stay English for Dialogflow match.
 */

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'phrase-translations.json');

let cache = null;
let cacheMtime = 0;
let cacheLower = null;

function normalizeLang(code) {
  const c = String(code || '')
    .trim()
    .toLowerCase();
  if (!c || c === 'en') return 'en';
  return c.split('-')[0];
}

function normalizeKey(text) {
  return String(text == null ? '' : text)
    .trim()
    .replace(/\u2026/g, '...')
    .replace(/\s+/g, ' ');
}

function isEnabled() {
  if (process.env.PHRASE_TRANSLATIONS_ENABLED === 'false') return false;
  if (process.env.PHRASE_TRANSLATIONS_ENABLED === 'true') return true;
  return fs.existsSync(DATA_PATH);
}

function loadPhrases() {
  if (!fs.existsSync(DATA_PATH)) {
    cache = {};
    cacheLower = {};
    return cache;
  }
  const stat = fs.statSync(DATA_PATH);
  if (cache && stat.mtimeMs === cacheMtime) return cache;

  const parsed = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  cache = {};
  cacheLower = {};
  Object.keys(parsed).forEach((key) => {
    if (key.startsWith('_')) return;
    const k = normalizeKey(key);
    cache[k] = parsed[key];
    cacheLower[k.toLowerCase()] = k;
  });
  cacheMtime = stat.mtimeMs;
  return cache;
}

function lookupEntry(phrases, key) {
  const k = normalizeKey(key);
  if (!k) return null;
  if (phrases[k]) return phrases[k];
  const canon = cacheLower[k.toLowerCase()];
  return canon ? phrases[canon] : null;
}

function translateLine(text, lang, phrases) {
  const key = normalizeKey(text);
  if (!key || lang === 'en') return text;
  const entry = lookupEntry(phrases, key);
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

/** Flat map for browser: { "English phrase": "Translated" } */
function getFlatMapForLang(uiLanguageCode) {
  const lang = normalizeLang(uiLanguageCode);
  if (lang === 'en') return {};
  const phrases = loadPhrases();
  const map = {};
  Object.keys(phrases).forEach((en) => {
    const entry = phrases[en];
    if (entry && entry[lang] != null && String(entry[lang]).trim()) {
      map[en] = String(entry[lang]).trim();
      map[en.toLowerCase()] = String(entry[lang]).trim();
    }
  });
  return map;
}

function translateChip(chip, lang, phrases) {
  const sendMessage = String(chip.message || chip.label || '').trim();
  const displaySrc = String(chip.label || chip.message || '').trim();
  const label = translateLine(displaySrc, lang, phrases);
  if (label === displaySrc && sendMessage === chip.message) return chip;
  return {
    ...chip,
    label,
    message: sendMessage,
    sendMessage,
  };
}

function translateButton(btn, lang, phrases) {
  const sendMessage = String(
    btn.message || btn.postback || btn.ctaMessage || btn.label || ''
  ).trim();
  const displaySrc = String(btn.label || btn.text || '').trim();
  const label = translateLine(displaySrc, lang, phrases);
  if (label === displaySrc) return btn;
  return { ...btn, label, message: sendMessage || btn.message };
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
  touch('chipHeading', (v) => {
    const raw = String(v == null ? '' : v);
    if (!raw.trim() || lang === 'en') return v;
    return raw
      .split('\n')
      .map((line) => translateLine(line, lang, phrases))
      .join('\n');
  });

  if (Array.isArray(out.chips)) {
    out.chips = out.chips.map((chip) => {
      const next = translateChip(chip, lang, phrases);
      if (next !== chip) applied = true;
      return next;
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
      ['message', 'placeholder'].forEach((k) => {
        if (!d[k]) return;
        const t = translateLine(d[k], lang, phrases);
        if (t !== d[k]) {
          next[k] = t;
          changed = true;
        }
      });
      if (Array.isArray(d.options)) {
        next.options = d.options.map((opt) => {
          const value = String(opt.value || opt.label || '').trim();
          const labelSrc = String(opt.label || opt.value || '').trim();
          const label = translateLine(labelSrc, lang, phrases);
          if (label === labelSrc) return opt;
          changed = true;
          return { ...opt, label, value: value || opt.value };
        });
      }
      if (changed) applied = true;
      return next;
    });
  }

  if (Array.isArray(out.galleries)) {
    out.galleries = out.galleries.map((g) => {
      let changed = false;
      const next = { ...g };
      if (g.message) {
        const m = translateLine(g.message, lang, phrases);
        if (m !== g.message) {
          next.message = m;
          changed = true;
        }
      }
      if (Array.isArray(g.images)) {
        next.images = g.images.map((img) => {
          const nameSrc = String(img.name || img.title || '').trim();
          const name = translateLine(nameSrc, lang, phrases);
          if (name === nameSrc) return img;
          changed = true;
          return { ...img, name, title: name };
        });
      }
      if (changed) applied = true;
      return next;
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
          if (card.ctaLabel && card.ctaMessage) {
            c.ctaMessage = card.ctaMessage;
          }
          if (Array.isArray(card.buttons)) {
            c.buttons = card.buttons.map((btn) => {
              const b = translateButton(btn, lang, phrases);
              if (b !== btn) cardChanged = true;
              return b;
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
      ['title', 'subtitle', 'description', 'body'].forEach((k) => {
        if (!card[k]) return;
        const t = translateLine(card[k], lang, phrases);
        if (t !== card[k]) {
          c[k] = t;
          changed = true;
        }
      });
      if (Array.isArray(card.buttons)) {
        c.buttons = card.buttons.map((btn) => {
          const b = translateButton(btn, lang, phrases);
          if (b !== btn) changed = true;
          return b;
        });
      }
      if (changed) applied = true;
      return c;
    });
  }

  if (Array.isArray(out.downloads)) {
    out.downloads = out.downloads.map((d) => {
      const labelSrc = String(d.label || d.fileName || '').trim();
      const label = translateLine(labelSrc, lang, phrases);
      if (label === labelSrc) return d;
      applied = true;
      return { ...d, label };
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
  getFlatMapForLang,
  DATA_PATH,
  translateLine,
  normalizeKey,
};
