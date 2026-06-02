/**
 * Upload files to Google Drive — one subfolder per submission.
 */

const { randomUUID } = require('crypto');
const { PassThrough } = require('stream');
const driveAuth = require('./drive-auth');
const folderName = require('./submission-folder-name');

const FOLDER_ID = String(process.env.GOOGLE_DRIVE_FOLDER_ID || '').trim();
const DRIVE_CREATE = { supportsAllDrives: true };
const DRIVE_LIST = { supportsAllDrives: true, includeItemsFromAllDrives: true };

function isConfigured() {
  return !!(FOLDER_ID && driveAuth.hasDriveUploadCredentials());
}

async function assertFolderIsOnSharedDrive(drive, folderId) {
  const res = await drive.files.get({
    fileId: folderId,
    fields: 'id, name, mimeType, driveId',
    supportsAllDrives: true,
  });
  const data = res.data || {};
  if (data.mimeType && data.mimeType !== 'application/vnd.google-apps.folder') {
    throw new Error('GOOGLE_DRIVE_FOLDER_ID must be a folder id.');
  }
  if (!data.driveId) {
    throw new Error(
      'Service account uploads need a folder on a Workspace Shared drive. ' +
        'Or set GOOGLE_DRIVE_OAUTH_* for My Drive uploads.'
    );
  }
}

async function listChildFolders(drive, parentId) {
  const q = `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const res = await drive.files.list({
    q,
    fields: 'files(id, name)',
    pageSize: 1000,
    ...DRIVE_LIST,
  });
  return Array.isArray(res.data.files) ? res.data.files : [];
}

/**
 * @param {Array<{ buffer: Buffer, originalname?: string, mimetype?: string, fieldname?: string }>} files
 * @param {{ mobile?: string, dialCode?: string, clientSessionId?: string }} opts
 */
async function uploadSubmissionFilesToDrive(files, opts) {
  opts = opts || {};
  if (!isConfigured()) {
    throw new Error(
      'Drive upload not configured. Set GOOGLE_DRIVE_FOLDER_ID and Drive auth env vars.'
    );
  }
  const fileParts = (files || []).filter(
    (f) => f && Buffer.isBuffer(f.buffer) && f.buffer.length > 0
  );
  if (!fileParts.length) {
    throw new Error('No file bytes received.');
  }

  const drive = await driveAuth.getDriveClient();
  if (!driveAuth.isDriveAuthOAuthUser()) {
    await assertFolderIsOnSharedDrive(drive, FOLDER_ID);
  }

  const childFolders = await listChildFolders(drive, FOLDER_ID);
  const folderNames = childFolders
    .map((f) => (f.name ? String(f.name) : ''))
    .filter(Boolean);

  const newFolderName = folderName.nextSubmissionFolderName({
    mobile: opts.mobile,
    dialCode: opts.dialCode,
    clientSessionId: opts.clientSessionId,
    folderNames,
    submittedAt: new Date(),
  });

  const subfolder = await drive.files.create({
    requestBody: {
      name: newFolderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [FOLDER_ID],
    },
    fields: 'id, name, webViewLink',
    ...DRIVE_CREATE,
  });

  const parentId = subfolder.data.id || '';
  const parentName =
    typeof subfolder.data.name === 'string'
      ? subfolder.data.name
      : newFolderName;
  const folderLink =
    typeof subfolder.data.webViewLink === 'string'
      ? subfolder.data.webViewLink
      : parentId
        ? `https://drive.google.com/drive/folders/${parentId}`
        : '';

  if (!parentId) throw new Error('Drive: could not create subfolder.');

  const out = [];
  try {
    for (const f of fileParts) {
      const orig =
        typeof f.originalname === 'string' ? f.originalname : 'file';
      const safeName = folderName.sanitizeFilename(orig);
      const uploadName = `${Date.now()}_${randomUUID().slice(0, 8)}_${safeName}`;
      const mime =
        typeof f.mimetype === 'string' && f.mimetype
          ? f.mimetype
          : 'application/octet-stream';

      const mediaStream = new PassThrough();
      mediaStream.end(f.buffer);

      const created = await drive.files.create({
        requestBody: { name: uploadName, parents: [parentId] },
        media: { mimeType: mime, body: mediaStream },
        fields: 'id, name, mimeType, webViewLink',
        ...DRIVE_CREATE,
      });

      const id = created.data.id || '';
      const view =
        typeof created.data.webViewLink === 'string' && created.data.webViewLink
          ? created.data.webViewLink
          : id
            ? `https://drive.google.com/file/d/${id}/view`
            : '';

      out.push({
        field: f.fieldname || 'document',
        original_name: orig,
        drive_file_id: id,
        web_view_link: view,
        drive_subfolder_id: parentId,
        drive_subfolder_name: parentName,
      });
    }
  } catch (err) {
    try {
      await drive.files.delete({ fileId: parentId, ...DRIVE_CREATE });
    } catch {
      /* cleanup */
    }
    throw err;
  }

  return {
    uploads: out,
    drive_subfolder_id: parentId,
    drive_subfolder_name: parentName,
    drive_folder_link: folderLink,
  };
}

module.exports = {
  isConfigured,
  uploadSubmissionFilesToDrive,
  FOLDER_ID,
};
