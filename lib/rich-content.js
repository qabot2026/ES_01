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

function parseRichContentRows(richContent) {
  const chips = [];
  let chipHeading = '';

  if (!Array.isArray(richContent)) return { chips, chipHeading };

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

      /* list.title = heading above chips only (not merged into agent text bubble) */
      if (type === 'list' && item.title) {
        const t = String(item.title).trim();
        if (t && !chipHeading) chipHeading = t;
      }
    });
  });

  return { chips, chipHeading };
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
  });

  return { textParts: dedupeLines(textParts), chips, chipHeading };
}

module.exports = {
  parseFulfillmentMessages,
  payloadToPlain,
  parseRichContentRows,
};
