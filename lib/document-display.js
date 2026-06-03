/**
 * Human-readable document names for Sheet, chat script summary, and uploads.
 */

function splitExt(name) {
  const s = String(name || '');
  const i = s.lastIndexOf('.');
  if (i <= 0) return { base: s, ext: '' };
  return { base: s.slice(0, i), ext: s.slice(i) };
}

/** GCS object basename → display name (legacy timestamp_uuid_prefix or plain name). */
function parseStoredObjectFileName(base) {
  const b = String(base || '').trim();
  if (!b) return '';
  const parts = b.split('_');
  if (parts.length >= 3 && /^\d{13,}$/.test(parts[0])) {
    return parts.slice(2).join('_') || b;
  }
  return b;
}

function filenameFromGcsUrl(url) {
  const s = String(url || '').trim();
  if (!s || !/^https?:\/\//i.test(s)) return '';
  try {
    const u = new URL(s);
    const seg = decodeURIComponent(u.pathname.split('/').filter(Boolean).pop() || '');
    return parseStoredObjectFileName(seg);
  } catch {
    const m = s.match(/\/([^/?]+)(?:\?|$)/);
    return m ? parseStoredObjectFileName(decodeURIComponent(m[1])) : '';
  }
}

function isStorageFolderId(value) {
  return /^\d{10,}_\d{2}_\d{2}_\d{4}_\d{2,}$/.test(String(value || '').trim())
    || /^[a-zA-Z0-9_-]+__\d{2}_\d{2}_\d{4}_\d{2,}$/.test(String(value || '').trim());
}

/**
 * Comma-separated display names for Sheet / summary from transcript meta.
 */
function documentNamesFromMeta(meta) {
  const m = meta && typeof meta === 'object' ? meta : {};
  if (m.document_names) {
    return String(m.document_names).trim();
  }
  if (Array.isArray(m.uploaded_files) && m.uploaded_files.length) {
    return m.uploaded_files
      .map((f) => (f && (f.original_name || f.name || f.file_name)) || '')
      .filter(Boolean)
      .join(', ');
  }
  if (Array.isArray(m.uploads) && m.uploads.length) {
    return m.uploads
      .map((f) => (f && (f.original_name || f.name)) || '')
      .filter(Boolean)
      .join(', ');
  }
  const doc = String(m.document || m.upload || '').trim();
  if (!doc) {
    if (m.document_link) return filenameFromGcsUrl(m.document_link);
    if (m.document_links) {
      return String(m.document_links)
        .split(/\n/)
        .map((line) => filenameFromGcsUrl(line) || line.trim())
        .filter(Boolean)
        .join(', ');
    }
    return '';
  }
  if (/^https?:\/\//i.test(doc)) {
    return filenameFromGcsUrl(doc);
  }
  if (isStorageFolderId(doc)) {
    return '';
  }
  return doc;
}

/** Format any stored Document cell value for staff UI. */
function formatDocumentFieldForDisplay(value) {
  const s = String(value == null ? '' : value).trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) {
    const fromUrl = filenameFromGcsUrl(s);
    return fromUrl || s;
  }
  if (s.includes('\n') && s.includes('https://')) {
    return s
      .split(/\n/)
      .map((line) => formatDocumentFieldForDisplay(line))
      .filter(Boolean)
      .join(', ');
  }
  if (isStorageFolderId(s)) return '';
  if (s.includes(',')) {
    return s
      .split(',')
      .map((x) => formatDocumentFieldForDisplay(x.trim()))
      .filter(Boolean)
      .join(', ');
  }
  return s;
}

function uniqueStoredFileName(orig, usedNames, sanitize) {
  const safe = sanitize(orig);
  if (!usedNames.has(safe)) {
    usedNames.add(safe);
    return safe;
  }
  const { base, ext } = splitExt(safe);
  let n = 2;
  let candidate = `${base}_${n}${ext}`;
  while (usedNames.has(candidate)) {
    n += 1;
    candidate = `${base}_${n}${ext}`;
  }
  usedNames.add(candidate);
  return candidate;
}

module.exports = {
  documentNamesFromMeta,
  formatDocumentFieldForDisplay,
  filenameFromGcsUrl,
  parseStoredObjectFileName,
  uniqueStoredFileName,
  isStorageFolderId,
};
