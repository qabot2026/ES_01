const express = require('express');
const path = require('path');
const multer = require('multer');
const { randomUUID } = require('crypto');
const dialogflow = require('./lib/dialogflow');
const translate = require('./lib/translate');
const phraseTranslations = require('./lib/phrase-translations');
const formApi = require('./lib/form-api');
const liveAgent = require('./lib/live-agent');
const chatTranscript = require('./lib/chat-transcript');
const sheets = require('./lib/sheets');
const conversationSheet = require('./lib/conversation-sheet');
const gcsUpload = require('./lib/gcs-upload');
const documentsCatalog = require('./lib/documents-catalog');
const conversationTranscriptView = require('./lib/conversation-transcript-view');
const conversationsSheetView = require('./lib/conversations-sheet-view');

const app = express();
const PORT = process.env.PORT || 4567;
const publicDir = path.join(__dirname, 'public');
const PUBLIC_BASE_URL =
  process.env.PUBLIC_BASE_URL ||
  'https://es-based-chatbot-production.up.railway.app';

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: '32kb' }));

const uploadDocumentsMw = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024, files: 10 },
});

app.use((req, res, next) => {
  if (
    /^\/(embed\.js|company\.config\.js|widget\/)/.test(req.path) &&
    /\.(js|css)$/i.test(req.path)
  ) {
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
  }
  next();
});

app.use(express.static(publicDir, {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  etag: true,
}));

app.get('/health', async (_req, res) => {
  const base = {
    status: 'ok',
    service: 'quality-assistant-chatbot',
    projectId: dialogflow.PROJECT_ID,
    credentials: dialogflow.isConfigured() ? 'present' : 'missing',
    credentialsMeta: dialogflow.getCredentialsMeta(),
  };
  if (!dialogflow.isConfigured()) {
    return res.json({ ...base, dialogflow: 'credentials_missing' });
  }
  try {
    await dialogflow.probe();
    res.json({ ...base, dialogflow: 'ready' });
  } catch (err) {
    console.error('[health probe]', dialogflow.formatApiError(err));
    res.status(503).json({
      ...base,
      dialogflow: 'error',
      error: dialogflow.formatApiError(err),
    });
  }
});

app.post('/api/chat', async (req, res) => {
  const {
    message,
    sessionId,
    languageCode = 'en',
    uiLanguageCode,
    event,
  } = req.body || {};
  const sid = sessionId || randomUUID();
  const eventName =
    typeof event === 'string' && event.trim() ? event.trim() : null;
  const uiLang = uiLanguageCode || languageCode;

  if (!eventName) {
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'message or event is required' });
    }
  }

  try {
    if (liveAgent.isDialogflowBlockedForSession(sid)) {
      const conv = liveAgent.getConversation(sid);
      const agentName = conv
        ? liveAgent.resolveAgentDisplayName(conv.assignedAgentEmail)
        : '';
      if (!eventName && message && typeof message === 'string' && message.trim()) {
        try {
          liveAgent.postUserMessage(sid, message.trim());
        } catch (postErr) {
          console.warn('[live-agent] visitor message during handoff:', postErr.message);
        }
      }
      return res.json({
        sessionId: sid,
        reply: '',
        replyParts: [],
        chips: [],
        forms: [],
        messages: [],
        liveAgent: true,
        humanActive: true,
        skipBot: true,
        agentConnected: !!(conv && conv.status === 'active' && conv.assignedAgentEmail),
        assignedAgentDisplayName: agentName,
        connectedMessage: agentName
          ? `You are now chatting with ${agentName}.`
          : '',
      });
    }
    let result = eventName
      ? await dialogflow.detectEvent(sid, eventName, languageCode)
      : await dialogflow.detectIntent(sid, message.trim(), languageCode);
    if (phraseTranslations.isEnabled()) {
      result = phraseTranslations.applyToResult(result, uiLang);
    }
    if (result.liveAgent) {
      let handoffVisitorName = '';
      try {
        const doc = chatTranscript.getSessionDoc(sid);
        const meta = doc && doc.meta && typeof doc.meta === 'object' ? doc.meta : {};
        handoffVisitorName =
          (typeof meta.name === 'string' && meta.name.trim()) ||
          (typeof meta.visitorName === 'string' && meta.visitorName.trim()) ||
          '';
      } catch {
        /* ignore */
      }
      liveAgent.requestHandoff(sid, {
        userLanguage: uiLang,
        previewMessage: message ? message.trim() : '',
        visitorName: handoffVisitorName,
      });
      chatTranscript.mergeSessionMeta(sid, {
        channel: 'Web',
        liveAgentRequested: true,
      });
      result.reply = '';
      result.replyParts = [];
      result.chips = [];
      result.chipHeading = '';
      result.forms = [];
      result.infoCards = [];
      result.downloads = [];
      result.dropdowns = [];
      result.galleries = [];
      result.cardCarousels = [];
      result.liveAgent = true;
      result.humanActive = true;
      result.skipBot = true;
    }

    const userText = eventName ? '' : message && message.trim();
    chatTranscript.logDialogflowExchange(sid, userText, result, {
      skipTranscriptUser: req.body && req.body.skipTranscriptUser === true,
    });

    res.json({ sessionId: sid, ...result });
  } catch (err) {
    const detail = dialogflow.formatApiError(err);
    console.error('[dialogflow]', detail);
    const status =
      err.code === 7 || err.code === 16 || err.message?.includes('not found')
        ? 503
        : 500;
    res.status(status).json({
      error: 'dialogflow_error',
      message: dialogflow.isConfigured()
        ? 'Could not reach Dialogflow. Check credentials and agent setup.'
        : 'Set GOOGLE_CREDENTIALS_JSON in Railway Variables.',
      detail,
      projectId: dialogflow.PROJECT_ID,
      hint:
        err.code === 7
          ? 'Service account needs Dialogflow API Client role on project qualityassistant-ygdm.'
          : err.code === 16
            ? 'Invalid or corrupted JSON key in Railway — re-paste the full service account file.'
            : undefined,
    });
  }
});

app.post('/api/translate', async (req, res) => {
  const { texts, targetLanguageCode, sourceLanguageCode = 'en' } = req.body || {};
  const target = translate.normalizeLang(targetLanguageCode);
  const source = translate.normalizeLang(sourceLanguageCode);
  const list = Array.isArray(texts) ? texts.map((t) => String(t == null ? '' : t)) : [];

  if (!target || target === source) {
    return res.json({ translations: list, translated: false });
  }

  if (!translate.isConfigured()) {
    return res.status(503).json({
      error: 'translate_not_configured',
      message:
        'Enable Cloud Translation API and use GOOGLE_CREDENTIALS_JSON (same as Dialogflow).',
      translations: list,
    });
  }

  try {
    const translations = await translate.translateTexts(list, target, source);
    res.json({ translations, translated: true, target, source });
  } catch (err) {
    console.error('[translate]', err.message);
    res.status(500).json({
      error: 'translate_error',
      message: err.message,
      translations: list,
    });
  }
});

app.get('/api/detect-country', async (req, res) => {
  try {
    const lat = req.query.lat;
    const lng = req.query.lng;
    const result =
      lat != null && lng != null && String(lat) !== '' && String(lng) !== ''
        ? await formApi.detectCountryFromCoords(lat, lng)
        : await formApi.detectCountryFromIp(formApi.getClientIp(req));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'detect_country_failed', message: err.message });
  }
});

app.get('/api/nearest-branches', (req, res) => {
  const lat = req.query.lat;
  const lng = req.query.lng;
  const limit = req.query.limit;
  res.json(formApi.nearestBranches(lat, lng, limit));
});

app.get('/api/appointment-slots', (req, res) => {
  const formId = String(
    req.query.formId || req.query.form_id || req.query.scope || req.query.type || 'appointment'
  ).trim();
  const date = String(req.query.date || '').trim();
  res.json(formApi.appointmentSlots(formId, '', date));
});

/** One call per month — calendar paints dates fast, then applies red/grey. */
app.get('/api/appointment-month', (req, res) => {
  const formId = String(
    req.query.formId || req.query.form_id || req.query.scope || 'appointment'
  ).trim();
  const year = req.query.year;
  const month = req.query.month;
  res.json(formApi.appointmentMonthSummary(formId, year, month));
});

/** Read-only schedule template (edit data/appointment-schedule.json on server). */
app.get('/api/appointment-schedule', (_req, res) => {
  res.json(formApi.getAppointmentSchedule());
});

function requireDeskAuth(req, res, next) {
  if (liveAgent.verifyDeskToken(req).ok) return next();
  res.status(401).json(liveAgent.deskAuthFailed());
}

/** --- Live agent service desk (Only Refer–compatible) --- */
liveAgent.mountLiveAgentRoutes(app);

app.get('/api/live-agent/desk-config', (_req, res) => {
  res.json({
    tokenRequired: liveAgent.isDeskTokenRequired(),
    sheetsConfigured: sheets.isConfigured(),
    publicBaseUrl: PUBLIC_BASE_URL,
  });
});

app.get('/api/sheets/status', async (_req, res) => {
  const status = sheets.getStatus();
  if (sheets.isConfigured() && status.lastProbeAt == null) {
    try {
      status.probe = await sheets.probe();
    } catch (e) {
      status.probe = { ok: false, error: e.message };
    }
  }
  res.json(status);
});

app.post('/api/sheets/backfill-conv-links', requireDeskAuth, async (_req, res) => {
  try {
    await sheets.applySheetDateColumnFormat();
    const result = await sheets.backfillConvLinkColumn();
    res.json(result);
  } catch (err) {
    console.error('[sheets/backfill]', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/sheets/apply-date-format', requireDeskAuth, async (_req, res) => {
  try {
    await sheets.applySheetDateColumnFormat();
    res.json({ ok: true, message: 'Conv. Date and App. Date columns set to DD/MM/YYYY.' });
  } catch (err) {
    console.error('[sheets/apply-date-format]', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/session-context', (req, res) => {
  const { sessionId } = req.body || {};
  const sid = String(sessionId || '').trim();
  if (!sid) {
    return res.status(400).json({ error: 'session_required' });
  }
  const meta = conversationSheet.metaFromClientBody(req.body || {});
  const ip = formApi.getClientIp(req);
  if (ip) meta.ip = ip;
  if (Object.keys(meta).length) {
    chatTranscript.mergeSessionMeta(sid, meta);
  }
  res.json({ ok: true, sessionId: sid, merged: Object.keys(meta).length });
});

app.post(
  '/api/upload/documents',
  uploadDocumentsMw.array('files', 10),
  async (req, res) => {
    if (!gcsUpload.isConfigured()) {
      return res.status(503).json({
        error: 'gcs_not_configured',
        message:
          'Set GCS_BUCKET_NAME and GOOGLE_CREDENTIALS_JSON on Railway. See GCS-STORAGE-STEPS.md',
      });
    }
    const sessionId = String(req.body.sessionId || '').trim();
    if (!sessionId) {
      return res.status(400).json({ error: 'session_required' });
    }
    let files = req.files || [];
    if (!files.length) {
      return res.status(400).json({ error: 'files_required' });
    }
    files = chatTranscript.filterDuplicateUploadFilesForSession(sessionId, files);
    if (!files.length) {
      return res.json({
        ok: true,
        sessionId,
        duplicate_skipped: true,
        message: 'Files already uploaded for this session.',
      });
    }
    try {
      const uploadTag = String(req.body.tag || req.body.upload_tag || '').trim();
      const pack = await gcsUpload.uploadSubmissionFilesToGcs(files, {
        mobile: req.body.mobile,
        dialCode: req.body.dial_code || req.body.dialCode,
        clientSessionId: sessionId,
        name: req.body.name,
        email: req.body.email,
        tag: uploadTag,
      });
      const meta = {
        document: pack.document_names || '',
        document_names: pack.document_names || '',
        uploaded_files: (pack.uploads || []).map((u) => ({
          original_name: u.original_name,
          gcs_object: u.gcs_object,
          size_bytes: u.size_bytes,
        })),
        storage_folder: pack.storage_folder,
        storage_path: pack.storage_path,
        document_link: pack.document_link,
        document_links: pack.document_links,
      };
      if (req.body.name) meta.name = String(req.body.name).trim();
      if (req.body.email) meta.email = String(req.body.email).trim();
      if (req.body.mobile) meta.mobile = String(req.body.mobile).trim();
      if (req.body.dial_code || req.body.dialCode) {
        meta.dial_code = String(req.body.dial_code || req.body.dialCode).trim();
      }
      if (uploadTag) meta.tag = uploadTag;
      meta.userEngaged = true;
      meta.last_upload_at = new Date().toISOString();
      chatTranscript.mergeSessionMeta(sessionId, meta);
      if (chatTranscript.shouldScheduleSheetForSession(sessionId)) {
        conversationSheet.scheduleSheetSync(sessionId);
      }
      res.json({
        ok: true,
        sessionId,
        storage_folder: pack.storage_folder,
        document_names: pack.document_names,
        document_link: pack.document_link,
        uploads: pack.uploads,
      });
    } catch (err) {
      console.error('[gcs-upload]', err.message);
      res.status(500).json({
        error: 'gcs_upload_failed',
        message: err.message,
      });
    }
  }
);

app.post('/api/transcript/append', (req, res) => {
  const { sessionId, role, text, meta, turns } = req.body || {};
  if (Array.isArray(turns) && turns.length) {
    return res.json({
      ok: true,
      added: chatTranscript.appendTurns(sessionId, turns),
    });
  }
  const turn = chatTranscript.appendTurn(sessionId, role, text, meta);
  res.json({ ok: !!turn, turn });
});

app.get('/api/transcript', requireDeskAuth, (req, res) => {
  res.json(chatTranscript.getTranscript(req.query.sessionId));
});

app.get('/conversation-transcript', (_req, res) => {
  res.sendFile(path.join(publicDir, 'conversation-transcript.html'));
});

app.get('/conversations-sheet', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.sendFile(path.join(publicDir, 'conversations-sheet.html'));
});

function setConversationsSheetCors(req, res) {
  const origin =
    typeof req.headers.origin === 'string' ? req.headers.origin.trim() : '';
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Authorization, Content-Type, X-Conversations-Sheet-Secret, X-Agent-Token, X-Desk-Token'
  );
}

function requireConversationsViewer(req, res) {
  const auth = conversationTranscriptView.verifyViewerAuth(req);
  if (!auth.ok) {
    res.status(401).json({
      ok: false,
      error:
        auth.error ||
        'Unauthorized — use X-Conversations-Sheet-Secret or desk token (X-Agent-Token).',
    });
    return false;
  }
  if (!sheets.isConfigured()) {
    res.status(503).json({
      ok: false,
      error:
        'Google Sheets not configured (SHEETS_SPREADSHEET_ID + service account).',
    });
    return false;
  }
  return true;
}

app.options('/api/conversations-sheet', (req, res) => {
  setConversationsSheetCors(req, res);
  res.sendStatus(204);
});

app.options('/api/conversations-sheet-stats', (req, res) => {
  setConversationsSheetCors(req, res);
  res.sendStatus(204);
});

app.options('/api/conversations-sheet-export', (req, res) => {
  setConversationsSheetCors(req, res);
  res.sendStatus(204);
});

app.options('/api/conversations-sheet-sync-dashboard', (req, res) => {
  setConversationsSheetCors(req, res);
  res.sendStatus(204);
});

app.get('/api/conversations-sheet', async (req, res) => {
  setConversationsSheetCors(req, res);
  res.setHeader('Cache-Control', 'no-store');
  if (!requireConversationsViewer(req, res)) return;
  try {
    let maxRows = 200;
    if (req.query && req.query.limit != null) {
      const n = Number.parseInt(String(req.query.limit), 10);
      if (Number.isFinite(n) && n >= 5 && n <= 500) maxRows = n;
    }
    let offset = 0;
    if (req.query && req.query.offset != null) {
      const o = Number.parseInt(String(req.query.offset), 10);
      if (Number.isFinite(o) && o >= 0 && o <= 500000) offset = o;
    }
    const rawFrom =
      req.query && typeof req.query.from === 'string' ? req.query.from.trim() : '';
    const rawTo =
      req.query && typeof req.query.to === 'string' ? req.query.to.trim() : '';
    const allInRange = req.query.all !== '0' && req.query.all !== 'false';
    const includeStats =
      req.query.includeStats !== '0' && req.query.includeStats !== 'false';
    const payload = await conversationsSheetView.fetchConversationSheetPreview({
      maxRows,
      offset,
      allInRange,
      includeStats,
      from: rawFrom,
      to: rawTo,
    });
    res.json({ ok: true, ...payload });
  } catch (err) {
    console.error('[conversations-sheet]', err.message);
    const msg = String(err.message || err);
    const status = msg.includes('Invalid date parameter') ? 400 : 500;
    res.status(status).json({ ok: false, error: msg.slice(0, 500) });
  }
});

app.get('/api/conversations-sheet-stats', async (req, res) => {
  setConversationsSheetCors(req, res);
  res.setHeader('Cache-Control', 'no-store');
  if (!requireConversationsViewer(req, res)) return;
  try {
    const q = req.query || {};
    const from = typeof q.from === 'string' ? q.from.trim() : '';
    const to = typeof q.to === 'string' ? q.to.trim() : '';
    const statsOpts =
      from || to ? { from: from || undefined, to: to || undefined } : {};
    const payload =
      await conversationsSheetView.fetchConversationLeadCaptureStats(statsOpts);
    res.json({ ok: true, ...payload });
  } catch (err) {
    console.error('[conversations-sheet-stats]', err.message);
    const msg = String(err.message || err);
    const status = msg.includes('Invalid date parameter') ? 400 : 500;
    res.status(status).json({ ok: false, error: msg.slice(0, 500) });
  }
});

app.get('/api/conversations-sheet-export', async (req, res) => {
  setConversationsSheetCors(req, res);
  res.setHeader('Cache-Control', 'no-store');
  if (!requireConversationsViewer(req, res)) return;
  try {
    const q = req.query || {};
    const from = typeof q.from === 'string' ? q.from.trim() : '';
    const to = typeof q.to === 'string' ? q.to.trim() : '';
    const payload = await conversationsSheetView.fetchConversationSheetExport(
      from || to ? { from: from || undefined, to: to || undefined } : {}
    );
    const csvBody = conversationsSheetView.rowsToCsv(
      payload.headers,
      payload.conversations
    );
    const df =
      payload.dateFilter && typeof payload.dateFilter === 'object'
        ? payload.dateFilter
        : {};
    const fn = conversationsSheetView.exportFilename(df.from, df.to);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fn}"`);
    res.send(csvBody);
  } catch (err) {
    console.error('[conversations-sheet-export]', err.message);
    res.status(500).json({ ok: false, error: String(err.message || err).slice(0, 500) });
  }
});

app.post('/api/conversations-sheet-sync-dashboard', async (req, res) => {
  setConversationsSheetCors(req, res);
  res.setHeader('Cache-Control', 'no-store');
  if (!requireConversationsViewer(req, res)) return;
  res.status(501).json({
    ok: false,
    error:
      'Dashboard sheet sync (Sheet2) is not enabled on this server yet. Metrics on this page still load from the live API.',
  });
});

app.get('/api/conversation-transcript', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const auth = conversationTranscriptView.verifyViewerAuth(req);
  if (!auth.ok) {
    return res.status(401).json({ ok: false, error: auth.error });
  }
  try {
    const session = String(req.query.session || '').trim();
    const result = await conversationTranscriptView.getConversationTranscript(
      session
    );
    if (!result.ok) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err) {
    console.error('[conversation-transcript]', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/analytics/summary', requireDeskAuth, (_req, res) => {
  const queue = liveAgent.getQueue();
  res.json({
    ok: true,
    sheetsConfigured: sheets.isConfigured(),
    ...chatTranscript.getAnalyticsSummary(queue),
  });
});

app.get('/api/documents/catalog', requireDeskAuth, async (req, res) => {
  try {
    const result = await documentsCatalog.listDocumentCatalog({
      limit: req.query.limit,
    });
    if (!result.ok) {
      return res.status(503).json(result);
    }
    res.json(result);
  } catch (err) {
    console.error('[documents/catalog]', err.message);
    res.status(500).json({ ok: false, error: 'catalog_failed', message: err.message });
  }
});

app.get('/api/documents/download-url', requireDeskAuth, async (req, res) => {
  try {
    const result = await documentsCatalog.getDownloadUrl(req.query.object);
    if (!result.ok) {
      const status = result.error === 'not_found' ? 404 : 503;
      return res.status(status).json(result);
    }
    res.json(result);
  } catch (err) {
    console.error('[documents/download-url]', err.message);
    res.status(500).json({ ok: false, error: 'download_failed', message: err.message });
  }
});

app.get('/api/documents/download', requireDeskAuth, async (req, res) => {
  try {
    const result = await documentsCatalog.streamFileDownload(req.query.object, res);
    if (!result.ok) {
      const status =
        result.error === 'not_found'
          ? 404
          : result.error === 'gcs_not_configured'
            ? 503
            : 400;
      return res.status(status).json(result);
    }
  } catch (err) {
    console.error('[documents/download]', err.message);
    if (!res.headersSent) {
      res.status(500).json({ ok: false, error: 'download_failed', message: err.message });
    }
  }
});

app.get('/api/phrase-translations', (req, res) => {
  const lang = String(req.query.lang || 'en').trim();
  if (lang === 'en') {
    return res.json({ lang, map: {}, enabled: phraseTranslations.isEnabled() });
  }
  res.json({
    lang,
    map: phraseTranslations.getFlatMapForLang(lang),
    enabled: phraseTranslations.isEnabled(),
  });
});

app.get('/api/config', (_req, res) => {
  res.json({
    projectId: dialogflow.PROJECT_ID,
    agentId: '07ccbfd0-4cad-4898-8323-e6baeec80fc1',
    dialogflowReady: dialogflow.isConfigured(),
    translateReady: translate.isConfigured(),
    phraseTranslationsFile: phraseTranslations.isEnabled(),
    phraseTranslationsPath: phraseTranslations.DATA_PATH,
    sheetsConfigured: sheets.isConfigured(),
    sheetsClientReady: sheets.isClientReady(),
    sheetsSpreadsheetIdSet: !!sheets.SPREADSHEET_ID,
    sheetsRange: sheets.RANGE,
    gcsConfigured: gcsUpload.isConfigured(),
    gcsBucket: gcsUpload.BUCKET_NAME || null,
    sheetsServiceAccountEmail: require('./lib/google-credentials').getClientEmail(),
    publicBaseUrl: PUBLIC_BASE_URL,
    embedScript: `${PUBLIC_BASE_URL}/embed.js`,
    deskUrl: `${PUBLIC_BASE_URL}/live-agent/`,
    dashboardUrl: `${PUBLIC_BASE_URL}/dashboard/`,
  });
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  if (path.extname(req.path)) return next();
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(PORT, () => {
  const local = `http://localhost:${PORT}`;
  console.log(`QualityAssistant → ${PUBLIC_BASE_URL}`);
  console.log(`Local: ${local}`);
  if (!dialogflow.isConfigured()) {
    console.warn('⚠ GOOGLE_CREDENTIALS_JSON missing — /api/chat will not work.');
    return;
  }
  if (sheets.isConfigured()) {
    console.log(
      '[sheets] enabled — spreadsheet',
      sheets.SPREADSHEET_ID.slice(0, 8) + '…',
      'range',
      sheets.RANGE,
      'account',
      require('./lib/google-credentials').getClientEmail() || '(parse failed)'
    );
    sheets
      .probe()
      .then((p) => {
        if (p.ok) {
          console.log('[sheets] probe OK — tab', p.configuredTab, 'exists:', p.tabExists);
          if (p.tabExists === false) {
            console.warn(
              '[sheets] Tab "' +
                p.configuredTab +
                '" not in sheet. Tabs:',
              (p.tabNames || []).join(', '),
              '— fix SHEETS_RANGE'
            );
          }
        } else {
          console.error('[sheets] probe failed:', JSON.stringify(p));
        }
      })
      .catch((err) => console.error('[sheets] probe error:', err.message));
  } else if (String(process.env.SHEETS_SPREADSHEET_ID || '').trim()) {
    console.warn(
      '[sheets] SHEETS_SPREADSHEET_ID is set but logging is off — need GOOGLE_CREDENTIALS_JSON'
    );
  } else {
    console.warn('[sheets] disabled — set SHEETS_SPREADSHEET_ID on Railway');
  }
  if (gcsUpload.isConfigured()) {
    console.log('[gcs] upload enabled — bucket', gcsUpload.BUCKET_NAME);
  } else {
    console.warn(
      '[gcs] disabled — set GCS_BUCKET_NAME + GOOGLE_CREDENTIALS_JSON (GCS-STORAGE-STEPS.md)'
    );
  }
  dialogflow
    .probe()
    .then(() => console.log('Dialogflow probe OK'))
    .catch((err) =>
      console.error('Dialogflow probe failed:', dialogflow.formatApiError(err))
    );
});
