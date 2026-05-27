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

function isCardRichType(type) {
  const t = (type || '').toLowerCase();
  return t === 'info' || t === 'description' || t === 'accordion' || t === 'card';
}

function parseInfoCard(item, rowChipOptions) {
  const title = String(item.title || '').trim();
  const subtitle = String(item.subtitle || '').trim();
  const body = String(
    item.text || item.description || item.body || ''
  ).trim();
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

  (rowChipOptions || []).forEach((opt) => {
    const label = String(opt.text || opt.label || '').trim();
    if (!label) return;
    buttons.push({
      label,
      message: String(opt.message || opt.postback || opt.text || opt.label).trim() || label,
      href: String(opt.link || opt.url || '').trim(),
    });
  });

  if (!buttons.length && actionLink) {
    buttons.push({
      label: 'View',
      message: '',
      href: actionLink,
    });
  }

  if (!title && !subtitle && !body && !imageUrl && !buttons.length) return null;

  return { title, subtitle, body, imageUrl, actionLink, buttons };
}

function parseRichContentRows(richContent) {
  const chips = [];
  const infoCards = [];
  let chipHeading = '';

  if (!Array.isArray(richContent)) return { chips, chipHeading, infoCards };

  richContent.forEach((row) => {
    if (!Array.isArray(row)) return;

    const rowChipOptions = [];
    let rowHasCard = false;

    row.forEach((item) => {
      if (!item || typeof item !== 'object') return;
      const type = (item.type || '').toLowerCase();

      if (type === 'chips' && Array.isArray(item.options)) {
        item.options.forEach((opt) => rowChipOptions.push(opt));
      }

      if (type === 'list' && item.title) {
        const t = String(item.title).trim();
        if (t && !chipHeading) chipHeading = t;
      }

      if (isCardRichType(type)) rowHasCard = true;
    });

    row.forEach((item) => {
      if (!item || typeof item !== 'object') return;
      const type = (item.type || '').toLowerCase();

      if (isCardRichType(type)) {
        const card = parseInfoCard(item, rowChipOptions);
        if (card) infoCards.push(card);
      }
    });

    if (!rowHasCard && rowChipOptions.length) {
      rowChipOptions.forEach((opt) => {
        const label = String(opt.text || opt.label || '').trim();
        if (!label) return;
        chips.push({
          label,
          message: String(opt.message || opt.text || opt.label).trim() || label,
        });
      });
    }
  });

  return { chips, chipHeading, infoCards };
}

/** [label](https://...) in bot text or custom payload `message` */
const MARKDOWN_LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g;

function isSafeHttpUrl(href) {
  return /^https?:\/\//i.test(String(href || '').trim());
}

function parseMarkdownMessage(raw) {
  const str = String(raw || '').trim();
  if (!str) return { parts: [], plainText: '' };

  const parts = [];
  let lastIndex = 0;
  let hasLink = false;
  let match;

  MARKDOWN_LINK_RE.lastIndex = 0;
  while ((match = MARKDOWN_LINK_RE.exec(str)) !== null) {
    hasLink = true;
    if (match.index > lastIndex) {
      parts.push({ type: 'text', text: str.slice(lastIndex, match.index) });
    }
    const label = String(match[1] || '').trim();
    const href = String(match[2] || '').trim();
    if (label && isSafeHttpUrl(href)) {
      parts.push({ type: 'link', text: label, href });
    } else {
      parts.push({ type: 'text', text: match[0] });
    }
    lastIndex = MARKDOWN_LINK_RE.lastIndex;
  }

  if (!hasLink) {
    return { parts: [{ type: 'text', text: str }], plainText: str };
  }

  if (lastIndex < str.length) {
    parts.push({ type: 'text', text: str.slice(lastIndex) });
  }

  const plainText = parts
    .map((p) => (p.type === 'link' ? p.text : p.text))
    .join('');

  return { parts, plainText };
}

function absorbMessageLine(line, textParts, replyParts) {
  const md = parseMarkdownMessage(line);
  if (md.parts.some((p) => p.type === 'link')) {
    md.parts.forEach((p) => replyParts.push(p));
    return;
  }
  if (md.plainText) textParts.push(md.plainText);
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
  const replyParts = [];
  const chips = [];
  const infoCards = [];
  const chipSeen = new Set();
  let chipHeading = '';

  (fulfillmentMessages || []).forEach((msg) => {
    if (msg.text && Array.isArray(msg.text.text)) {
      msg.text.text.forEach((t) => {
        const line = String(t || '').trim();
        if (line) absorbMessageLine(line, textParts, replyParts);
      });
    }

    const plain = payloadToPlain(msg.payload);
    if (!plain) return;

    if (plain.message) {
      absorbMessageLine(String(plain.message), textParts, replyParts);
    }

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

  return {
    textParts: dedupeLines(textParts),
    replyParts,
    chips,
    chipHeading,
    infoCards,
  };
}

module.exports = {
  parseFulfillmentMessages,
  parseMarkdownMessage,
  payloadToPlain,
  parseRichContentRows,
  parseInfoCard,
};
