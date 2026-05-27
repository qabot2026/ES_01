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

function isSafeHttpUrl(href) {
  return /^https?:\/\//i.test(String(href || '').trim());
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

function parseAnchorHref(item) {
  if (!item || typeof item !== 'object') return '';
  const anchor = item.anchor || item.link;
  if (anchor && typeof anchor === 'object') {
    return String(anchor.href || anchor.url || '').trim();
  }
  if (typeof anchor === 'string') return anchor.trim();
  return String(item.href || item.url || item.link || item.fileUri || '').trim();
}

function parseDownloadEntry(item, fallbackLabel) {
  const href = parseAnchorHref(item);
  if (!isSafeHttpUrl(href)) return null;
  const fileName = String(item.name || item.fileName || item.title || '').trim();
  const label = String(
    item.text || item.label || fallbackLabel || fileName || 'Download'
  ).trim();
  const iconUrl = infoImageUrl(item);
  return {
    label: label || 'Download',
    href,
    iconUrl,
    fileName: fileName || label,
  };
}

function absorbDownloadList(items, downloads) {
  const list = Array.isArray(items) ? items : items ? [items] : [];
  list.forEach((item) => {
    const entry = parseDownloadEntry(item);
    if (entry) downloads.push(entry);
  });
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
      download: isSafeHttpUrl(href),
    });
  });

  (rowChipOptions || []).forEach((opt) => {
    const label = String(opt.text || opt.label || '').trim();
    if (!label) return;
    const href = parseAnchorHref(opt) || String(opt.link || opt.url || '').trim();
    buttons.push({
      label,
      message: String(opt.message || opt.postback || opt.text || opt.label).trim() || label,
      href,
      download: isSafeHttpUrl(href),
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
  const downloads = [];
  let chipHeading = '';

  if (!Array.isArray(richContent)) {
    return { chips, chipHeading, infoCards, downloads };
  }

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

      if (type === 'button') {
        const entry = parseDownloadEntry(item);
        if (entry) downloads.push(entry);
      }

      if (type === 'files' && Array.isArray(item.files)) {
        item.files.forEach((f) => {
          const entry = parseDownloadEntry(f);
          if (entry) downloads.push(entry);
        });
      }

      if (type === 'file') {
        const entry = parseDownloadEntry(item);
        if (entry) downloads.push(entry);
      }
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
        const href = parseAnchorHref(opt) || String(opt.link || opt.url || '').trim();
        if (isSafeHttpUrl(href)) {
          const entry = parseDownloadEntry(
            { ...opt, text: label, anchor: { href } },
            label
          );
          if (entry) {
            downloads.push(entry);
            return;
          }
        }
        chips.push({
          label,
          message: String(opt.message || opt.text || opt.label).trim() || label,
          href,
        });
      });
    }
  });

  return { chips, chipHeading, infoCards, downloads };
}

/** [label](https://...) in bot text or custom payload `message` */
const MARKDOWN_LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g;

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
  const downloads = [];
  const chipSeen = new Set();
  const downloadSeen = new Set();
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

    absorbDownloadList(plain.download || plain.downloads || plain.document, downloads);
    absorbDownloadList(plain.files, downloads);

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
    parsed.downloads.forEach((entry) => {
      const key = entry.href.toLowerCase();
      if (downloadSeen.has(key)) return;
      downloadSeen.add(key);
      downloads.push(entry);
    });
  });

  return {
    textParts: dedupeLines(textParts),
    replyParts,
    chips,
    chipHeading,
    infoCards,
    downloads,
  };
}

module.exports = {
  parseFulfillmentMessages,
  parseMarkdownMessage,
  payloadToPlain,
  parseRichContentRows,
  parseInfoCard,
};
