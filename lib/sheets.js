/**
 * Google Sheets API — one row per conversation (see lib/conversation-sheet.js).
 */

const { google } = require('googleapis');
const googleCredentials = require('./google-credentials');

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
    '/transcript.html?session=' +
    encodeURIComponent(String(sessionId))
  );
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
    const res = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
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
  transcriptUrl,
  SPREADSHEET_ID,
  RANGE,
};
