/**
 * Live agent desk storage (JSON file) — Only Refer–compatible conversation shape.
 */

const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const chatTranscript = require('./chat-transcript');

const DATA_PATH =
  process.env.LIVE_AGENT_DATA_PATH ||
  path.join(__dirname, '..', 'data', 'live-agent-sessions.json');
const SETTINGS_PATH =
  process.env.LIVE_AGENT_SETTINGS_PATH ||
  path.join(__dirname, '..', 'data', 'live-agent-settings.json');

let store = { sessions: {} };
let loaded = false;

const LIVE_AGENT_HUMAN_CONNECTED = 'live_agent_human_connected';

function trim(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function resolveAgentDisplayName(email) {
  const e = normalizeEmail(email);
  if (!e) return 'Agent';
  const settings = loadSettings();
  const profiles = (settings.general && settings.general.agentProfiles) || [];
  for (let i = 0; i < profiles.length; i += 1) {
    const p = profiles[i];
    if (p && normalizeEmail(p.email) === e && trim(p.name)) {
      return trim(p.name);
    }
  }
  const local = e.split('@')[0];
  return local ? local.charAt(0).toUpperCase() + local.slice(1) : 'Agent';
}

function syncVisitorNameFromTranscript(session) {
  if (!session || !session.sessionId) return false;
  if (trim(session.visitorName)) return false;
  try {
    const doc = chatTranscript.getSessionDoc(session.sessionId);
    const meta = doc && doc.meta && typeof doc.meta === 'object' ? doc.meta : {};
    const name = trim(meta.name) || trim(meta.visitorName);
    if (name) {
      session.visitorName = name;
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

function normalizeMessageRole(m) {
  let role = trim(m && m.role);
  if (!role && m && m.from) {
    const f = String(m.from).toLowerCase();
    if (f === 'agent' || f === 'staff') role = 'agent';
    else if (f === 'system') role = 'system';
    else role = 'visitor';
  }
  return role || 'visitor';
}

function isHumanJoinSystemText(text) {
  const t = trim(text);
  return (
    t === LIVE_AGENT_HUMAN_CONNECTED ||
    /^.+ joined the chat\.?$/i.test(t) ||
    /^Agent\s+\S+@\S+\s+accepted the chat\.?$/i.test(t)
  );
}

function formatSystemMessageForVisitor(text, conversation) {
  if (!isHumanJoinSystemText(text)) return text || '';
  const email =
    trim(conversation && conversation.assignedAgentEmail) ||
    trim(conversation && conversation.acceptedByEmail);
  const name = resolveAgentDisplayName(email);
  return `You are now chatting with ${name}.`;
}

function enrichMessageForAudience(m, conversation, audience) {
  const role = normalizeMessageRole(m);
  const base = serializeMessage({ ...m, role });
  if (audience !== 'visitor') return base;
  if (base.role === 'system') {
    return { ...base, text: formatSystemMessageForVisitor(base.text, conversation) };
  }
  if (base.role === 'agent' && base.senderEmail) {
    return {
      ...base,
      senderDisplayName: resolveAgentDisplayName(base.senderEmail),
    };
  }
  return base;
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeEmail(email) {
  return trim(email).toLowerCase();
}

function safeId(id) {
  const s = trim(id);
  if (!s) throw new Error('Invalid conversation id');
  return s.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 128);
}

function reloadStoreFromDisk() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      const raw = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
      if (raw && typeof raw.sessions === 'object') {
        store = raw;
      } else {
        store = { sessions: {} };
      }
    }
  } catch (e) {
    console.warn('[live-agent] load failed:', e.message);
    store = { sessions: {} };
  }
}

function loadStore() {
  reloadStoreFromDisk();
  loaded = true;
}

function saveStore() {
  try {
    const dir = path.dirname(DATA_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const tmp = DATA_PATH + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(store, null, 2), 'utf8');
    fs.renameSync(tmp, DATA_PATH);
  } catch (e) {
    console.warn('[live-agent] save failed:', e.message);
  }
}

function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
    }
  } catch {
    /* ignore */
  }
  return {
    general: { showAgentNameToVisitor: true, agentProfiles: [] },
    routing: { mode: 'parallel', maxConcurrentChatsPerAgent: 5 },
    departments: [{ id: 'general', name: 'General', agentEmails: [] }],
  };
}

function saveSettings(settings) {
  const dir = path.dirname(SETTINGS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf8');
  return settings;
}

function ensureMessageIds(session) {
  if (!session || !Array.isArray(session.messages)) return false;
  let dirty = false;
  session.messages.forEach((m) => {
    if (!m || typeof m !== 'object') return;
    if (!trim(m.id)) {
      m.id = randomUUID();
      dirty = true;
    }
    if (!trim(m.createdAt) && m.at) {
      m.createdAt = m.at;
      dirty = true;
    }
    if (!trim(m.role)) {
      m.role = normalizeMessageRole(m);
      dirty = true;
    }
  });
  return dirty;
}

function getSession(sessionId) {
  loadStore();
  const key = safeId(sessionId);
  const s = store.sessions[key] || null;
  if (s && ensureMessageIds(s)) {
    saveStore();
  }
  return s;
}

function serializeConversation(id, s) {
  if (!s) return null;
  const status = s.status || 'waiting';
  let humanMode = s.humanMode || '';
  if (!humanMode) {
    if (status === 'waiting') humanMode = 'waiting';
    else if (status === 'active') humanMode = 'human';
    else humanMode = 'ai';
  }
  const msgs = s.messages || [];
  const last = msgs.length ? msgs[msgs.length - 1] : null;
  return {
    id,
    status,
    humanMode,
    aiEnabled: typeof s.aiEnabled === 'boolean' ? s.aiEnabled : status === 'closed',
    botid: s.botid || 'default',
    visitorName: trim(s.visitorName),
    assignedAgentEmail: trim(s.assignedAgentEmail),
    departmentId: s.departmentId || 'general',
    departmentName: s.departmentName || 'General',
    currentAssigneeEmail: trim(s.currentAssigneeEmail || s.assignedAgentEmail),
    lastMessagePreview: last ? String(last.text || '').slice(0, 120) : '',
    unreadForAgent: Number(s.unreadForAgent) || 0,
    unreadForVisitor: Number(s.unreadForVisitor) || 0,
    requestedAt: s.requestedAt || s.createdAt,
    claimedAt: s.claimedAt || s.acceptedAt,
    acceptedAt: s.acceptedAt || s.claimedAt,
    acceptedByEmail: trim(s.acceptedByEmail || s.assignedAgentEmail),
    closedAt: s.closedAt,
    closedByEmail: trim(s.closedByEmail),
    lastMessageAt: s.lastMessageAt || s.updatedAt,
  };
}

function serializeMessage(m) {
  const role = normalizeMessageRole(m);
  return {
    id: m.id,
    role,
    text: m.text || '',
    senderEmail: trim(m.senderEmail),
    senderDisplayName: trim(m.senderDisplayName || m.senderEmail),
    createdAt: m.createdAt || m.at,
    from:
      role === 'agent' ? 'agent' : role === 'system' ? 'system' : 'user',
    at: m.createdAt || m.at,
  };
}

function appendMessage(session, opts) {
  const text = trim(opts.text);
  if (!text) return null;
  const role = trim(opts.role) || 'visitor';
  const msg = {
    id: randomUUID(),
    role,
    text,
    senderEmail: trim(opts.senderEmail),
    senderDisplayName: trim(opts.senderDisplayName),
    createdAt: nowIso(),
  };
  session.messages = session.messages || [];
  session.messages.push(msg);
  session.lastMessageAt = msg.createdAt;
  session.updatedAt = msg.createdAt;
  session.lastMessagePreview = text.slice(0, 120);
  if (opts.bumpUnread) {
    if (opts.bumpUnread.agent != null) {
      session.unreadForAgent = (Number(session.unreadForAgent) || 0) + opts.bumpUnread.agent;
    }
    if (opts.bumpUnread.visitor != null) {
      session.unreadForVisitor =
        (Number(session.unreadForVisitor) || 0) + opts.bumpUnread.visitor;
    }
  }
  const transcriptRole =
    role === 'agent' ? 'agent' : role === 'visitor' ? 'user' : null;
  if (transcriptRole) {
    try {
      chatTranscript.appendTurn(session.sessionId, transcriptRole, text, undefined, {
        scheduleSheet: false,
      });
    } catch (e) {
      console.warn('[live-agent] transcript:', e.message);
    }
  }
  return msg;
}

function storageReady() {
  loadStore();
  return true;
}

function requestHumanAgent({
  conversationId,
  botid,
  visitorName,
  initialMessage,
}) {
  const id = safeId(conversationId);
  loadStore();
  let s = store.sessions[id];
  if (s && (s.status === 'waiting' || s.status === 'active')) {
    return {
      conversation: serializeConversation(id, s),
      created: false,
    };
  }
  const t = nowIso();
  s = {
    sessionId: id,
    status: 'waiting',
    humanMode: 'waiting',
    aiEnabled: false,
    botid: trim(botid) || 'default',
    visitorName: trim(visitorName),
    assignedAgentEmail: '',
    departmentId: 'general',
    departmentName: 'General',
    messages: [],
    unreadForAgent: 0,
    unreadForVisitor: 0,
    createdAt: t,
    updatedAt: t,
    requestedAt: t,
  };
  if (syncVisitorNameFromTranscript(s)) saveStore();
  if (initialMessage) {
    appendMessage(s, {
      role: 'visitor',
      text: initialMessage,
      bumpUnread: { agent: 1, visitor: 0 },
    });
  } else {
    appendMessage(s, {
      role: 'system',
      text: 'Visitor requested a human agent.',
      bumpUnread: { agent: 1, visitor: 0 },
    });
  }
  store.sessions[id] = s;
  saveStore();
  return { conversation: serializeConversation(id, s), created: true };
}

function getConversation(conversationId) {
  const s = getSession(conversationId);
  if (!s) return null;
  return serializeConversation(s.sessionId, s);
}

/** Block Dialogflow while visitor is in queue or active human chat. */
function isDialogflowBlockedForSession(sessionId) {
  const c = getConversation(sessionId);
  if (!c) return false;
  if (c.status === 'waiting') return true;
  if (c.status === 'active') {
    const hm = String(c.humanMode || '').toLowerCase();
    return hm === 'human' || c.aiEnabled === false;
  }
  return false;
}

function listInbox({ status, agentEmail, limit }) {
  loadStore();
  const me = normalizeEmail(agentEmail);
  const lim = Math.min(Math.max(Number(limit) || 80, 1), 200);
  let nameDirty = false;
  let list = Object.values(store.sessions).map((s) => {
    if (syncVisitorNameFromTranscript(s)) nameDirty = true;
    return serializeConversation(s.sessionId, s);
  });
  if (nameDirty) saveStore();
  const st = trim(status).toLowerCase() || 'all';
  if (st === 'waiting') {
    list = list.filter((c) => c.status === 'waiting');
  } else if (st === 'active') {
    list = list.filter((c) => c.status === 'active');
  } else if (st === 'mine') {
    list = list.filter(
      (c) =>
        (c.status === 'waiting' || c.status === 'active') &&
        normalizeEmail(c.assignedAgentEmail) === me
    );
  } else if (st === 'closed') {
    list = list.filter((c) => c.status === 'closed');
  } else if (st === 'assigned') {
    list = list.filter((c) => c.assignedAgentEmail);
  } else if (st === 'unassigned') {
    list = list.filter((c) => c.status === 'waiting' && !c.assignedAgentEmail);
  } else if (st === 'ai') {
    list = list.filter(
      (c) => c.status === 'active' && String(c.humanMode).toLowerCase() === 'ai'
    );
  } else if (st === 'agent') {
    list = list.filter(
      (c) =>
        c.status === 'active' && String(c.humanMode).toLowerCase() === 'human'
    );
  } else {
    list = list.filter((c) => c.status !== 'closed');
  }
  list.sort((a, b) =>
    String(b.lastMessageAt || b.requestedAt || '').localeCompare(
      String(a.lastMessageAt || a.requestedAt || '')
    )
  );
  return list.slice(0, lim);
}

function acceptConversation({ conversationId, agentEmail }) {
  const id = safeId(conversationId);
  const s = getSession(id);
  if (!s) throw new Error('Conversation not found');
  if (s.status === 'closed') throw new Error('Conversation is closed');
  const me = normalizeEmail(agentEmail);
  if (!me.includes('@')) throw new Error('Work email required to accept chats');
  if (
    s.status === 'active' &&
    s.assignedAgentEmail &&
    normalizeEmail(s.assignedAgentEmail) !== me
  ) {
    throw new Error('Already assigned to another agent');
  }
  const t = nowIso();
  s.status = 'active';
  s.humanMode = 'human';
  s.aiEnabled = false;
  s.assignedAgentEmail = me;
  s.acceptedByEmail = me;
  s.acceptedAt = t;
  s.claimedAt = t;
  s.updatedAt = t;
  s.unreadForAgent = 0;
  if (syncVisitorNameFromTranscript(s)) saveStore();
  const agentDisplayName = resolveAgentDisplayName(me);
  appendMessage(s, {
    role: 'system',
    text: LIVE_AGENT_HUMAN_CONNECTED,
    senderEmail: me,
    senderDisplayName: agentDisplayName,
    bumpUnread: { visitor: 1, agent: 0 },
  });
  saveStore();
  return serializeConversation(id, s);
}

function closeConversation({ conversationId, agentEmail, closedBy }) {
  const id = safeId(conversationId);
  const s = getSession(id);
  if (!s) throw new Error('Conversation not found');
  const me = normalizeEmail(agentEmail);
  if (
    s.status === 'active' &&
    me &&
    s.assignedAgentEmail &&
    normalizeEmail(s.assignedAgentEmail) !== me
  ) {
    throw new Error('Not your session');
  }
  s.status = 'closed';
  s.humanMode = 'ai';
  s.aiEnabled = true;
  s.closedAt = nowIso();
  s.closedByEmail = me;
  s.updatedAt = s.closedAt;
  appendMessage(s, {
    role: 'system',
    text: 'Chat ended. The visitor can continue with the assistant.',
    bumpUnread: { visitor: 1, agent: 0 },
  });
  saveStore();
  return serializeConversation(id, s);
}

function reopenConversation({ conversationId, agentEmail }) {
  const id = safeId(conversationId);
  const s = getSession(id);
  if (!s) throw new Error('Conversation not found');
  const me = normalizeEmail(agentEmail);
  s.status = 'active';
  s.humanMode = 'human';
  s.aiEnabled = false;
  s.assignedAgentEmail = me || s.assignedAgentEmail;
  s.closedAt = '';
  s.updatedAt = nowIso();
  appendMessage(s, {
    role: 'system',
    text: 'Chat reopened.',
    bumpUnread: { visitor: 1, agent: 0 },
  });
  saveStore();
  return serializeConversation(id, s);
}

function listMessages({
  conversationId,
  sinceIso,
  sinceId,
  limit,
  markReadFor,
  audience,
}) {
  const s = getSession(conversationId);
  if (!s) return [];
  const conv = serializeConversation(s.sessionId, s);
  let msgs = s.messages || [];
  const sid = trim(sinceId);
  if (sid) {
    const idx = msgs.findIndex((m) => m && m.id === sid);
    msgs = idx >= 0 ? msgs.slice(idx + 1) : msgs;
  } else {
    const sinceMs = sinceIso ? Date.parse(sinceIso) : 0;
    if (sinceMs) {
      msgs = msgs.filter((m) => {
        const t = Date.parse(m.createdAt || m.at);
        return Number.isFinite(t) ? t > sinceMs : true;
      });
    }
  }
  if (limit) msgs = msgs.slice(-limit);
  const aud = trim(audience).toLowerCase();
  if (aud === 'visitor') {
    msgs = msgs.filter((m) => {
      const role = normalizeMessageRole(m);
      return role === 'agent' || role === 'system';
    });
  }
  if (markReadFor === 'agent') {
    s.unreadForAgent = 0;
    saveStore();
  }
  if (markReadFor === 'visitor') {
    s.unreadForVisitor = 0;
    saveStore();
  }
  return msgs.map((m) =>
    aud === 'visitor'
      ? enrichMessageForAudience(m, conv, 'visitor')
      : serializeMessage(m)
  );
}

function postAgentMessage({ conversationId, text, agentEmail, agentName }) {
  const id = safeId(conversationId);
  let s = getSession(id);
  if (!s) throw new Error('Conversation not found');
  if (s.status === 'closed') throw new Error('Conversation is closed');
  const me = normalizeEmail(agentEmail);
  if (!me.includes('@')) throw new Error('Work email required');
  if (s.status === 'waiting') {
    acceptConversation({ conversationId: id, agentEmail: me });
    s = getSession(id);
  }
  if (
    s.status === 'active' &&
    s.assignedAgentEmail &&
    normalizeEmail(s.assignedAgentEmail) !== me
  ) {
    throw new Error('Assigned to another agent');
  }
  const msg = appendMessage(s, {
    role: 'agent',
    text,
    senderEmail: me,
    senderDisplayName: trim(agentName) || resolveAgentDisplayName(me),
    bumpUnread: { visitor: 1, agent: 0 },
  });
  saveStore();
  return { message: serializeMessage(msg), conversation: serializeConversation(id, s) };
}

function postVisitorMessage({ conversationId, text }) {
  const id = safeId(conversationId);
  let s = getSession(id);
  if (!s) {
    requestHumanAgent({ conversationId: id });
    s = getSession(id);
  }
  if (!s || s.status === 'closed') throw new Error('No active human chat');
  const msg = appendMessage(s, {
    role: 'visitor',
    text,
    bumpUnread: { agent: 1, visitor: 0 },
  });
  saveStore();
  return { message: serializeMessage(msg), conversation: serializeConversation(id, s) };
}

function updateConversationMode({ conversationId, aiEnabled, humanMode }) {
  const id = safeId(conversationId);
  const s = getSession(id);
  if (!s) throw new Error('Conversation not found');
  if (typeof aiEnabled === 'boolean') s.aiEnabled = aiEnabled;
  if (humanMode) s.humanMode = humanMode;
  s.updatedAt = nowIso();
  saveStore();
  return serializeConversation(id, s);
}

function transferConversation({ conversationId, fromAgentEmail, toAgentEmail }) {
  const id = safeId(conversationId);
  const s = getSession(id);
  if (!s) throw new Error('Conversation not found');
  const to = normalizeEmail(toAgentEmail);
  if (!to.includes('@')) throw new Error('Invalid agent email');
  s.assignedAgentEmail = to;
  s.currentAssigneeEmail = to;
  s.updatedAt = nowIso();
  appendMessage(s, {
    role: 'system',
    text: `Chat transferred to ${to}.`,
    bumpUnread: { visitor: 1, agent: 0 },
  });
  saveStore();
  return serializeConversation(id, s);
}

function bulkCloseTests({ idPrefix, maxClose }) {
  loadStore();
  const prefix = trim(idPrefix) || 'test-';
  const max = Math.min(Number(maxClose) || 150, 500);
  let closed = 0;
  Object.keys(store.sessions).forEach((id) => {
    if (closed >= max) return;
    if (!id.startsWith(prefix)) return;
    const s = store.sessions[id];
    if (s && s.status !== 'closed') {
      s.status = 'closed';
      s.humanMode = 'ai';
      s.aiEnabled = true;
      s.closedAt = nowIso();
      closed += 1;
    }
  });
  if (closed) saveStore();
  return { closed, idPrefix: prefix };
}

function touchAgentPresence(email, status) {
  return {
    email: normalizeEmail(email),
    status: status || 'online',
    effectiveStatus: status || 'online',
  };
}

function listAgentsOverview() {
  const settings = loadSettings();
  const emails = new Set();
  (settings.departments || []).forEach((d) => {
    (d.agentEmails || []).forEach((e) => emails.add(normalizeEmail(e)));
  });
  loadStore();
  const stats = {};
  emails.forEach((e) => {
    stats[e] = { email: e, activeChats: 0, totalAccepted: 0, effectiveStatus: 'offline' };
  });
  Object.values(store.sessions).forEach((s) => {
    const a = normalizeEmail(s.assignedAgentEmail);
    if (!a) return;
    if (!stats[a]) stats[a] = { email: a, activeChats: 0, totalAccepted: 0, effectiveStatus: 'online' };
    if (s.status === 'active') stats[a].activeChats += 1;
    if (s.acceptedAt) stats[a].totalAccepted += 1;
  });
  return Object.values(stats);
}

function isAgentEmailRegistered(email) {
  const settings = loadSettings();
  const me = normalizeEmail(email);
  const all = [];
  (settings.departments || []).forEach((d) => {
    (d.agentEmails || []).forEach((e) => all.push(normalizeEmail(e)));
  });
  if (!all.length) return true;
  return all.includes(me);
}

module.exports = {
  DATA_PATH,
  LIVE_AGENT_HUMAN_CONNECTED,
  resolveAgentDisplayName,
  storageReady,
  loadSettings,
  saveSettings,
  requestHumanAgent,
  getConversation,
  isDialogflowBlockedForSession,
  listInbox,
  acceptConversation,
  closeConversation,
  reopenConversation,
  listMessages,
  postAgentMessage,
  postVisitorMessage,
  updateConversationMode,
  transferConversation,
  bulkCloseTests,
  touchAgentPresence,
  listAgentsOverview,
  isAgentEmailRegistered,
  getSession,
  serializeConversation,
  serializeMessage,
};
