/**
 * List uploaded documents from GCS + enrich from chat transcripts.
 */

const fs = require('fs');
const path = require('path');
const gcsUpload = require('./gcs-upload');
const googleCredentials = require('./google-credentials');

const TRANSCRIPT_DIR =
  process.env.TRANSCRIPT_DATA_DIR ||
  path.join(__dirname, '..', 'data', 'transcripts');

function parseFolderLabel(folder) {
  const m = String(folder || '').match(/^(\d+)_(\d{2})_(\d{2})_(\d{4})_(\d+)$/);
  if (m) {
    return {
      mobile: m[1],
      dateDisplay: `${m[2]}/${m[3]}/${m[4]}`,
      sequence: m[5],
    };
  }
  return { mobile: '', dateDisplay: '', sequence: '' };
}

function parseDisplayFileName(objectPath) {
  const base = String(objectPath || '').split('/').pop() || '';
  const parts = base.split('_');
  if (parts.length >= 3) {
    return parts.slice(2).join('_') || base;
  }
  return base;
}

function loadTranscriptMetaByFolder() {
  const map = {};
  try {
    if (!fs.existsSync(TRANSCRIPT_DIR)) return map;
    const files = fs.readdirSync(TRANSCRIPT_DIR).filter((f) => f.endsWith('.json'));
    files.forEach((file) => {
      try {
        const doc = JSON.parse(
          fs.readFileSync(path.join(TRANSCRIPT_DIR, file), 'utf8')
        );
        const folder = doc.meta && doc.meta.storage_folder;
        if (!folder) return;
        map[folder] = {
          sessionId: doc.sessionId || file.replace(/\.json$/, ''),
          name: (doc.meta && doc.meta.name) || '',
          mobile: (doc.meta && doc.meta.mobile) || '',
          email: (doc.meta && doc.meta.email) || '',
          updatedAt: doc.updatedAt || '',
        };
      } catch {
        /* skip */
      }
    });
  } catch {
    /* ignore */
  }
  return map;
}

async function listDocumentCatalog(opts) {
  opts = opts || {};
  if (!gcsUpload.isConfigured()) {
    return { ok: false, error: 'gcs_not_configured' };
  }

  const storage = gcsUpload.getStorage();
  const bucket = storage.bucket(gcsUpload.BUCKET_NAME);
  const prefix = gcsUpload.UPLOAD_PREFIX
    ? `${gcsUpload.UPLOAD_PREFIX}/`
    : '';

  const [files] = await bucket.getFiles({ prefix, autoPaginate: true });
  const groups = new Map();
  const metaByFolder = loadTranscriptMetaByFolder();

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
      const extra = metaByFolder[folder] || {};
      g = {
        storage_folder: folder,
        mobile: extra.mobile || label.mobile,
        date_display: label.dateDisplay,
        sequence: label.sequence,
        session_id: extra.sessionId || '',
        name: extra.name || '',
        email: extra.email || '',
        updated_at: extra.updatedAt || '',
        files: [],
      };
      groups.set(folder, g);
    }

    const meta = file.metadata || {};
    const updated = meta.updated || meta.timeCreated || '';
    g.files.push({
      gcs_object: objectName,
      file_name: parseDisplayFileName(objectName),
      content_type: meta.contentType || 'application/octet-stream',
      size_bytes: Number(meta.size) || 0,
      uploaded_at: updated,
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

  const fileName = parseDisplayFileName(objectName);
  let contentType = 'application/octet-stream';
  try {
    const [meta] = await file.getMetadata();
    if (meta && meta.contentType) contentType = meta.contentType;
  } catch {
    /* use default */
  }

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
    file_name: parseDisplayFileName(objectName),
  };
}

module.exports = {
  listDocumentCatalog,
  getDownloadUrl,
  streamFileDownload,
};
