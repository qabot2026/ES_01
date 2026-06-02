/**
 * Google Sheets API — one row per conversation (see lib/conversation-sheet.js).
 */

const { google } = require('googleapis');
const dialogflow = require('./dialogflow');

const SPREADSHEET_ID = String(process.env.SHEETS_SPREADSHEET_ID || '').trim();
const RANGE = String(process.env.SHEETS_RANGE || 'Sheet1!A:AG').trim();
const PUBLIC_BASE = String(process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '');

let headerWritten = false;

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
  return bang >= 0 ? RANGE.slice(0, bang) : 'Sheet1';
}

function isConfigured() {
  return !!(SPREADSHEET_ID && dialogflow.isConfigured());
}

function loadAuth() {
  const creds = process.env.GOOGLE_CREDENTIALS_JSON;
  if (!creds || !creds.trim()) return null;
  try {
    return new google.auth.GoogleAuth({
      credentials: JSON.parse(creds.trim()),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
  } catch {
    return null;
  }
}

function getSheetsClient() {
  const auth = loadAuth();
  if (!auth) return null;
  return google.sheets({ version: 'v4', auth });
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
  if (!sheets) return;
  const tab = tabName();
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tab}!A1:1`,
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
    console.warn('[sheets] ensureHeaderRow:', err.message);
  }
}

/** @returns {Promise<number|null>} 1-based row number */
async function appendRowValues(values) {
  if (!isConfigured()) return null;
  const sheets = getSheetsClient();
  if (!sheets) return null;
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
      const m = updated.match(/!(?:[A-Z]+)(\d+):/i);
      if (m) return parseInt(m[1], 10);
    }
    return null;
  } catch (err) {
    console.warn('[sheets] append failed:', err.message);
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
    return true;
  } catch (err) {
    console.warn('[sheets] update failed:', err.message);
    return false;
  }
}

/** @deprecated use conversation-sheet sync */
async function appendRow() {
  return { ok: false, skipped: true };
}

module.exports = {
  isConfigured,
  ensureHeaderRow,
  appendRowValues,
  updateRow,
  appendRow,
  transcriptUrl,
  SPREADSHEET_ID,
  RANGE,
};
