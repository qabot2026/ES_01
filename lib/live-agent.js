/**
 * Live agent service desk — queue, claim, and message relay per chat session.
 */

const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const DATA_PATH =
  process.env.LIVE_AGENT_DATA_PATH ||
  path.join(__dirname, '..', 'data', 'live-agent-sessions.json');

const DESK_TOKEN = String(process.env.LIVE_AGENT_DESK_TOKEN || '').trim();

let store = { sessions: {} };
let loaded = false;

function loadStore() {
  if (loaded) return;
  loaded = true;
  try {
    if (fs.existsSync(DATA_PATH)) {
      const raw = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
      if (raw && typeof raw.sessions === 'object') store = raw;
    }
  } catch (err) {
    console.warn('[live-agent] load failed:', err.message);
    store = { sessions: {} };
  }
}

function saveStore() {
  try {
    const dir = path.dirname(DATA_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_PATH, JSON.stringify(store, null, 2), 'utf8');
  } catch (err) {
    console.warn('[live-agent] save failed:', err.message);
  }
}

function nowIso() {
  return new Date().toISOString();
}

function getSession(sessionId) {
  loadStore();
  return store.sessions[String(sessionId || '').trim()] || null;
}

function listSessions() {
  loadStore();
  return Object.values(store.sessions);
}

function summarizeSession(s) {
  if (!s) return null;
  const last = s.messages && s.messages.length ? s.messages[s.messages.length - 1] : null;
  return {
    sessionId: s.sessionId,
    status: s.status,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    agentId: s.agentId || '',
    agentName: s.agentName || '',
    userLanguage: s.userLanguage || 'en',
    preview: last ? String(last.text || '').slice(0, 120) : '',
    messageCount: (s.messages || []).length,
  };
}

function addMessage(session, from, text, meta) {
  const msg = {
    id: randomUUID(),
    from,
    text: String(text || '').trim(),
    at: nowIso(),
    meta: meta || undefined,
  };
  if (!msg.text) return null;
  session.messages = session.messages || [];
  session.messages.push(msg);
  session.updatedAt = msg.at;
  return msg;
}

/** User requests a live agent (handoff from bot). */
function requestHandoff(sessionId, opts) {
  opts = opts || {};
  const sid = String(sessionId || '').trim();
  if (!sid) return { error: 'session_required' };

  loadStore();
  let s = store.sessions[sid];
  if (s && s.status === 'active') {
    return { ok: true, session: summarizeSession(s), alreadyActive: true };
  }
  if (s && s.status === 'waiting') {
    return { ok: true, session: summarizeSession(s), alreadyWaiting: true };
  }

  s = {
    sessionId: sid,
    status: 'waiting',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    agentId: '',
    agentName: '',
    userLanguage: String(opts.userLanguage || 'en').trim() || 'en',
    messages: [],
  };
  if (opts.previewMessage) {
    addMessage(s, 'user', opts.previewMessage, { handoff: true });
  }
  store.sessions[sid] = s;
  saveStore();
  return { ok: true, session: summarizeSession(s) };
}

function postUserMessage(sessionId, text) {
  const sid = String(sessionId || '').trim();
  const s = getSession(sid);
  if (!s) return { error: 'session_not_found' };
  if (s.status === 'ended') return { error: 'session_ended' };
  if (s.status === 'waiting') {
    const msg = addMessage(s, 'user', text);
    saveStore();
    return { ok: true, message: msg, status: 'waiting' };
  }
  if (s.status !== 'active') return { error: 'not_in_live_chat' };
  const msg = addMessage(s, 'user', text);
  saveStore();
  return { ok: true, message: msg, status: 'active' };
}

function postAgentMessage(sessionId, text, agent) {
  const sid = String(sessionId || '').trim();
  const s = getSession(sid);
  if (!s) return { error: 'session_not_found' };
  if (s.status !== 'active') return { error: 'session_not_active' };
  if (agent && agent.agentId && s.agentId && s.agentId !== agent.agentId) {
    return { error: 'not_your_session' };
  }
  const msg = addMessage(s, 'agent', text, {
    agentId: agent?.agentId,
    agentName: agent?.agentName,
  });
  saveStore();
  return { ok: true, message: msg };
}

function claimSession(sessionId, agent) {
  const sid = String(sessionId || '').trim();
  const s = getSession(sid);
  if (!s) return { error: 'session_not_found' };
  if (s.status === 'ended') return { error: 'session_ended' };
  if (s.status === 'active' && s.agentId && agent.agentId && s.agentId !== agent.agentId) {
    return { error: 'already_claimed' };
  }
  s.status = 'active';
  s.agentId = String(agent.agentId || '').trim() || 'agent';
  s.agentName = String(agent.agentName || '').trim() || 'Agent';
  s.updatedAt = nowIso();
  addMessage(s, 'system', `${s.agentName} joined the chat.`, { system: true });
  saveStore();
  return { ok: true, session: summarizeSession(s) };
}

function endSession(sessionId, agent, reason) {
  const sid = String(sessionId || '').trim();
  const s = getSession(sid);
  if (!s) return { error: 'session_not_found' };
  if (s.status === 'ended') return { ok: true, session: summarizeSession(s) };
  if (s.status === 'active' && agent?.agentId && s.agentId && s.agentId !== agent.agentId) {
    return { error: 'not_your_session' };
  }
  s.status = 'ended';
  s.updatedAt = nowIso();
  addMessage(s, 'system', reason || 'Chat ended.', { system: true, end: true });
  saveStore();
  return { ok: true, session: summarizeSession(s) };
}

function getMessagesSince(sessionId, since) {
  const s = getSession(sessionId);
  if (!s) return { error: 'session_not_found' };
  const sinceMs = since ? Date.parse(since) : 0;
  const messages = (s.messages || []).filter((m) => {
    if (!sinceMs) return true;
    const t = Date.parse(m.at);
    return Number.isFinite(t) ? t > sinceMs : true;
  });
  return {
    ok: true,
    sessionId: s.sessionId,
    status: s.status,
    agentName: s.agentName || '',
    messages,
  };
}

function getUserState(sessionId) {
  const s = getSession(sessionId);
  if (!s) {
    return { ok: true, status: 'none', messages: [] };
  }
  return {
    ok: true,
    status: s.status,
    agentName: s.agentName || '',
    session: summarizeSession(s),
  };
}

function getQueue() {
  loadStore();
  const waiting = [];
  const active = [];
  const ended = [];
  listSessions().forEach((s) => {
    const sum = summarizeSession(s);
    if (s.status === 'waiting') waiting.push(sum);
    else if (s.status === 'active') active.push(sum);
    else if (s.status === 'ended') ended.push(sum);
  });
  waiting.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  active.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  ended.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  return { waiting, active, ended: ended.slice(0, 50) };
}

function getSessionDetail(sessionId) {
  const s = getSession(sessionId);
  if (!s) return { error: 'session_not_found' };
  return {
    ok: true,
    session: summarizeSession(s),
    messages: s.messages || [],
  };
}

function verifyDeskToken(req) {
  if (!DESK_TOKEN) return false;
  const h = String(req.headers['x-agent-token'] || req.headers['x-desk-token'] || '').trim();
  const q = String(req.query.token || '').trim();
  return h === DESK_TOKEN || q === DESK_TOKEN;
}

function deskAuthFailed() {
  if (!DESK_TOKEN) {
    return {
      error: 'desk_token_not_configured',
      message: 'Set LIVE_AGENT_DESK_TOKEN on the server (Railway Variables).',
    };
  }
  return { error: 'unauthorized', message: 'Wrong desk token.' };
}

module.exports = {
  DATA_PATH,
  isDeskTokenRequired: () => true,
  verifyDeskToken,
  deskAuthFailed,
  requestHandoff,
  postUserMessage,
  postAgentMessage,
  claimSession,
  endSession,
  getMessagesSince,
  getUserState,
  getQueue,
  getSessionDetail,
};
