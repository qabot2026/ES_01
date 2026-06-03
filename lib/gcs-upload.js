/**
 * Upload form files to Google Cloud Storage (production — no client Drive OAuth).
 */

const { randomUUID } = require('crypto');
const { Storage } = require('@google-cloud/storage');
const googleCredentials = require('./google-credentials');
const folderName = require('./submission-folder-name');

const BUCKET_NAME = String(process.env.GCS_BUCKET_NAME || '').trim();
const UPLOAD_PREFIX = String(process.env.GCS_UPLOAD_PREFIX || 'uploads')
  .trim()
  .replace(/^\/+|\/+$/g, '');
const SIGNED_URL_DAYS = Math.min(
  30,
  Math.max(1, Number(process.env.GCS_SIGNED_URL_DAYS || 7) || 7)
);

function isConfigured() {
  return !!(BUCKET_NAME && googleCredentials.getServiceAccountCredentials());
}

function getStorage() {
  const creds = googleCredentials.getServiceAccountCredentials();
  if (!creds) return null;
  return new Storage({
    credentials: creds,
    projectId: creds.project_id,
  });
}

/** List folder names already under uploads/ (prefix folders in GCS). */
async function listExistingFolderNames(bucket) {
  const prefix = UPLOAD_PREFIX ? `${UPLOAD_PREFIX}/` : '';
  const [, , apiResponse] = await bucket.getFiles({
    prefix,
    delimiter: '/',
    autoPaginate: false,
    maxResults: 1000,
  });
  const prefixes = (apiResponse && apiResponse.prefixes) || [];
  const names = [];
  const re = new RegExp(
    `^${String(UPLOAD_PREFIX).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/([^/]+)/$`
  );
  prefixes.forEach((p) => {
    const m = String(p).match(re);
    if (m && m[1]) names.push(m[1]);
  });
  return names;
}

/**
 * @param {Array<{ buffer: Buffer, originalname?: string, mimetype?: string }>} files
 * @param {{ mobile?: string, dialCode?: string, clientSessionId?: string }} opts
 */
async function uploadSubmissionFilesToGcs(files, opts) {
  opts = opts || {};
  if (!isConfigured()) {
    throw new Error(
      'GCS not configured. Set GCS_BUCKET_NAME and GOOGLE_CREDENTIALS_JSON on Railway.'
    );
  }
  const fileParts = (files || []).filter(
    (f) => f && Buffer.isBuffer(f.buffer) && f.buffer.length > 0
  );
  if (!fileParts.length) {
    throw new Error('No file bytes received.');
  }

  const storage = getStorage();
  const bucket = storage.bucket(BUCKET_NAME);
  const existing = await listExistingFolderNames(bucket);
  const folder = folderName.nextSubmissionFolderName({
    mobile: opts.mobile,
    dialCode: opts.dialCode,
    clientSessionId: opts.clientSessionId,
    folderNames: existing,
    submittedAt: new Date(),
  });

  const basePath = UPLOAD_PREFIX ? `${UPLOAD_PREFIX}/${folder}` : folder;
  const expires = Date.now() + SIGNED_URL_DAYS * 24 * 60 * 60 * 1000;
  const uploads = [];

  for (const f of fileParts) {
    const orig =
      typeof f.originalname === 'string' ? f.originalname : 'file';
    const safe = folderName.sanitizeFilename(orig);
    const objectName = `${basePath}/${Date.now()}_${randomUUID().slice(0, 8)}_${safe}`;
    const mime =
      typeof f.mimetype === 'string' && f.mimetype
        ? f.mimetype
        : 'application/octet-stream';

    const file = bucket.file(objectName);
    await file.save(f.buffer, {
      metadata: { contentType: mime },
      resumable: false,
    });

    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires,
    });

    uploads.push({
      original_name: orig,
      gcs_object: objectName,
      content_type: mime,
      size_bytes: f.buffer.length,
      signed_url: signedUrl,
      storage_folder: folder,
    });
  }

  const documentLinks = uploads.map((u) => u.signed_url).filter(Boolean).join('\n');

  return {
    uploads,
    storage_folder: folder,
    storage_path: basePath,
    document_links: documentLinks,
    document_link: uploads[0] ? uploads[0].signed_url : '',
  };
}

module.exports = {
  isConfigured,
  getStorage,
  uploadSubmissionFilesToGcs,
  BUCKET_NAME,
  UPLOAD_PREFIX,
};
