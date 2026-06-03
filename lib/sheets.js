/**
 * Google Sheets API — one row per conversation (see lib/conversation-sheet.js).
 */

const { google } = require('googleapis');
const googleCredentials = require('./google-credentials');

/** Must match lib/conversation-sheet.js row order. */
const SHEET_COL_HEADERS = [
  'Conv. Link',
  'Conv. Date',
  'Conv. Time',
  'Name',
  'Mobile',
  'Email',
  'Channel',
  'User Queries',
  'Repeated User',
  'Source URL',
  'Session ID',
  'Device',
  'Browser',
  'OS',
  'City',
  'IP Address',
  'App. Booked',
  'App. Date',
  'App. Time',
  'Document',
  'Sentiment',
  'Rating',
  'Feedback',
  'Duration',
  'CRM Push Status',
  'Message Count',
  'Average Response Time',
  'UtmCampaign',
  'UtmContent',
  'UtmMedium',
  'UtmSource',
  'UtmTerm',
  'Fall back',
];

const SPREADSHEET_ID = String(process.env.SHEETS_SPREADSHEET_ID || '').trim();
const RANGE = String(process.env.SHEETS_RANGE || 'Sheet1!A:AG').trim();
const PUBLIC_BASE = String(process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '');

let headerWritten = false;
let lastError = null;
let lastProbeAt = null;
let lastProbeOk = null;

function columnToLetter(n) {
  let col = n;
  let s = '';
  while (col > 0) {
    const rem = (col - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    col = Math.floor((col - 1) / 26);
  }
  return s || 'A';
}

function tabName() {
  const bang = RANGE.indexOf('!');
  return bang >= 0 ? RANGE.slice(0, bang).replace(/^'|'$/g, '') : 'Sheet1';
}

function isConfigured() {
  return !!(SPREADSHEET_ID && googleCredentials.isCredentialsConfigured());
}

function isClientReady() {
  return !!getSheetsClient();
}

function loadAuth() {
  const credentials = googleCredentials.getServiceAccountCredentials();
  if (!credentials) return null;
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

function getSheetsClient() {
  const auth = loadAuth();
  if (!auth) return null;
  return google.sheets({ version: 'v4', auth });
}

function logSheetError(op, err) {
  const extra =
    err.response && err.response.data
      ? err.response.data.error || err.response.data
      : err.errors;
  const msg = [err.message || String(err), extra ? JSON.stringify(extra) : '']
    .filter(Boolean)
    .join(' ');
  lastError = { op, message: msg, at: new Date().toISOString() };
  console.warn('[sheets]', op + ':', msg);
}

function transcriptUrl(sessionId) {
  if (!PUBLIC_BASE || !sessionId) return '';
  return (
    PUBLIC_BASE +
    '/conversation-transcript?session=' +
    encodeURIComponent(String(sessionId))
  );
}

/** Column A (Conv. Link): clickable Chatscript → conversation transcript page. */
function chatscriptSheetCell(sessionId) {
  const url = transcriptUrl(sessionId);
  if (!url) return '';
  const escUrl = String(url).replace(/"/g, '""');
  return `=HYPERLINK("${escUrl}","Chatscript")`;
}

function rowToColumnMap(row) {
  const columns = {};
  for (let c = 0; c < SHEET_COL_HEADERS.length; c++) {
    const h = SHEET_COL_HEADERS[c];
    const v = row && row[c] != null ? String(row[c]).trim() : '';
    if (h && v) columns[h] = v;
  }
  return columns;
}

/**
 * Find sheet row by Session ID column.
 * @returns {Promise<{ rowNumber: number, columns: Record<string, string> } | null>}
 */
async function fetchSheetRowBySessionId(sessionId) {
  const sid = String(sessionId || '').trim();
  if (!sid || !isConfigured()) return null;
  const client = getSheetsClient();
  if (!client) return null;
  const tab = tabName();
  try {
    const res = await client.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tab}!A2:AG`,
    });
    const rows = res.data.values || [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const columns = rowToColumnMap(row);
      if (columns['Session ID'] !== sid) continue;
      return { rowNumber: i + 2, columns };
    }
  } catch (err) {
    logSheetError('fetchSheetRowBySessionId', err);
  }
  return null;
}

async function ensureHeaderRow(headers) {
  if (!isConfigured() || headerWritten) return;
  const sheets = getSheetsClient();
  if (!sheets) {
    logSheetError('ensureHeaderRow', new Error('Sheets client not created — check credentials'));
    return;
  }
  const tab = tabName();
  const headerRange = `${tab}!A1:${columnToLetter(headers.length)}1`;
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: headerRange,
    });
    const row = (res.data.values && res.data.values[0]) || [];
    if (row.length && String(row[0] || '').trim()) {
      headerWritten = true;
      return;
    }
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tab}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [headers] },
    });
    headerWritten = true;
  } catch (err) {
    logSheetError('ensureHeaderRow', err);
  }
}

/** @returns {Promise<number|null>} 1-based row number */
async function appendRowValues(values) {
  if (!isConfigured()) return null;
  const sheets = getSheetsClient();
  if (!sheets) {
    logSheetError('append', new Error('Sheets client not created — check credentials'));
    return null;
  }
  try {
    const tab = tabName();
    const endCol = columnToLetter(values.length);
    const res = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tab}!A1:${endCol}1`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [values] },
    });
    const updated = res.data.updates && res.data.updates.updatedRange;
    if (updated) {
      const m = String(updated).match(/![A-Z]+(\d+)/i);
      if (m) {
        lastError = null;
        return parseInt(m[1], 10);
      }
    }
    logSheetError('append', new Error('append ok but no updatedRange row number'));
    return null;
  } catch (err) {
    logSheetError('append', err);
    return null;
  }
}

async function updateRow(rowNumber1Based, values) {
  if (!isConfigured() || !rowNumber1Based) return false;
  const sheets = getSheetsClient();
  if (!sheets) return false;
  const tab = tabName();
  const endCol = columnToLetter(values.length);
  const range = `${tab}!A${rowNumber1Based}:${endCol}${rowNumber1Based}`;
  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [values] },
    });
    lastError = null;
    return true;
  } catch (err) {
    logSheetError('update', err);
    return false;
  }
}

async function probe() {
  lastProbeAt = new Date().toISOString();
  if (!isConfigured()) {
    lastProbeOk = false;
    return {
      ok: false,
      error: 'not_configured',
      spreadsheetIdSet: !!SPREADSHEET_ID,
      credentialsSet: googleCredentials.isCredentialsConfigured(),
      clientReady: false,
    };
  }
  const sheets = getSheetsClient();
  if (!sheets) {
    lastProbeOk = false;
    return {
      ok: false,
      error: 'credentials_parse_failed',
      clientEmail: googleCredentials.getClientEmail(),
      clientReady: false,
    };
  }
  try {
    const meta = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      fields: 'properties.title,sheets.properties.title',
    });
    const titles = (meta.data.sheets || []).map(
      (s) => s.properties && s.properties.title
    );
    const tab = tabName();
    lastProbeOk = true;
    lastError = null;
    return {
      ok: true,
      title: meta.data.properties && meta.data.properties.title,
      tabNames: titles,
      configuredTab: tab,
      tabExists: titles.includes(tab),
      range: RANGE,
      clientEmail: googleCredentials.getClientEmail(),
    };
  } catch (err) {
    lastProbeOk = false;
    logSheetError('probe', err);
    return {
      ok: false,
      error: err.message,
      clientEmail: googleCredentials.getClientEmail(),
      lastError,
    };
  }
}

/** Normalize mobile for comparison (last 10 digits). */
function normalizeMobile(value) {
  const digits = String(value == null ? '' : value).replace(/\D/g, '');
  if (!digits) return '';
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

/**
 * Mobile numbers already in the sheet (Mobile column), excluding one row when updating.
 * @param {number|null} excludeRowNumber1Based
 * @returns {Promise<string[]>} normalized mobiles
 */
async function listSheetMobiles(excludeRowNumber1Based) {
  if (!isConfigured()) return [];
  const client = getSheetsClient();
  if (!client) return [];
  const tab = tabName();
  const exclude = excludeRowNumber1Based
    ? Number(excludeRowNumber1Based)
    : null;
  try {
    const mobileIdx = SHEET_COL_HEADERS.indexOf('Mobile');
    const mobileCol =
      mobileIdx >= 0 ? columnToLetter(mobileIdx + 1) : 'E';
    const res = await client.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tab}!${mobileCol}2:${mobileCol}`,
    });
    const rows = res.data.values || [];
    const out = [];
    rows.forEach((row, idx) => {
      const rowNum = idx + 2;
      if (exclude && rowNum === exclude) return;
      const norm = normalizeMobile(row && row[0]);
      if (norm) out.push(norm);
    });
    return out;
  } catch (err) {
    logSheetError('listSheetMobiles', err);
    return [];
  }
}

function getStatus() {
  return {
    configured: isConfigured(),
    clientReady: isClientReady(),
    spreadsheetIdSet: !!SPREADSHEET_ID,
    range: RANGE,
    clientEmail: googleCredentials.getClientEmail(),
    lastProbeAt,
    lastProbeOk,
    lastError,
  };
}

const STORAGE_FOLDER_INLINE_RE =
  /(\d{10,}_\d{2}_\d{2}_\d{4}_\d{2,})|([a-zA-Z0-9][a-zA-Z0-9_-]*__\d{2}_\d{2}_\d{4}_\d{2,})/;

/** Extract GCS submission folder from sheet Document cell (folder id or URL). */
function extractStorageFolderFromDocumentCell(cell) {
  const s = String(cell || '').trim();
  if (!s) return '';
  if (!s.includes('://')) {
    const exact = s.match(/^(\d{10,}_\d{2}_\d{2}_\d{4}_\d{2,})$/) ||
      s.match(/^([a-zA-Z0-9][a-zA-Z0-9_-]*__\d{2}_\d{2}_\d{4}_\d{2,})$/);
    if (exact) return exact[1] || exact[2];
  }
  const pathM =
    s.match(/\/uploads\/([^/?]+)/i) ||
    s.match(/uploads%2F([^/?%]+)/i) ||
    s.match(/storage\.googleapis\.com\/[^/]+\/(?:uploads%2F|uploads\/)([^/?]+)/i);
  if (pathM) {
    try {
      return decodeURIComponent(pathM[1]);
    } catch {
      return pathM[1];
    }
  }
  const inline = s.match(STORAGE_FOLDER_INLINE_RE);
  if (inline) return inline[1] || inline[2];
  return '';
}

function sheetDateToFolderLabel(dateCell) {
  const m = String(dateCell || '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return '';
  const dd = m[1].padStart(2, '0');
  const mm = m[2].padStart(2, '0');
  return `${dd}_${mm}_${m[3]}`;
}

/**
 * Sheet rows indexed for document dashboard enrichment.
 * @returns {Promise<{ byFolder: object, bySession: object, byMobileDate: object[] }>}
 */
async function loadDocumentEnrichmentByFolder() {
  const byFolder = {};
  const bySession = {};
  const byMobileDate = [];
  if (!isConfigured()) return { byFolder, bySession, byMobileDate };
  const client = getSheetsClient();
  if (!client) return { byFolder, bySession, byMobileDate };
  const tab = tabName();
  try {
    const res = await client.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tab}!A2:AG`,
    });
    const rows = res.data.values || [];
    rows.forEach((row) => {
      const columns = rowToColumnMap(row);
      const name = columns.Name || '';
      const mobile = columns.Mobile || '';
      const sessionId = columns['Session ID'] || '';
      const document = columns.Document || '';
      const date = columns['Conv. Date'] || '';
      const time = columns['Conv. Time'] || '';
      const updatedAt = [date, time].filter(Boolean).join(' ');
      const entry = {
        sessionId,
        name,
        mobile,
        dial_code: '',
        email: columns.Email || '',
        updatedAt,
      };
      const folder = extractStorageFolderFromDocumentCell(document);
      if (folder) byFolder[folder] = entry;
      if (sessionId) bySession[sessionId] = entry;

      const dateLabel = sheetDateToFolderLabel(date);
      const mobDigits = mobile.replace(/\D/g, '');
      if (dateLabel && mobDigits.length >= 10) {
        const digits =
          mobDigits.length >= 11 ? mobDigits : '91' + mobDigits.slice(-10);
        byMobileDate.push({ digits, dateLabel, entry });
      }
    });
  } catch (err) {
    logSheetError('loadDocumentEnrichmentByFolder', err);
  }
  return { byFolder, bySession, byMobileDate };
}

/** @deprecated use conversation-sheet sync */
async function appendRow() {
  return { ok: false, skipped: true };
}

module.exports = {
  isConfigured,
  isClientReady,
  ensureHeaderRow,
  appendRowValues,
  updateRow,
  appendRow,
  probe,
  getStatus,
  normalizeMobile,
  listSheetMobiles,
  loadDocumentEnrichmentByFolder,
  extractStorageFolderFromDocumentCell,
  fetchSheetRowBySessionId,
  chatscriptSheetCell,
  transcriptUrl,
  SPREADSHEET_ID,
  RANGE,
};
