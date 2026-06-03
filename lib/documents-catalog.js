/**
 * List uploaded documents from GCS + enrich from transcripts, Sheets, and object metadata.
 */

const fs = require('fs');
const path = require('path');
const gcsUpload = require('./gcs-upload');
const sheets = require('./sheets');
const documentDisplay = require('./document-display');

const TRANSCRIPT_DIR =
  process.env.TRANSCRIPT_DATA_DIR ||
  path.join(__dirname, '..', 'data', 'transcripts');

const MOBILE_FOLDER_RE = /^(\d+)_(\d{2})_(\d{2})_(\d{4})_(\d+)$/;
const SESSION_FOLDER_RE = /^(.+)__(\d{2})_(\d{2})_(\d{4})_(\d+)$/;

function sessionIdFromFolder(folder) {
  const m = String(folder || '').match(SESSION_FOLDER_RE);
  return m ? m[1] : '';
}

function formatUploadTag(v) {
  return String(v || '')
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function parseFolderLabel(folder) {
  const m = String(folder || '').match(MOBILE_FOLDER_RE);
  if (m) {
    return {
      mobile: m[1],
      dateDisplay: `${m[2]}/${m[3]}/${m[4]}`,
      sequence: m[5],
      dateLabel: `${m[2]}_${m[3]}_${m[4]}`,
    };
  }
  return { mobile: '', dateDisplay: '', sequence: '', dateLabel: '' };
}

function parseDisplayFileName(objectPath, fileMetadata) {
  const md = fileMetadata || {};
  const custom = md.metadata || {};
  if (custom.original_filename) {
    return String(custom.original_filename).trim();
  }
  const base = String(objectPath || '').split('/').pop() || '';
  return documentDisplay.parseStoredObjectFileName(base);
}

function folderFromStoragePath(storagePath) {
  const p = String(storagePath || '').replace(/\\/g, '/');
  const parts = p.split('/').filter(Boolean);
  if (parts.length >= 2) return parts[parts.length - 2];
  return '';
}

function transcriptToMeta(entry) {
  if (!entry) return null;
  return {
    sessionId: entry.sessionId || '',
    name: entry.name || '',
    mobile: entry.mobile || '',
    dial_code: entry.dial_code || '',
    email: entry.email || '',
    tag: entry.tag || '',
    updatedAt: entry.updatedAt || '',
  };
}

function pickNewer(a, b) {
  if (!a) return b;
  if (!b) return a;
  return String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')) > 0
    ? b
    : a;
}

function readTranscriptEntry(doc, sessionIdFromFile) {
  const m = doc.meta || {};
  return {
    sessionId: doc.sessionId || sessionIdFromFile || '',
    name: m.name || '',
    mobile: m.mobile || m.phone || '',
    dial_code: m.dial_code || m.dialCode || m.country_dial_code || '',
    email: m.email || '',
    updatedAt: doc.updatedAt || '',
    storage_folder: m.storage_folder || '',
    document: m.document ? String(m.document).trim() : '',
    storage_path: m.storage_path ? String(m.storage_path).trim() : '',
    tag: m.tag || m.upload_tag || '',
  };
}

function loadTranscriptIndexes() {
  const byFolder = {};
  const bySession = {};
  const byMobileDate = [];

  try {
    if (!fs.existsSync(TRANSCRIPT_DIR)) {
      return { byFolder, bySession, byMobileDate };
    }
    const files = fs.readdirSync(TRANSCRIPT_DIR).filter((f) => f.endsWith('.json'));
    files.forEach((file) => {
      try {
        const doc = JSON.parse(
          fs.readFileSync(path.join(TRANSCRIPT_DIR, file), 'utf8')
        );
        const sid = doc.sessionId || file.replace(/\.json$/, '');
        const e = readTranscriptEntry(doc, sid);
        if (e.sessionId) {
          bySession[e.sessionId] = pickNewer(bySession[e.sessionId], e);
        }

        const keys = new Set();
        if (e.storage_folder) keys.add(e.storage_folder);
        if (e.document && !e.document.includes('://')) keys.add(e.document);
        const fromPath = folderFromStoragePath(e.storage_path);
        if (fromPath) keys.add(fromPath);

        keys.forEach((k) => {
          byFolder[k] = pickNewer(byFolder[k], e);
        });

        const folderKey = e.storage_folder || e.document || '';
        const mm = folderKey.match(MOBILE_FOLDER_RE);
        if (mm) {
          byMobileDate.push({
            digits: mm[1],
            dateLabel: `${mm[2]}_${mm[3]}_${mm[4]}`,
            entry: e,
          });
        }
      } catch {
        /* skip */
      }
    });
  } catch {
    /* ignore */
  }
  return { byFolder, bySession, byMobileDate };
}

function matchSheetByMobileDate(folder, sheetIndexes) {
  if (!sheetIndexes || !sheetIndexes.byMobileDate) return null;
  const mm = String(folder || '').match(MOBILE_FOLDER_RE);
  if (!mm) return null;
  const digits = mm[1];
  const dateLabel = `${mm[2]}_${mm[3]}_${mm[4]}`;
  const seq = parseInt(mm[5], 10);
  const hits = sheetIndexes.byMobileDate.filter((x) => x.digits === digits);
  const sameDay = hits
    .filter((x) => x.dateLabel === dateLabel)
    .map((x) => x.entry);
  if (sameDay.length === 1) return transcriptToMeta(sameDay[0]);
  if (sameDay.length > 1 && !Number.isNaN(seq)) {
    const idx = seq - 1;
    if (idx >= 0 && idx < sameDay.length) return transcriptToMeta(sameDay[idx]);
  }
  return sameDay.length ? transcriptToMeta(sameDay[sameDay.length - 1]) : null;
}

function resolveMetaForFolder(folder, indexes, sheetIndexes) {
  let meta = transcriptToMeta(indexes.byFolder[folder]);
  if (meta && (meta.name || meta.sessionId)) return meta;

  if (sheetIndexes && sheetIndexes.byFolder && sheetIndexes.byFolder[folder]) {
    meta = pickNewer(meta, sheetIndexes.byFolder[folder]);
    if (meta && (meta.name || meta.sessionId)) return meta;
  }

  const sm = String(folder || '').match(SESSION_FOLDER_RE);
  if (sm) {
    const base = sm[1];
    let entry = indexes.bySession[base];
    if (!entry) {
      for (const sid of Object.keys(indexes.bySession)) {
        if (sid === base || sid.startsWith(base) || base.startsWith(sid)) {
          entry = indexes.bySession[sid];
          break;
        }
      }
    }
    meta = transcriptToMeta(entry);
    if (meta && (meta.name || meta.sessionId)) return meta;
    if (sheetIndexes && sheetIndexes.bySession && sheetIndexes.bySession[base]) {
      return sheetIndexes.bySession[base];
    }
    if (sheetIndexes && sheetIndexes.byFolder && sheetIndexes.byFolder[folder]) {
      return sheetIndexes.byFolder[folder];
    }
  }

  const mm = String(folder || '').match(MOBILE_FOLDER_RE);
  if (mm) {
    const digits = mm[1];
    const dateLabel = `${mm[2]}_${mm[3]}_${mm[4]}`;
    const seq = parseInt(mm[5], 10);

    const hits = indexes.byMobileDate.filter((x) => x.digits === digits);
    const exact = hits.find(
      (x) =>
        x.entry.storage_folder === folder || x.entry.document === folder
    );
    if (exact) return transcriptToMeta(exact.entry);

    const sameDay = hits
      .filter((x) => x.dateLabel === dateLabel)
      .map((x) => x.entry)
      .sort((a, b) =>
        String(a.updatedAt || '').localeCompare(String(b.updatedAt || ''))
      );
    if (sameDay.length === 1) return transcriptToMeta(sameDay[0]);
    if (sameDay.length > 1 && !Number.isNaN(seq)) {
      const idx = seq - 1;
      if (idx >= 0 && idx < sameDay.length) {
        return transcriptToMeta(sameDay[idx]);
      }
    }

    for (const e of sameDay) {
      if (e.storage_folder === folder || e.document === folder) {
        return transcriptToMeta(e);
      }
    }
  }

  const sheetMobile = matchSheetByMobileDate(folder, sheetIndexes);
  if (sheetMobile && (sheetMobile.name || sheetMobile.sessionId)) {
    return sheetMobile;
  }

  if (sheetIndexes && sheetIndexes.byFolder && sheetIndexes.byFolder[folder]) {
    return sheetIndexes.byFolder[folder];
  }

  const fromFolder = sessionIdFromFolder(folder);
  if (fromFolder) {
    return transcriptToMeta(
      Object.assign({}, meta || {}, { sessionId: fromFolder })
    );
  }

  return meta || null;
}

function metaFromGcsCustom(fileMetadata) {
  const md = fileMetadata || {};
  const custom = md.metadata || {};
  return {
    sessionId: custom.session_id || custom.sessionid || '',
    name: custom.customer_name || custom.customername || '',
    mobile: custom.mobile || '',
    dial_code: custom.dial_code || custom.dialcode || '',
    email: custom.email || '',
    tag: custom.upload_tag || custom.tag || '',
    updatedAt: '',
  };
}

function applyMetaToGroup(g, meta) {
  if (!meta) return;
  if (meta.name && !g.name) g.name = meta.name;
  if (meta.mobile && !g.mobile) g.mobile = meta.mobile;
  if (meta.dial_code && !g.dial_code) g.dial_code = meta.dial_code;
  if (meta.email && !g.email) g.email = meta.email;
  if (meta.tag && !g.tag) g.tag = formatUploadTag(meta.tag);
  if (meta.sessionId && !g.session_id) g.session_id = meta.sessionId;
  if (meta.updatedAt && (!g.updated_at || meta.updatedAt > g.updated_at)) {
    g.updated_at = meta.updatedAt;
  }
}

async function listDocumentCatalog(opts) {
  opts = opts || {};
  if (!gcsUpload.isConfigured()) {
    return { ok: false, error: 'gcs_not_configured' };
  }

  const indexes = loadTranscriptIndexes();
  const sheetIndexes = await sheets.loadDocumentEnrichmentByFolder();

  const storage = gcsUpload.getStorage();
  const bucket = storage.bucket(gcsUpload.BUCKET_NAME);
  const prefix = gcsUpload.UPLOAD_PREFIX
    ? `${gcsUpload.UPLOAD_PREFIX}/`
    : '';

  const [files] = await bucket.getFiles({ prefix, autoPaginate: true });
  const groups = new Map();

  for (const file of files) {
    const objectName = file.name;
    if (!objectName || objectName.endsWith('/')) continue;

    const rel = prefix && objectName.startsWith(prefix)
      ? objectName.slice(prefix.length)
      : objectName;
    const slash = rel.indexOf('/');
    if (slash < 0) continue;

    const folder = rel.slice(0, slash);
    const filePart = rel.slice(slash + 1);
    if (!filePart) continue;

    let g = groups.get(folder);
    if (!g) {
      const label = parseFolderLabel(folder);
      const resolved = resolveMetaForFolder(folder, indexes, sheetIndexes);
      g = {
        storage_folder: folder,
        mobile: (resolved && resolved.mobile) || label.mobile || '',
        dial_code: (resolved && resolved.dial_code) || '',
        date_display: label.dateDisplay,
        sequence: label.sequence,
        session_id:
          (resolved && resolved.sessionId) || sessionIdFromFolder(folder) || '',
        name: (resolved && resolved.name) || '',
        email: (resolved && resolved.email) || '',
        tag: formatUploadTag((resolved && resolved.tag) || ''),
        updated_at: (resolved && resolved.updatedAt) || '',
        files: [],
      };
      if (!g.mobile && label.mobile) g.mobile = label.mobile;
      groups.set(folder, g);
    }

    const meta = file.metadata || {};
    applyMetaToGroup(g, metaFromGcsCustom(meta));

    const updated = meta.updated || meta.timeCreated || '';
    const fileTag = formatUploadTag(
      (meta.metadata && (meta.metadata.upload_tag || meta.metadata.tag)) || g.tag || ''
    );
    if (fileTag && !g.tag) g.tag = fileTag;
    const fileSession =
      metaFromGcsCustom(meta).sessionId || g.session_id || sessionIdFromFolder(folder);
    if (fileSession && !g.session_id) g.session_id = fileSession;
    g.files.push({
      gcs_object: objectName,
      file_name: parseDisplayFileName(objectName, meta),
      content_type: meta.contentType || 'application/octet-stream',
      size_bytes: Number(meta.size) || 0,
      uploaded_at: updated,
      tag: fileTag,
      session_id: fileSession,
      storage_link: documentDisplay.storageObjectHttpsUrl(objectName),
    });
    if (updated && (!g.updated_at || updated > g.updated_at)) {
      g.updated_at = updated;
    }
  }

  let folders = Array.from(groups.values());
  folders.forEach((f) => {
    f.files.sort((a, b) =>
      String(b.uploaded_at || '').localeCompare(String(a.uploaded_at || ''))
    );
    f.file_count = f.files.length;
    f.total_bytes = f.files.reduce((s, x) => s + (x.size_bytes || 0), 0);
  });
  folders.sort((a, b) =>
    String(b.updated_at || '').localeCompare(String(a.updated_at || ''))
  );

  const limit = Math.min(500, Math.max(1, Number(opts.limit) || 200));
  folders = folders.slice(0, limit);

  return {
    ok: true,
    bucket: gcsUpload.BUCKET_NAME,
    total_folders: folders.length,
    folders,
  };
}

function validateObjectName(objectName) {
  const prefix = gcsUpload.UPLOAD_PREFIX
    ? `${gcsUpload.UPLOAD_PREFIX}/`
    : '';
  if (prefix && !objectName.startsWith(prefix)) {
    return { ok: false, error: 'invalid_object' };
  }
  return { ok: true, prefix };
}

function attachmentDisposition(fileName) {
  const name = String(fileName || 'download').replace(/[\r\n"]/g, '_') || 'download';
  const ascii = name.replace(/[^\x20-\x7E]/g, '_') || 'download';
  return (
    'attachment; filename="' +
    ascii +
    '"; filename*=UTF-8\'\'' +
    encodeURIComponent(name)
  );
}

async function streamFileDownload(gcsObject, res) {
  if (!gcsUpload.isConfigured()) {
    return { ok: false, error: 'gcs_not_configured' };
  }
  const objectName = String(gcsObject || '').trim();
  if (!objectName) return { ok: false, error: 'object_required' };

  const check = validateObjectName(objectName);
  if (!check.ok) return check;

  const storage = gcsUpload.getStorage();
  const file = storage.bucket(gcsUpload.BUCKET_NAME).file(objectName);
  const [exists] = await file.exists();
  if (!exists) return { ok: false, error: 'not_found' };

  let fileMeta = {};
  let contentType = 'application/octet-stream';
  try {
    const [gm] = await file.getMetadata();
    fileMeta = gm || {};
    if (fileMeta.contentType) contentType = fileMeta.contentType;
  } catch {
    /* use default */
  }
  const fileName = parseDisplayFileName(objectName, fileMeta);

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', attachmentDisposition(fileName));
  res.setHeader('Cache-Control', 'private, no-store');

  return new Promise((resolve, reject) => {
    const stream = file.createReadStream();
    stream.on('error', (err) => {
      if (!res.headersSent) {
        reject(err);
      } else {
        res.end();
      }
    });
    stream.on('end', () => resolve({ ok: true }));
    stream.pipe(res);
  });
}

async function getDownloadUrl(gcsObject) {
  if (!gcsUpload.isConfigured()) {
    return { ok: false, error: 'gcs_not_configured' };
  }
  const objectName = String(gcsObject || '').trim();
  if (!objectName) return { ok: false, error: 'object_required' };

  const check = validateObjectName(objectName);
  if (!check.ok) return check;

  const storage = gcsUpload.getStorage();
  const file = storage.bucket(gcsUpload.BUCKET_NAME).file(objectName);
  const [exists] = await file.exists();
  if (!exists) return { ok: false, error: 'not_found' };

  let fileMeta = {};
  try {
    const [gm] = await file.getMetadata();
    fileMeta = gm || {};
  } catch {
    /* ignore */
  }
  const fileName = parseDisplayFileName(objectName, fileMeta);

  const days = Math.min(
    7,
    Math.max(1, Number(process.env.GCS_SIGNED_URL_DAYS || 7) || 7)
  );
  const expires = Date.now() + days * 24 * 60 * 60 * 1000;
  const [signedUrl] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires,
  });

  return {
    ok: true,
    url: signedUrl,
    expires_in_days: days,
    file_name: fileName,
  };
}

module.exports = {
  listDocumentCatalog,
  getDownloadUrl,
  streamFileDownload,
};
