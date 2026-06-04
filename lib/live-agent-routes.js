/**
 * Only Refer–compatible /api/live-agent routes + /live-agent static desk.
 */

const path = require('path');
const express = require('express');
const store = require('./live-agent-store');
const context = require('./live-agent-context');

const DESK_DIR = path.join(__dirname, '..', 'public', 'live-agent');

const SHEET_SECRET = String(
  process.env.CONVERSATIONS_SHEET_VIEW_SECRET || ''
).trim();
const DESK_TOKEN = String(process.env.LIVE_AGENT_DESK_TOKEN || '').trim();

function trim(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function setNoCache(res) {
  res.setHeader('Cache-Control', 'no-store');
}

function setPublicCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function jsonError(res, status, message) {
  res.status(status).json({ ok: false, error: message });
}

function secretFromReq(req) {
  const sheetHdr = trim(req.headers['x-conversations-sheet-secret']);
  const agentHdr =
    trim(req.headers['x-agent-token']) || trim(req.headers['x-desk-token']);
  let bearer = '';
  const auth = trim(req.headers.authorization);
  if (/^Bearer\s+/i.test(auth)) bearer = auth.replace(/^Bearer\s+/i, '').trim();
  const q = trim(req.query.token || req.query.secret);
  const candidates = [sheetHdr, agentHdr, bearer, q].filter(Boolean);
  if (SHEET_SECRET && candidates.some((c) => c === SHEET_SECRET)) {
    return { ok: true, reason: 'sheet' };
  }
  if (DESK_TOKEN && candidates.some((c) => c === DESK_TOKEN)) {
    return { ok: true, reason: 'desk' };
  }
  if (!SHEET_SECRET && !DESK_TOKEN) return { ok: true, reason: 'open' };
  return { ok: false, reason: candidates.length ? 'bad' : 'missing' };
}

function readSessionFromReq(req) {
  const check = secretFromReq(req);
  if (!check.ok) return null;
  const email =
    trim(req.headers['x-live-agent-email']) ||
    trim(req.headers['x-live-agent-name']) ||
    'agent';
  return { agentId: email.toLowerCase(), secretOk: true };
}

function requireAgentSession(req, res, next) {
  if (!SHEET_SECRET && !DESK_TOKEN) {
    req.liveAgentSession = { agentId: 'dev@local' };
    return next();
  }
  if (!SHEET_SECRET && !DESK_TOKEN) {
    return jsonError(
      res,
      503,
      'Set CONVERSATIONS_SHEET_VIEW_SECRET or LIVE_AGENT_DESK_TOKEN on the server.'
    );
  }
  const sess = readSessionFromReq(req);
  if (!sess) {
    const check = secretFromReq(req);
    const msg =
      check.reason === 'bad'
        ? 'Unauthorized — secret does not match.'
        : 'Unauthorized — send X-Conversations-Sheet-Secret.';
    return res.status(401).json({ ok: false, error: msg });
  }
  req.liveAgentSession = sess;
  next();
}

function sendHealth(res) {
  setNoCache(res);
  res.json({
    ok: true,
    firestore_ready: store.storageReady(),
    storage_ready: store.storageReady(),
    auth_required: Boolean(SHEET_SECRET || DESK_TOKEN),
    auth_configured: Boolean(SHEET_SECRET || DESK_TOKEN),
    auth_mode: 'conversations_sheet_secret',
  });
}

function mountLiveAgentRoutes(app) {
  app.get('/live-agent/health', (_req, res) => sendHealth(res));
  app.get('/api/live-agent/health', (_req, res) => sendHealth(res));

  app.use(
    '/live-agent',
    express.static(DESK_DIR, {
      index: ['index.html'],
      extensions: ['html'],
      setHeaders(res, filePath) {
        if (filePath.toLowerCase().endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        }
      },
    })
  );

  const router = express.Router();
  router.use(express.json({ limit: '256kb' }));

  router.get('/me', (req, res) => {
    setNoCache(res);
    if (!SHEET_SECRET && !DESK_TOKEN) {
      res.json({ ok: true, agentId: 'dev@local' });
      return;
    }
    const sess = readSessionFromReq(req);
    if (!sess) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
    const email = sess.agentId;
    if (email.includes('@') && !store.isAgentEmailRegistered(email)) {
      return res.status(403).json({
        ok: false,
        error:
          'This email is not registered. Add it in Live Agent Settings → Departments.',
      });
    }
    res.json({ ok: true, agentId: email });
  });

  router.get('/inbox', requireAgentSession, async (req, res) => {
    setNoCache(res);
    try {
      await store.syncPull();
      const status = trim(req.query.status) || 'all';
      const limit = Number(req.query.limit);
      const conversations = store.listInbox({
        status,
        agentEmail: req.liveAgentSession.agentId,
        limit: Number.isFinite(limit) ? limit : 80,
      });
      res.json({
        ok: true,
        conversations,
        status,
        count: conversations.length,
      });
    } catch (err) {
      jsonError(res, 500, err.message || 'Inbox failed');
    }
  });

  router.post('/bulk-close-tests', requireAgentSession, (req, res) => {
    setNoCache(res);
    try {
      const result = store.bulkCloseTests({
        idPrefix: trim(req.body && req.body.idPrefix) || 'test-',
        maxClose: Number(req.body && req.body.limit),
      });
      res.json({ ok: true, ...result });
    } catch (err) {
      jsonError(res, 400, err.message || 'Bulk close failed');
    }
  });

  async function handleAccept(req, res) {
    setNoCache(res);
    const conversationId = trim(
      (req.body && req.body.conversationId) ||
        (req.body && req.body.sessionId)
    );
    if (!conversationId) {
      return jsonError(res, 400, 'conversationId required');
    }
    try {
      await store.syncPull({ force: true });
      const conversation = store.acceptConversation({
        conversationId,
        agentEmail: req.liveAgentSession.agentId,
      });
      await store.syncPush();
      res.json({ ok: true, conversation });
    } catch (err) {
      jsonError(res, 400, err.message || 'Accept failed');
    }
  }

  router.post('/accept', requireAgentSession, handleAccept);
  router.post('/claim', requireAgentSession, handleAccept);

  router.get('/settings', requireAgentSession, (_req, res) => {
    setNoCache(res);
    const settings = store.loadSettings();
    res.json({
      ok: true,
      settings,
      departments: settings.departments || [],
    });
  });

  router.put('/settings', requireAgentSession, (req, res) => {
    setNoCache(res);
    try {
      const settings = store.saveSettings(req.body || {});
      res.json({ ok: true, settings });
    } catch (err) {
      jsonError(res, 400, err.message || 'Settings save failed');
    }
  });

  router.get('/departments', requireAgentSession, (_req, res) => {
    setNoCache(res);
    const settings = store.loadSettings();
    res.json({ ok: true, departments: settings.departments || [] });
  });

  router.post('/departments', requireAgentSession, (req, res) => {
    setNoCache(res);
    const settings = store.loadSettings();
    const name = trim(req.body && req.body.name) || 'Department';
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
    const dept = {
      id,
      name,
      agentEmails: Array.isArray(req.body && req.body.agentEmails)
        ? req.body.agentEmails
        : [],
    };
    settings.departments = settings.departments || [];
    settings.departments.push(dept);
    store.saveSettings(settings);
    res.json({ ok: true, department: dept });
  });

  router.post('/presence', requireAgentSession, (req, res) => {
    setNoCache(res);
    const status = trim(req.body && req.body.status) || 'online';
    const agent = store.touchAgentPresence(req.liveAgentSession.agentId, status);
    res.json({ ok: true, agent });
  });

  router.get('/agents', requireAgentSession, (_req, res) => {
    setNoCache(res);
    res.json({ ok: true, agents: store.listAgentsOverview() });
  });

  router.get('/activity', requireAgentSession, (_req, res) => {
    setNoCache(res);
    res.json({ ok: true, activity: [] });
  });

  router.get('/conversations/:id/messages', requireAgentSession, async (req, res) => {
    setNoCache(res);
    try {
      await store.syncPull();
      const messages = store.listMessages({
        conversationId: req.params.id,
        sinceIso: trim(req.query.since) || undefined,
        sinceId: trim(req.query.sinceId) || undefined,
        limit: Number(req.query.limit) || undefined,
        markReadFor: trim(req.query.markRead) === '1' ? 'agent' : undefined,
      });
      if (trim(req.query.markRead) === '1') {
        await store.syncPush();
      }
      res.json({ ok: true, messages });
    } catch (err) {
      jsonError(res, 500, err.message || 'Messages failed');
    }
  });

  router.post('/conversations/:id/messages', requireAgentSession, async (req, res) => {
    setNoCache(res);
    const text = trim(req.body && req.body.text);
    if (!text) return jsonError(res, 400, 'text required');
    try {
      await store.syncPull({ force: true });
      const result = store.postAgentMessage({
        conversationId: req.params.id,
        text,
        agentEmail: req.liveAgentSession.agentId,
        agentName: trim(req.body && req.body.agentName),
      });
      await store.syncPush();
      res.json({ ok: true, message: result.message, conversation: result.conversation });
    } catch (err) {
      jsonError(res, 400, err.message || 'Send failed');
    }
  });

  router.post('/conversations/:id/reopen', requireAgentSession, (req, res) => {
    setNoCache(res);
    try {
      const conversation = store.reopenConversation({
        conversationId: req.params.id,
        agentEmail: req.liveAgentSession.agentId,
      });
      res.json({ ok: true, conversation });
    } catch (err) {
      jsonError(res, 400, err.message || 'Reopen failed');
    }
  });

  router.post('/conversations/:id/close', requireAgentSession, async (req, res) => {
    setNoCache(res);
    try {
      await store.syncPull({ force: true });
      const conversation = store.closeConversation({
        conversationId: req.params.id,
        agentEmail: req.liveAgentSession.agentId,
      });
      await store.syncPush();
      res.json({ ok: true, conversation });
    } catch (err) {
      jsonError(res, 400, err.message || 'Close failed');
    }
  });

  router.get('/conversations/:id/context', requireAgentSession, async (req, res) => {
    setNoCache(res);
    try {
      const conversation = store.getConversation(req.params.id);
      const visitor = await context.getVisitorContext(req.params.id, {
        conversation,
      });
      res.json({ ok: true, conversation, visitor });
    } catch (err) {
      jsonError(res, 500, err.message || 'Context failed');
    }
  });

  router.post('/conversations/:id/transfer', requireAgentSession, (req, res) => {
    setNoCache(res);
    const toAgentEmail = trim(req.body && req.body.toAgentEmail);
    if (!toAgentEmail) return jsonError(res, 400, 'toAgentEmail required');
    try {
      const conversation = store.transferConversation({
        conversationId: req.params.id,
        fromAgentEmail: req.liveAgentSession.agentId,
        toAgentEmail,
      });
      res.json({ ok: true, conversation });
    } catch (err) {
      jsonError(res, 400, err.message || 'Transfer failed');
    }
  });

  router.post('/conversations/:id/mode', requireAgentSession, async (req, res) => {
    setNoCache(res);
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    try {
      await store.syncPull({ force: true });
      const conversation = store.updateConversationMode({
        conversationId: req.params.id,
        aiEnabled:
          typeof body.aiEnabled === 'boolean' ? body.aiEnabled : undefined,
        humanMode: trim(body.humanMode) || undefined,
      });
      await store.syncPush();
      res.json({ ok: true, conversation });
    } catch (err) {
      jsonError(res, 400, err.message || 'Mode failed');
    }
  });

  app.use('/api/live-agent', router);

  const publicRouter = express.Router();
  publicRouter.use(express.json({ limit: '128kb' }));

  publicRouter.options('*', (_req, res) => {
    setPublicCors(res);
    res.status(204).end();
  });

  publicRouter.post('/request', async (req, res) => {
    setPublicCors(res);
    setNoCache(res);
    const clientSessionId = trim(
      (req.body && req.body.clientSessionId) || (req.body && req.body.sessionId)
    );
    if (!clientSessionId) {
      return jsonError(res, 400, 'clientSessionId required');
    }
    try {
      await store.syncPull({ force: true });
      const result = store.requestHumanAgent({
        conversationId: clientSessionId,
        botid: req.body && req.body.botid,
        visitorName:
          trim(req.body && req.body.visitorName) ||
          trim(req.body && req.body.name),
        initialMessage:
          (req.body && req.body.initialMessage) ||
          (req.body && req.body.previewMessage),
      });
      await store.syncPush();
      res.json({ ok: true, ...result, deduped: !result.created });
    } catch (err) {
      jsonError(res, 500, err.message || 'Request failed');
    }
  });

  publicRouter.get('/sync', async (req, res) => {
    setPublicCors(res);
    setNoCache(res);
    const clientSessionId = trim(
      req.query.clientSessionId || req.query.sessionId
    );
    if (!clientSessionId) {
      return jsonError(res, 400, 'clientSessionId required');
    }
    try {
      await store.syncPull();
      res.json(store.buildVisitorSyncPayload(clientSessionId));
    } catch (err) {
      jsonError(res, 500, err.message || 'Sync failed');
    }
  });

  publicRouter.get('/status', async (req, res) => {
    setPublicCors(res);
    setNoCache(res);
    const clientSessionId = trim(
      req.query.clientSessionId || req.query.sessionId
    );
    if (!clientSessionId) {
      return jsonError(res, 400, 'clientSessionId required');
    }
    try {
      await store.syncPull();
      const payload = store.buildVisitorSyncPayload(clientSessionId);
      const { messages, storageBackend, ...statusOnly } = payload;
      res.json(statusOnly);
    } catch (err) {
      jsonError(res, 500, err.message || 'Status failed');
    }
  });

  publicRouter.get('/messages', async (req, res) => {
    setPublicCors(res);
    setNoCache(res);
    const clientSessionId = trim(
      req.query.clientSessionId || req.query.sessionId
    );
    if (!clientSessionId) {
      return jsonError(res, 400, 'clientSessionId required');
    }
    try {
      await store.syncPull();
      const conversation = store.getConversation(clientSessionId);
      const tail = Number(req.query.tail);
      const messages = store.listMessagesForVisitor(clientSessionId, {
        tail: Number.isFinite(tail) && tail > 0 ? tail : 50,
      });
      const agentName = conversation
        ? store.resolveAgentDisplayName(conversation.assignedAgentEmail)
        : '';
      res.json({ ok: true, messages, agentName, agentProfiles: [] });
    } catch (err) {
      jsonError(res, 500, err.message || 'Messages failed');
    }
  });

  publicRouter.post('/visitor-message', async (req, res) => {
    setPublicCors(res);
    setNoCache(res);
    const clientSessionId = trim(
      (req.body && req.body.clientSessionId) || (req.body && req.body.sessionId)
    );
    const text = trim(req.body && req.body.text) || trim(req.body && req.body.message);
    if (!clientSessionId) return jsonError(res, 400, 'clientSessionId required');
    if (!text) return jsonError(res, 400, 'text required');
    try {
      await store.syncPull({ force: true });
      const result = store.postVisitorMessage({
        conversationId: clientSessionId,
        text,
      });
      await store.syncPush();
      const sync = store.buildVisitorSyncPayload(clientSessionId);
      res.json({
        ok: true,
        ...result,
        deduped: false,
        messages: sync.messages,
        humanHandoffActive: sync.humanHandoffActive,
        agentConnected: sync.agentConnected,
        assignedAgentDisplayName: sync.assignedAgentDisplayName,
      });
    } catch (err) {
      jsonError(res, 400, err.message || 'Send failed');
    }
  });

  /** Legacy widget poll */
  publicRouter.get('/poll', async (req, res) => {
    setPublicCors(res);
    setNoCache(res);
    const sessionId = trim(req.query.sessionId || req.query.clientSessionId);
    if (!sessionId) return jsonError(res, 400, 'sessionId required');
    try {
      await store.syncPull();
      const payload = store.buildVisitorSyncPayload(sessionId);
      res.json({
        ok: true,
        status: payload.status,
        agentName: payload.agentName,
        humanActive: payload.humanActive,
        messages: (payload.messages || []).map((m) => ({
          id: m.id,
          from: m.from,
          text: m.text,
          at: m.createdAt,
          role: m.role,
        })),
      });
    } catch (err) {
      jsonError(res, 500, err.message || 'Poll failed');
    }
  });

  publicRouter.get('/state', (req, res) => {
    setPublicCors(res);
    const sessionId = trim(req.query.sessionId);
    const conversation = store.getConversation(sessionId);
    res.json({
      ok: true,
      status: conversation ? conversation.status : 'none',
      agentName: conversation
        ? (conversation.assignedAgentEmail || '').split('@')[0]
        : '',
      session: conversation,
    });
  });

  publicRouter.post('/user-message', (req, res) => {
    setPublicCors(res);
    const sessionId = trim(req.body && req.body.sessionId);
    const message = trim(req.body && req.body.message);
    try {
      const result = store.postVisitorMessage({
        conversationId: sessionId,
        text: message,
      });
      res.json({ ok: true, ...result });
    } catch (err) {
      jsonError(res, 400, err.message || 'Send failed');
    }
  });

  app.use('/api/live-agent', publicRouter);

  /** Legacy desk queue API */
  app.get('/api/live-agent/queue', requireAgentSession, (_req, res) => {
    const waiting = store.listInbox({ status: 'waiting', limit: 80 });
    const active = store.listInbox({ status: 'active', limit: 80 });
    res.json({
      ok: true,
      waiting: waiting.map((c) => ({
        sessionId: c.id,
        status: c.status,
        createdAt: c.requestedAt,
        updatedAt: c.lastMessageAt,
        preview: c.lastMessagePreview,
      })),
      active: active.map((c) => ({
        sessionId: c.id,
        status: c.status,
        createdAt: c.requestedAt,
        updatedAt: c.lastMessageAt,
        preview: c.lastMessagePreview,
        agentName: (c.assignedAgentEmail || '').split('@')[0],
      })),
    });
  });

  app.get('/api/live-agent/session', requireAgentSession, (req, res) => {
    const sid = trim(req.query.sessionId);
    const s = store.getSession(sid);
    if (!s) return res.json({ error: 'session_not_found' });
    res.json({
      ok: true,
      session: store.serializeConversation(s.sessionId, s),
      messages: (s.messages || []).map(store.serializeMessage),
    });
  });

  app.post('/api/live-agent/agent-message', requireAgentSession, (req, res) => {
    try {
      const result = store.postAgentMessage({
        conversationId: req.body.sessionId,
        text: req.body.message,
        agentEmail: req.liveAgentSession.agentId,
        agentName: req.body.agentName,
      });
      res.json({ ok: true, message: result.message });
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message });
    }
  });

  app.post('/api/live-agent/end', requireAgentSession, (req, res) => {
    try {
      const conversation = store.closeConversation({
        conversationId: req.body.sessionId,
        agentEmail: req.liveAgentSession.agentId,
      });
      res.json({ ok: true, session: conversation });
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message });
    }
  });
}

module.exports = { mountLiveAgentRoutes, secretFromReq, readSessionFromReq };
