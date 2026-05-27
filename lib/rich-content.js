/**
 * Parse Dialogflow ES / Messenger-style richContent from fulfillment payload.
 * GREEN: reads JSON already returned by detectIntent — no extra API cost.
 */

function structValueToJs(v) {
  if (v == null) return null;
  if (typeof v !== 'object') return v;
  if (Object.prototype.hasOwnProperty.call(v, 'stringValue')) {
    return v.stringValue;
  }
  if (Object.prototype.hasOwnProperty.call(v, 'numberValue')) {
    return v.numberValue;
  }
  if (Object.prototype.hasOwnProperty.call(v, 'boolValue')) {
    return v.boolValue;
  }
  if (v.listValue && Array.isArray(v.listValue.values)) {
    return v.listValue.values.map(structValueToJs);
  }
  if (v.structValue) return structToJs(v.structValue);
  return v;
}

function structToJs(struct) {
  if (!struct || typeof struct !== 'object') return struct;
  if (struct.fields && typeof struct.fields === 'object') {
    const out = {};
    Object.keys(struct.fields).forEach((key) => {
      out[key] = structValueToJs(struct.fields[key]);
    });
    return out;
  }
  return struct;
}

function payloadToPlain(payload) {
  if (!payload) return null;
  if (payload.fields) return structToJs(payload);
  return payload;
}

function infoImageUrl(item) {
  if (!item || !item.image) return '';
  const img = item.image;
  return String(
    img.src?.rawUrl ||
      img.src?.url ||
      (typeof img.src === 'string' ? img.src : '') ||
      img.url ||
      img.rawUrl ||
      ''
  ).trim();
}

function parseInfoCard(item) {
  const title = String(item.title || '').trim();
  const subtitle = String(item.subtitle || item.text || '').trim();
  const imageUrl = infoImageUrl(item);
  const actionLink = String(
    item.actionLink || item.actionUri || item.url || ''
  ).trim();
  const buttons = [];

  (item.buttons || []).forEach((btn) => {
    const label = String(btn.text || btn.label || '').trim();
    if (!label) return;
    let href = String(btn.link || btn.url || btn.actionLink || '').trim();
    if (!href && actionLink && /\b(view|map|location|open|visit|website)\b/i.test(label)) {
      href = actionLink;
    }
    buttons.push({
      label,
      message: String(btn.message || btn.postback || label).trim(),
      href,
    });
  });

  if (!buttons.length && actionLink) {
    buttons.push({
      label: 'View',
      message: '',
      href: actionLink,
    });
  }

  if (!title && !subtitle && !imageUrl && !buttons.length) return null;

  return { title, subtitle, imageUrl, actionLink, buttons };
}

function parseRichContentRows(richContent) {
  const chips = [];
  const infoCards = [];
  let chipHeading = '';

  if (!Array.isArray(richContent)) return { chips, chipHeading, infoCards };

  richContent.forEach((row) => {
    if (!Array.isArray(row)) return;
    row.forEach((item) => {
      if (!item || typeof item !== 'object') return;
      const type = (item.type || '').toLowerCase();

      if (type === 'chips' && Array.isArray(item.options)) {
        item.options.forEach((opt) => {
          const label = String(opt.text || opt.label || '').trim();
          if (!label) return;
          chips.push({
            label,
            message: String(opt.message || opt.text || opt.label).trim() || label,
          });
        });
      }

      if (type === 'list' && item.title) {
        const t = String(item.title).trim();
        if (t && !chipHeading) chipHeading = t;
      }

      if (type === 'info' || type === 'description') {
        const card = parseInfoCard(item);
        if (card) infoCards.push(card);
      }
    });
  });

  return { chips, chipHeading, infoCards };
}

function dedupeLines(lines) {
  const out = [];
  const seen = new Set();
  (lines || []).forEach((line) => {
    const t = String(line || '').trim();
    if (!t) return;
    const key = t.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(t);
  });
  return out;
}

function parseFulfillmentMessages(fulfillmentMessages) {
  const textParts = [];
  const chips = [];
  const infoCards = [];
  const chipSeen = new Set();
  let chipHeading = '';

  (fulfillmentMessages || []).forEach((msg) => {
    if (msg.text && Array.isArray(msg.text.text)) {
      msg.text.text.forEach((t) => {
        const line = String(t || '').trim();
        if (line) textParts.push(line);
      });
    }

    const plain = payloadToPlain(msg.payload);
    if (!plain) return;

    const rich =
      plain.richContent ||
      (plain.google && plain.google.richContent) ||
      null;

    if (!rich) return;

    const parsed = parseRichContentRows(rich);
    if (parsed.chipHeading && !chipHeading) {
      chipHeading = parsed.chipHeading;
    }
    parsed.chips.forEach((chip) => {
      const key = chip.message.toLowerCase();
      if (chipSeen.has(key)) return;
      chipSeen.add(key);
      chips.push(chip);
    });
    parsed.infoCards.forEach((card) => infoCards.push(card));
  });

  return { textParts: dedupeLines(textParts), chips, chipHeading, infoCards };
}

module.exports = {
  parseFulfillmentMessages,
  payloadToPlain,
  parseRichContentRows,
  parseInfoCard,
};
