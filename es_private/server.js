const express = require('express');
const path = require('path');
const multer = require('multer');
const { randomUUID } = require('crypto');
const dialogflow = require('./lib/dialogflow');
const translate = require('./lib/translate');
const phraseTranslations = require('./lib/phrase-translations');
const messageSyntax = require('./lib/message-syntax');
const formApi = require('./lib/form-api');
const liveAgent = require('./lib/live-agent');
const chatTranscript = require('./lib/chat-transcript');
const sheets = require('./lib/sheets');
const conversationSheet = require('./lib/conversation-sheet');
const gcsUpload = require('./lib/gcs-upload');
const documentsCatalog = require('./lib/documents-catalog');
const conversationTranscriptView = require('./lib/conversation-transcript-view');
const conversationsSheetView = require('./lib/conversations-sheet-view');
const queryAnalytics = require('./lib/query-analytics');
const appointmentsView = require('./lib/appointments-view');
const appointmentStatus = require('./lib/appointment-status-store');
const esTestMode = require('./lib/es-test-mode');
const sitePresetsStore = require('./lib/site-presets-store');
const dashboardBots = require('./lib/dashboard-bots');
const googleCredentials = require('./lib/google-credentials');
const botProjectFiles = require('./lib/bot-project-files');
const botSheetTabs = require('./lib/bot-sheet-tabs');
const dataFileSync = require('./lib/data-file-sync');
const clientPaths = require('./lib/client-paths');
const DEFAULT_RECEPTIONIST_BOT_ID = botSheetTabs.DEFAULT_BOT_ID;
const DEFAULT_RECEPTIONIST_SITE_PRESET = botSheetTabs.DEFAULT_SITE_PRESET;
const liveAgentSheet = require('./lib/live-agent-sheet');
const fs = require('fs');
const appEnv = require('./lib/app-env');
const channels = require('./lib/channels');
const channelSessions = require('./lib/channels/channel-sessions');
const channelChat = require('./lib/channels/channel-chat');

const app = express();
const PORT = appEnv.PORT;
const publicDir = path.join(__dirname, '..', 'es_public');
const PUBLIC_BASE_URL = appEnv.PUBLIC_BASE_URL;

const CORS_ALLOW_HEADERS =
  'Content-Type, X-Agent-Token, X-Desk-Token, X-Conversations-Sheet-Secret, Authorization, X-Live-Agent-Email, X-Live-Agent-Name, X-ES-Test-Mode';

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', CORS_ALLOW_HEADERS);
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

channels.registerRoutes(app);

app.use(express.json({ limit: '32kb' }));

// `es_public/client-based/` = per-client browser files. `es_private/client-based/data/` = server data.
app.use((req, res, next) => {
  if (req.path === '/public' || req.path.startsWith('/public/')) {
    const rest = req.path.slice('/public'.length) || '/';
    const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    return res.redirect(301, rest + qs);
  }
  next();
});

const uploadDocumentsMw = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024, files: 10 },
});

app.use((req, res, next) => {
  if (/\.html$/i.test(req.path)) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    return next();
  }
  if (
    /^\/(embed\.js|company\.config\.js|widget\/|dashboard\/)/.test(req.path) &&
    /\.(js|css)$/i.test(req.path)
  ) {
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
  }
  next();
});

const APPEARANCE_ICON_BUCKET = appEnv.APPEARANCE_MENU_ICON_BUCKET;
const APPEARANCE_ICON_OBJECT = appEnv.APPEARANCE_MENU_ICON_OBJECT;

/** Appearance menu icon — GCS object is private; serve via server credentials */
app.get('/dashboard/icons/appearance-menu-icon.png', async (req, res) => {
  const localIcon = path.join(publicDir, 'dashboard', 'icons', 'appearance-menu-icon.png');
  if (fs.existsSync(localIcon)) {
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.sendFile(localIcon);
  }

  const creds = googleCredentials.getServiceAccountCredentials();
  if (!creds) {
    return res.status(404).type('text/plain').send('Appearance icon not configured');
  }

  try {
    const { Storage } = require('@google-cloud/storage');
    const storage = new Storage({
      credentials: creds,
      projectId: creds.project_id,
    });
    const file = storage.bucket(APPEARANCE_ICON_BUCKET).file(APPEARANCE_ICON_OBJECT);
    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).type('text/plain').send('Appearance icon not found');
    }
    const [meta] = await file.getMetadata();
    res.setHeader('Content-Type', meta.contentType || 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    file
      .createReadStream()
      .on('error', (err) => {
        console.warn('[appearance-icon]', err.message);
        if (!res.headersSent) res.status(502).end();
      })
      .pipe(res);
  } catch (err) {
    console.warn('[appearance-icon]', err.message);
    res.status(502).type('text/plain').send('Appearance icon unavailable');
  }
});

/** Dynamic bot settings page — works for any registered 5-digit bot ID */
app.get('/bot-settings/:botId.html', (req, res) => {
  const botId = String(req.params.botId || '').trim();
  if (!/^\d{5}$/.test(botId)) {
    return res.status(404).type('text/plain').send('Not found');
  }
  const project = sitePresetsStore.resolveProject(botId);
  if (!project) {
    return res.status(404).type('text/plain').send('Unknown bot ID');
  }
  res.type('html').send(botProjectFiles.renderBotSettingsHtml(botId, project.name));
});

/** Per-client files — es_public/client-based/ */
app.get('/company.config.js', (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache, must-revalidate');
  res.sendFile(clientPaths.companyConfigPath());
});

app.use(
  '/bot-configs',
  express.static(clientPaths.botConfigsDir(), {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
    etag: true,
  })
);

app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  const page = path.basename(req.path);
  if (!/\.html$/i.test(page)) return next();
  const pagePath = path.join(clientPaths.pagesDir(), page);
  if (fs.existsSync(pagePath)) return res.sendFile(pagePath);
  next();
});

app.use(express.static(publicDir, {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  etag: true,
}));

app.get('/es-test', (_req, res) => {
  res.redirect(301, '/es-test/');
});

app.get('/health', async (_req, res) => {
  const base = {
    status: 'ok',
    service: 'es-chatbot',
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
    dialogflowProjectId,
    orchestrationMode,
    orchestrationChildId,
    channel,
  } = req.body || {};
  const sid = channelSessions.resolveWebSessionId(sessionId);

  try {
    const result = await channelChat.processChatTurn({
      sessionId: sid,
      message,
      languageCode,
      uiLanguageCode,
      event,
      dialogflowProjectId,
      orchestrationMode,
      orchestrationChildId,
      channel: channel || req.body.source || 'web',
      skipTranscriptUser: req.body && req.body.skipTranscriptUser === true,
      req,
    });
    const { outboundText, ...json } = result;
    res.json(json);
  } catch (err) {
    if (err.status === 400) {
      return res.status(400).json({ error: 'message or event is required' });
    }
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
          ? 'Service account needs Dialogflow API Client role on project recebot-ptav.'
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

app.post('/api/appointment-book', (req, res) => {
  try {
    const body = req.body || {};
    const formId = String(body.formId || body.form_id || 'appointment').trim();
    const date = String(body.date || body.appointmentdate || '').trim();
    const time = String(body.time || body.appointmenttime || '').trim();
    const sid = String(body.sessionId || body.session_id || '').trim();
    const isEsTest = esTestMode.isEsTestRequest(req, sid);
    const result = formApi.bookAppointmentSlot(formId, date, time, { dryRun: isEsTest });
    if (!result.ok) {
      return res.status(409).json(result);
    }
    if (isEsTest) {
      return res.json({
        ...result,
        esTestMode: true,
        simulated: true,
        message: 'QA test mode: appointment validated but not booked.',
      });
    }
    if (sid) {
      const meta = conversationSheet.metaFromClientBody({
        form_id: formId,
        appointmentdate: date,
        appointmenttime: result.time || time,
        appointmentDateDisplay: result.appointmentDate || date,
        appointmentTimeDisplay: result.time || time,
        name: body.name,
        mobile: body.mobile,
        email: body.email,
      });
      if (Object.keys(meta).length) {
        chatTranscript.mergeSessionMeta(sid, {
          ...meta,
          appointmentStatus: 'pending',
        });
      }
      appointmentStatus.upsertPendingOnBook({
        sessionId: sid,
        formId,
        appointmentDate: result.appointmentDate || date,
        appointmentTime: result.time || time,
        name: body.name,
        mobile: body.mobile,
        email: body.email,
        slotBooked: true,
      });
      conversationSheet.scheduleSheetSync(sid);
    }
    res.json(result);
  } catch (err) {
    console.error('[appointment-book]', err.message);
    res.status(500).json({ ok: false, error: err.message || 'book_failed' });
  }
});

function requireDeskAuth(req, res, next) {
  if (liveAgent.verifyDeskToken(req).ok) return next();
  res.status(401).json({ ok: false, ...liveAgent.deskAuthFailed() });
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
  if (esTestMode.isEsTestRequest(req, sid)) {
    return res.json({ ok: true, esTestMode: true, sessionId: sid, merged: 0, skipped: true });
  }
  const meta = conversationSheet.metaFromClientBody(req.body || {});
  const ip = formApi.getClientIp(req);
  if (ip) meta.ip = ip;
  if (!meta.botId && !meta.sitePreset) {
    meta.botId = DEFAULT_RECEPTIONIST_BOT_ID;
    meta.sitePreset = DEFAULT_RECEPTIONIST_SITE_PRESET;
  }
  if (Object.keys(meta).length) {
    chatTranscript.mergeSessionMeta(sid, meta);
  }
  res.json({ ok: true, sessionId: sid, merged: Object.keys(meta).length });
});

function queueUploadSheetSync(sessionId) {
  const sid = String(sessionId || '').trim();
  if (!sid) return;
  conversationSheet
    .syncSessionToSheet(sid)
    .then((result) => {
      if (result && result.skipped) conversationSheet.scheduleSheetSync(sid);
    })
    .catch((err) => {
      console.warn('[upload/documents] sheet sync:', err.message);
      conversationSheet.scheduleSheetSync(sid);
    });
}

app.get('/api/upload/status', (_req, res) => {
  res.json({
    ok: true,
    gcsConfigured: gcsUpload.isConfigured(),
    gcsBucket: gcsUpload.BUCKET_NAME || null,
    gcsUploadPrefix: gcsUpload.UPLOAD_PREFIX || 'uploads',
    sheetsConfigured: sheets.isConfigured(),
  });
});

app.post(
  '/api/upload/documents',
  (req, res, next) => {
    uploadDocumentsMw.array('files', 10)(req, res, (err) => {
      if (!err) return next();
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          ok: false,
          error: 'file_too_large',
          message: 'File is too large (max 25 MB per file).',
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          ok: false,
          error: 'too_many_files',
          message: 'Too many files (max 10 per upload).',
        });
      }
      return res.status(400).json({
        ok: false,
        error: 'upload_parse_failed',
        message: err.message || 'Could not read uploaded file(s).',
      });
    });
  },
  async (req, res) => {
    const sessionId = String(req.body.sessionId || '').trim();
    if (esTestMode.isEsTestRequest(req, sessionId)) {
      return res.json({
        ok: true,
        esTestMode: true,
        simulated: true,
        sessionId,
        message: 'QA test mode: files were not uploaded or saved.',
      });
    }
    if (!gcsUpload.isConfigured()) {
      return res.status(503).json({
        error: 'gcs_not_configured',
        message:
          'Set GCS_BUCKET_NAME and GOOGLE_CREDENTIALS_JSON on Railway.',
      });
    }
    if (!sessionId) {
      return res.status(400).json({ error: 'session_required' });
    }
    let files = req.files || [];
    if (!files.length) {
      return res.status(400).json({ error: 'files_required' });
    }
    files = chatTranscript.filterDuplicateUploadFilesForSession(sessionId, files);
    if (!files.length) {
      let priorMeta = {};
      try {
        const doc = chatTranscript.getSessionDoc(sessionId);
        priorMeta = (doc && doc.meta) || {};
      } catch {
        /* ignore */
      }
      queueUploadSheetSync(sessionId);
      return res.json({
        ok: true,
        sessionId,
        duplicate_skipped: true,
        storage_folder: priorMeta.storage_folder || '',
        document_names:
          priorMeta.document_names ||
          priorMeta.document ||
          '',
        message: 'Files already uploaded for this session.',
        sheetSync: { queued: true },
      });
    }
    try {
      const uploadTag = String(req.body.tag || req.body.upload_tag || '').trim();
      const channel = String(req.body.channel || req.body.source || 'Web').trim();
      const pack = await gcsUpload.uploadSubmissionFilesToGcs(files, {
        mobile: req.body.mobile,
        dialCode: req.body.dial_code || req.body.dialCode,
        clientSessionId: sessionId,
        name: req.body.name,
        email: req.body.email,
        tag: uploadTag,
        channel,
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
      if (channel) meta.channel = channel;
      meta.userEngaged = true;
      meta.last_upload_at = new Date().toISOString();
      const uploadLabel = pack.document_names || 'Document upload';
      chatTranscript.mergeSessionMeta(sessionId, meta, { scheduleSheet: false });
      chatTranscript.appendTurn(
        sessionId,
        'user',
        `📎 ${uploadLabel}`,
        undefined,
        { scheduleSheet: false }
      );
      queueUploadSheetSync(sessionId);
      res.json({
        ok: true,
        sessionId,
        storage_folder: pack.storage_folder,
        document_names: pack.document_names,
        document_link: pack.document_link,
        document_links: pack.document_links,
        uploads: pack.uploads,
        sheetSync: { queued: true },
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
  if (esTestMode.isEsTestRequest(req, sessionId)) {
    return res.json({ ok: true, esTestMode: true, skipped: true });
  }
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

function sendConversationsDashboardPage(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.sendFile(path.join(publicDir, 'conversations-sheet.html'));
}

app.get('/uc-conversations', (_req, res) => {
  sendConversationsDashboardPage(res);
});

app.get('/ua-conversations', (_req, res) => {
  sendConversationsDashboardPage(res);
});

app.get('/conversations-sheet', (_req, res) => {
  res.redirect(301, '/uc-conversations');
});

app.get('/conversations.html', (_req, res) => {
  res.redirect(301, '/uc-conversations');
});

/** Dashboard bot-scoped URLs: /bid=10001/uc-conversations or /bid/10001/uc-conversations */
function handleDashboardBidRoute(req, res) {
  const m = req.path.match(/^\/bid[=/](\d{5})\/(.+)$/);
  if (!m) {
    return res.status(404).send('Not found');
  }
  const bid = m[1];
  const slug = decodeURIComponent(m[2]).replace(/\/$/, '');
  if (!dashboardBots.resolveBid(bid)) {
    return res.status(404).send('Unknown bot ID');
  }
  const target = dashboardBots.resolvePageTarget(slug, bid);
  if (!target || !target.redirect) {
    return res.status(404).send('Unknown dashboard page');
  }
  res.redirect(302, target.redirect);
}

app.get(/^\/bid=(\d{5})\/.+$/, handleDashboardBidRoute);
app.get(/^\/bid\/(\d{5})\/.+$/, handleDashboardBidRoute);

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

function requireConversationsViewer(req, res, opts) {
  const options = opts || {};
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
  if (!options.allowWithoutSheet && !sheets.isConfigured()) {
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

app.options('/api/live-agent-sheet', (req, res) => {
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
    const bid =
      req.query && typeof req.query.bid === 'string' ? req.query.bid.trim() : '';
    const payload = await conversationsSheetView.fetchConversationSheetPreview({
      maxRows,
      offset,
      allInRange,
      includeStats,
      from: rawFrom,
      to: rawTo,
      botId: bid,
    });
    res.json({ ok: true, ...payload });
  } catch (err) {
    console.error('[conversations-sheet]', err.message);
    const msg = String(err.message || err);
    const status = msg.includes('Invalid date parameter') ? 400 : 500;
    res.status(status).json({ ok: false, error: msg.slice(0, 500) });
  }
});

app.get('/api/live-agent-sheet', async (req, res) => {
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
    const payload = await conversationsSheetView.fetchLiveAgentSheetPreview({
      maxRows,
      offset,
      allInRange,
      from: rawFrom,
      to: rawTo,
    });
    res.json({ ok: true, ...payload });
  } catch (err) {
    console.error('[live-agent-sheet-view]', err.message);
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
    const bid = typeof q.bid === 'string' ? q.bid.trim() : '';
    const statsOpts = { botId: bid };
    if (from || to) {
      statsOpts.from = from || undefined;
      statsOpts.to = to || undefined;
    }
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

app.get('/api/appointments', async (req, res) => {
  setConversationsSheetCors(req, res);
  res.setHeader('Cache-Control', 'no-store');
  if (!requireConversationsViewer(req, res, { allowWithoutSheet: true })) return;
  try {
    const rawFrom =
      req.query && typeof req.query.from === 'string' ? req.query.from.trim() : '';
    const rawTo =
      req.query && typeof req.query.to === 'string' ? req.query.to.trim() : '';
    const rawStatus =
      req.query && typeof req.query.status === 'string' ? req.query.status.trim() : '';
    const payload = await appointmentsView.fetchAppointmentsList({
      from: rawFrom,
      to: rawTo,
      status: rawStatus,
    });
    res.json(payload);
  } catch (err) {
    console.error('[appointments]', err.message);
    res.status(500).json({ ok: false, error: err.message || 'appointments_failed' });
  }
});

app.post('/api/appointments/action', (req, res) => {
  setConversationsSheetCors(req, res);
  res.setHeader('Cache-Control', 'no-store');
  if (!requireConversationsViewer(req, res, { allowWithoutSheet: true })) return;
  try {
    const body = req.body || {};
    const sessionId = String(body.sessionId || body.session_id || '').trim();
    const action = String(body.action || '').trim().toLowerCase();
    if (!sessionId) {
      return res.status(400).json({ ok: false, error: 'sessionId required' });
    }
    const prev = appointmentStatus.getStatus(sessionId);
    const formId = String(body.formId || body.form_id || 'appointment').trim();
    const dateRaw = body.appointmentDate || body.appointmentdate || '';
    const timeRaw = body.appointmentTime || body.appointmenttime || '';

    if (action === 'accept') {
      if (!prev || !prev.slotBooked) {
        const bookResult = formApi.bookAppointmentSlot(formId, dateRaw, timeRaw);
        if (!bookResult.ok) {
          return res.status(409).json({
            ok: false,
            error: bookResult.error || 'slot_unavailable',
            message:
              bookResult.error === 'slot_unavailable'
                ? 'That time slot is no longer available.'
                : 'Could not confirm this appointment slot.',
          });
        }
        appointmentStatus.markSlotBooked(sessionId);
      }
    }

    const updated = appointmentStatus.applyAction({
      sessionId,
      action,
      formId,
      appointmentDate: dateRaw,
      appointmentTime: timeRaw,
      name: body.name,
      mobile: body.mobile,
      email: body.email,
      updatedBy: body.updatedBy || body.agentEmail,
      note: body.note,
    });

    const dateDisplay = require('./lib/date-display');
    const apptDmy = dateDisplay.formatDateDisplay(dateRaw);
    const apptTimeDisplay = String(
      updated.appointmentTime || timeRaw || ''
    ).trim();

    if (action === 'accept') {
      chatTranscript.mergeSessionMeta(sessionId, {
        appointmentBooked: 'yes',
        appointmentStatus: 'accepted',
        appointmentdate: apptDmy,
        appointmenttime: apptTimeDisplay,
        appointmentDateDisplay: apptDmy,
        appointmentTimeDisplay: apptTimeDisplay,
        name: body.name,
        mobile: body.mobile,
        email: body.email,
      });
      conversationSheet.scheduleSheetSync(sessionId);
    } else if (action === 'decline') {
      formApi.releaseAppointmentSlot(formId, dateRaw, timeRaw);
      chatTranscript.mergeSessionMeta(sessionId, {
        appointmentBooked: 'no',
        appointmentStatus: 'declined',
      });
      conversationSheet.scheduleSheetSync(sessionId);
    }

    res.json({ ok: true, appointment: updated });
  } catch (err) {
    console.error('[appointments/action]', err.message);
    res.status(400).json({ ok: false, error: err.message || 'action_failed' });
  }
});

app.options('/api/appointments', (req, res) => {
  setConversationsSheetCors(req, res);
  res.status(204).end();
});

app.options('/api/appointments/action', (req, res) => {
  setConversationsSheetCors(req, res);
  res.status(204).end();
});

app.get('/api/conversations-sheet-export', async (req, res) => {
  setConversationsSheetCors(req, res);
  res.setHeader('Cache-Control', 'no-store');
  if (!requireConversationsViewer(req, res)) return;
  try {
    const q = req.query || {};
    const from = typeof q.from === 'string' ? q.from.trim() : '';
    const to = typeof q.to === 'string' ? q.to.trim() : '';
    const bid = typeof q.bid === 'string' ? q.bid.trim() : '';
    const exportOpts = { botId: bid };
    if (from || to) {
      exportOpts.from = from || undefined;
      exportOpts.to = to || undefined;
    }
    const payload = await conversationsSheetView.fetchConversationSheetExport(exportOpts);
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
  try {
    const liveAgentSheet = require('./lib/live-agent-sheet');
    const rawFrom =
      req.query && typeof req.query.from === 'string' ? req.query.from.trim() : '';
    const rawTo =
      req.query && typeof req.query.to === 'string' ? req.query.to.trim() : '';
    const result = await liveAgentSheet.syncDashboardToSheet2({
      from: rawFrom || undefined,
      to: rawTo || undefined,
    });
    if (!result.ok) {
      const status = result.error === 'not_configured' ? 503 : 500;
      return res.status(status).json(result);
    }
    res.json(result);
  } catch (err) {
    console.error('[conversations-sheet-sync-dashboard]', err.message);
    const msg = String(err.message || err);
    const status = msg.includes('Invalid') ? 400 : 500;
    res.status(status).json({ ok: false, error: msg.slice(0, 500) });
  }
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

app.get('/api/analytics/queries', requireDeskAuth, (req, res) => {
  try {
    res.json(
      queryAnalytics.getQueryAnalytics({
        days: req.query.days,
        from: req.query.from,
        to: req.query.to,
        limit: req.query.limit,
        answeredPage: req.query.answeredPage,
        unansweredPage: req.query.unansweredPage,
      })
    );
  } catch (err) {
    console.error('[analytics/queries]', err.message);
    res.status(500).json({ ok: false, error: err.message || 'query_analytics_failed' });
  }
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

app.post('/api/documents/delete', requireDeskAuth, async (req, res) => {
  try {
    const gcsObject = String(
      (req.body && req.body.object) || req.query.object || ''
    ).trim();
    const result = await documentsCatalog.deleteDocumentObject(gcsObject);
    if (!result.ok) {
      const status =
        result.error === 'gcs_not_configured'
          ? 503
          : result.error === 'external_object' || result.error === 'invalid_object'
            ? 400
            : 400;
      return res.status(status).json(result);
    }
    res.json(result);
  } catch (err) {
    console.error('[documents/delete]', err.message);
    res.status(500).json({
      ok: false,
      error: 'delete_failed',
      message: err.message,
    });
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

/** Bot settings — Bot ID 10001 / 10002 / 10003 */
app.get('/api/site-presets/public', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.json({ sitePresets: sitePresetsStore.getPublicOverrides() });
});

app.get('/api/dashboard/bots', (_req, res) => {
  res.json({
    defaultBid: dashboardBots.defaultBid(),
    bots: dashboardBots.listBots(),
  });
});

app.get('/api/dashboard/nav', (req, res) => {
  const bid = req.query.bid || dashboardBots.defaultBid();
  res.json(dashboardBots.navSections(bid));
});

app.get('/api/bot-settings', (_req, res) => {
  res.json({ projects: sitePresetsStore.listProjects() });
});

app.get('/api/bot-settings/:botId', (req, res) => {
  const data = sitePresetsStore.getProjectPreset(req.params.botId);
  if (!data) {
    return res.status(404).json({ ok: false, error: 'Unknown bot ID' });
  }
  res.json({ ok: true, project: data.project, preset: data.preset });
});

app.post('/api/bot-settings/:botId', requireDeskAuth, (req, res) => {
  const result = sitePresetsStore.saveProjectPreset(
    req.params.botId,
    req.body && req.body.preset
  );
  if (!result.ok) {
    return res.status(result.error === 'Unknown bot ID' ? 404 : 400).json(result);
  }
  res.json(result);
});

app.get('/api/bot-registry', (_req, res) => {
  res.json({ ok: true, bots: sitePresetsStore.listProjects() });
});

app.post('/api/bot-registry', requireDeskAuth, (req, res) => {
  const body = req.body || {};
  const result = sitePresetsStore.addProject({
    id: body.id,
    name: body.name,
    welcomeEventName: body.welcomeEventName,
    sheetTab: body.sheetTab,
  });
  if (!result.ok) {
    return res.status(400).json(result);
  }
  res.status(201).json(result);
});

app.patch('/api/bot-registry/:botId', requireDeskAuth, (req, res) => {
  const body = req.body || {};
  const result = sitePresetsStore.updateProjectSettings(req.params.botId, {
    sheetTab: body.sheetTab,
    welcomeEventName: body.welcomeEventName,
  });
  if (!result.ok) {
    const status = result.error === 'Bot not found' ? 404 : 400;
    return res.status(status).json(result);
  }
  res.json(result);
});

app.delete('/api/bot-registry/:botId', requireDeskAuth, (req, res) => {
  const result = sitePresetsStore.deleteProject(req.params.botId);
  if (!result.ok) {
    const status = result.error === 'Bot not found' ? 404 : 400;
    return res.status(status).json(result);
  }
  res.json(result);
});

Object.entries(sitePresetsStore.LEGACY_BOT_IDS).forEach(([legacyId, botId]) => {
  app.get(`/bot-settings/${legacyId}.html`, (_req, res) => {
    res.redirect(301, `/bot-settings/${botId}.html`);
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
    gcsUploadPrefix: gcsUpload.UPLOAD_PREFIX || 'uploads',
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
  if (req.path === '/es-test' || req.path.startsWith('/es-test/')) return next();
  res.sendFile(path.join(publicDir, 'index.html'));
});

async function startServer() {
  try {
    await dataFileSync.pullAllOnStartup();
  } catch (err) {
    console.warn('[data-sync] startup pull:', err.message);
  }

  app.listen(PORT, () => {
  const local = `http://localhost:${PORT}`;
  console.log(`ES Chatbot → ${PUBLIC_BASE_URL}`);
  console.log(`Local: ${local}`);
  if (dataFileSync.useGcs() || dataFileSync.useGithub()) {
    console.log('[data-sync] auto-sync enabled (GCS/GitHub)');
  }
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
    const agentTab = botSheetTabs.agentTabName();
    const botTabs = sitePresetsStore
      .listProjects()
      .map((b) => botSheetTabs.resolveConversationTabForBot(b))
      .filter(Boolean);
    const tabsToEnsure = [agentTab].concat(
      botTabs.filter((t) => t !== agentTab)
    );
    Promise.all(
      tabsToEnsure.map((tab) =>
        sheets.ensureTabExists(tab).then(() => {
          if (tab === agentTab) {
            return sheets.ensureHeaderRowOnTab(
              tab,
              liveAgentSheet.LIVE_AGENT_SHEET_HEADERS
            );
          }
          return sheets.ensureHeaderRowOnTab(tab, conversationSheet.SHEET_HEADERS);
        })
      )
    )
      .then(() => {
        console.log(
          '[sheets] per-bot tabs ready — agent:',
          agentTab,
          '| bots:',
          botTabs.join(', ')
        );
      })
      .catch((err) =>
        console.warn('[sheets] tab bootstrap:', err.message)
      );
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
      '[gcs] disabled — set GCS_BUCKET_NAME + GOOGLE_CREDENTIALS_JSON'
    );
  }
  dialogflow
    .probe()
    .then(() => console.log('Dialogflow probe OK'))
    .catch((err) =>
      console.error('Dialogflow probe failed:', dialogflow.formatApiError(err))
    );
});
}

startServer().catch((err) => {
  console.error('Server failed to start:', err.message);
  process.exit(1);
});
