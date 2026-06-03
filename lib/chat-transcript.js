/**
 * Chat transcript storage (JSON files) — user / bot / agent turns per session.
 */

const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
function scheduleSheetSync(sessionId) {
  try {
    require('./conversation-sheet').scheduleSheetSync(sessionId);
  } catch (e) {
    console.warn('[transcript→sheet]', e.message);
  }
}

const DATA_DIR =
  process.env.TRANSCRIPT_DATA_DIR ||
  path.join(__dirname, '..', 'data', 'transcripts');
const INDEX_PATH = path.join(DATA_DIR, '_index.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadIndex() {
  ensureDir();
  try {
    if (fs.existsSync(INDEX_PATH)) {
      const raw = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
      if (raw && typeof raw.sessions === 'object') return raw;
    }
  } catch (e) {
    console.warn('[transcript] index load:', e.message);
  }
  return { sessions: {} };
}

function saveIndex(index) {
  ensureDir();
  fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2), 'utf8');
}

function sessionPath(sessionId) {
  const safe = String(sessionId || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 120);
  return path.join(DATA_DIR, safe + '.json');
}

function normalizeRole(role) {
  const r = String(role || '').toLowerCase();
  if (r === 'user' || r === 'visitor' || r === 'customer') return 'user';
  if (r === 'agent' || r === 'human' || r === 'staff') return 'agent';
  return 'bot';
}

/** True after visitor typed or tapped a chip/button (not welcome-only / panel open). */
function sessionHasUserEngagement(doc) {
  if (!doc || typeof doc !== 'object') return false;
  const meta = doc.meta && typeof doc.meta === 'object' ? doc.meta : {};
  if (meta.userEngaged === true || meta.user_engaged === true) return true;
  const turns = Array.isArray(doc.turns) ? doc.turns : [];
  return turns.some(
    (t) => t && t.role === 'user' && String(t.text || '').trim()
  );
}

function shouldScheduleSheetForSession(sessionId, doc) {
  const d = doc || getSessionDoc(sessionId);
  return sessionHasUserEngagement(d);
}

function appendTurn(sessionId, role, text, meta, options) {
  const sid = String(sessionId || '').trim();
  const t = String(text || '').trim();
  if (!sid || !t) return null;
  const scheduleSheet = !options || options.scheduleSheet !== false;

  ensureDir();
  const file = sessionPath(sid);
  let doc = { sessionId: sid, turns: [], meta: {} };
  try {
    if (fs.existsSync(file)) {
      doc = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (!Array.isArray(doc.turns)) doc.turns = [];
      if (!doc.meta || typeof doc.meta !== 'object') doc.meta = {};
    }
  } catch {
    doc = { sessionId: sid, turns: [], meta: {} };
  }

  const turn = {
    id: randomUUID(),
    role: normalizeRole(role),
    text: t,
    at: new Date().toISOString(),
    meta: meta || undefined,
  };
  doc.turns.push(turn);
  doc.updatedAt = turn.at;
  fs.writeFileSync(file, JSON.stringify(doc, null, 2), 'utf8');

  const index = loadIndex();
  const prev = index.sessions[sid] || {};
  index.sessions[sid] = {
    sessionId: sid,
    updatedAt: turn.at,
    createdAt: prev.createdAt || turn.at,
    turnCount: doc.turns.length,
    lastRole: turn.role,
    preview: t.slice(0, 120),
  };
  saveIndex(index);

  if (scheduleSheet && shouldScheduleSheetForSession(sid, doc)) {
    scheduleSheetSync(sid);
  }

  return turn;
}

function getSessionDoc(sessionId) {
  const sid = String(sessionId || '').trim();
  if (!sid) return { sessionId: '', turns: [], meta: {} };
  const file = sessionPath(sid);
  if (!fs.existsSync(file)) {
    return { sessionId: sid, turns: [], meta: {} };
  }
  try {
    const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!Array.isArray(doc.turns)) doc.turns = [];
    if (!doc.meta || typeof doc.meta !== 'object') doc.meta = {};
    doc.sessionId = sid;
    return doc;
  } catch {
    return { sessionId: sid, turns: [], meta: {} };
  }
}

function mergeSessionMeta(sessionId, partial, options) {
  const sid = String(sessionId || '').trim();
  if (!sid || !partial || typeof partial !== 'object') return;
  ensureDir();
  const file = sessionPath(sid);
  const doc = getSessionDoc(sid);
  doc.meta = Object.assign({}, doc.meta || {}, partial);
  fs.writeFileSync(file, JSON.stringify(doc, null, 2), 'utf8');
  const schedule =
    !options || options.scheduleSheet !== false;
  if (schedule && shouldScheduleSheetForSession(sid, doc)) {
    scheduleSheetSync(sid);
  }
}

function setSheetRow(sessionId, rowNum) {
  const sid = String(sessionId || '').trim();
  if (!sid || !rowNum) return;
  const doc = getSessionDoc(sid);
  doc.sheetRow = rowNum;
  ensureDir();
  fs.writeFileSync(
    sessionPath(sid),
    JSON.stringify(doc, null, 2),
    'utf8'
  );
}

function appendTurns(sessionId, turns) {
  if (!Array.isArray(turns)) return [];
  const out = [];
  turns.forEach((item) => {
    if (!item) return;
    const t = appendTurn(sessionId, item.role, item.text, item.meta);
    if (t) out.push(t);
  });
  return out;
}

function getTranscript(sessionId) {
  const sid = String(sessionId || '').trim();
  if (!sid) return { error: 'session_required' };
  const file = sessionPath(sid);
  if (!fs.existsSync(file)) {
    return { ok: true, sessionId: sid, turns: [] };
  }
  try {
    const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
    return {
      ok: true,
      sessionId: sid,
      turns: Array.isArray(doc.turns) ? doc.turns : [],
      updatedAt: doc.updatedAt || null,
    };
  } catch (e) {
    return { error: 'read_failed', message: e.message };
  }
}

function listSessions(limit = 100) {
  const index = loadIndex();
  const list = Object.values(index.sessions || {});
  list.sort((a, b) =>
    String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''))
  );
  return list.slice(0, Math.max(1, limit));
}

function getAnalyticsSummary(liveAgentQueue) {
  const index = loadIndex();
  const sessions = Object.values(index.sessions || {});
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  let turnsToday = 0;
  let sessionsToday = 0;
  let totalTurns = 0;

  sessions.forEach((s) => {
    totalTurns += s.turnCount || 0;
    if (String(s.updatedAt || '').slice(0, 10) === today) {
      sessionsToday += 1;
      turnsToday += s.turnCount || 0;
    }
  });

  const waiting = (liveAgentQueue && liveAgentQueue.waiting) || [];
  const active = (liveAgentQueue && liveAgentQueue.active) || [];

  return {
    totalSessions: sessions.length,
    totalTurns,
    sessionsToday,
    turnsToday,
    liveWaiting: waiting.length,
    liveActive: active.length,
    recentSessions: listSessions(15),
  };
}

/** Record user + bot lines from /api/chat (server-side; does not rely on widget patch). */
function logDialogflowExchange(sessionId, userMessage, result) {
  const sid = String(sessionId || '').trim();
  if (!sid || !result) return;
  const noSchedule = { scheduleSheet: false };
  const userText =
    userMessage != null ? String(userMessage).trim() : '';
  if (userText) appendTurn(sid, 'user', userText, undefined, noSchedule);

  const parts = Array.isArray(result.replyParts) ? result.replyParts : [];
  if (parts.length) {
    parts.forEach((p) => {
      const t = p && p.text != null ? String(p.text).trim() : '';
      if (t) appendTurn(sid, 'bot', t, undefined, noSchedule);
    });
  } else {
    const reply = String(result.reply || '').trim();
    if (reply && reply !== 'No response.') {
      appendTurn(sid, 'bot', reply, undefined, noSchedule);
    }
  }

  if (result.intentIsFallback) {
    mergeSessionMeta(sid, { fallback: 'yes' }, { scheduleSheet: false });
  }

  const doc = getSessionDoc(sid);
  if (userText || sessionHasUserEngagement(doc)) {
    scheduleSheetSync(sid);
  }
}

module.exports = {
  appendTurn,
  appendTurns,
  logDialogflowExchange,
  getTranscript,
  getSessionDoc,
  mergeSessionMeta,
  setSheetRow,
  listSessions,
  getAnalyticsSummary,
  sessionHasUserEngagement,
  shouldScheduleSheetForSession,
};
