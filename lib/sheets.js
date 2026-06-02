/**
 * Google Sheets — append chat / lead rows (optional).
 * Uses GOOGLE_CREDENTIALS_JSON (same as Dialogflow).
 */

const { google } = require('googleapis');
const dialogflow = require('./dialogflow');

const SPREADSHEET_ID = String(process.env.SHEETS_SPREADSHEET_ID || '').trim();
const RANGE = String(process.env.SHEETS_RANGE || 'Sheet1!A:H').trim();
const PUBLIC_BASE = String(process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '');

function isConfigured() {
  return !!(SPREADSHEET_ID && dialogflow.isConfigured());
}

function loadAuth() {
  const creds = process.env.GOOGLE_CREDENTIALS_JSON;
  if (!creds || !creds.trim()) return null;
  let parsed;
  try {
    parsed = JSON.parse(creds.trim());
  } catch {
    return null;
  }
  return new google.auth.GoogleAuth({
    credentials: parsed,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

function transcriptUrl(sessionId) {
  if (!PUBLIC_BASE || !sessionId) return '';
  return (
    PUBLIC_BASE +
    '/transcript.html?session=' +
    encodeURIComponent(String(sessionId))
  );
}

/**
 * Columns: Date | Time | Session | Role | Message | Event | Agent | Transcript link
 */
async function appendRow(row) {
  if (!isConfigured()) {
    return { ok: false, skipped: true, reason: 'sheets_not_configured' };
  }
  const auth = loadAuth();
  if (!auth) {
    return { ok: false, skipped: true, reason: 'credentials_missing' };
  }

  const sheets = google.sheets({ version: 'v4', auth });
  const d = new Date();
  const date = d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
  const time = d.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
  });

  const values = [
    [
      row.date || date,
      row.time || time,
      String(row.sessionId || ''),
      String(row.role || ''),
      String(row.message || row.summary || '').slice(0, 2000),
      String(row.event || ''),
      String(row.agentName || ''),
      String(row.transcriptUrl || transcriptUrl(row.sessionId)),
    ],
  ];

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values },
    });
    return { ok: true };
  } catch (err) {
    console.warn('[sheets] append failed:', err.message);
    return { ok: false, error: err.message };
  }
}

module.exports = {
  isConfigured,
  appendRow,
  SPREADSHEET_ID,
};
