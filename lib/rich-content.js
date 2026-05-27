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
  const extraLines = [];

  if (!Array.isArray(richContent)) return { chips, extraLines };

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
        extraLines.push(String(item.title).trim());
      }

      if ((type === 'description' || type === 'info') && item.text) {
        extraLines.push(String(item.title || item.text).trim());
      }
    });
  });

  return { chips, extraLines };
}

function parseFulfillmentMessages(fulfillmentMessages) {
  const textParts = [];
  const chips = [];
  const seen = new Set();

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
    parsed.extraLines.forEach((line) => {
      if (line && !textParts.includes(line)) textParts.push(line);
    });
    parsed.chips.forEach((chip) => {
      const key = chip.message.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      chips.push(chip);
    });
  });

  return { textParts, chips };
}

module.exports = {
  parseFulfillmentMessages,
  payloadToPlain,
  parseRichContentRows,
};
