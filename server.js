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
    let result = eventName
      ? await dialogflow.detectEvent(sid, eventName, languageCode)
      : await dialogflow.detectIntent(sid, message.trim(), languageCode);
    if (phraseTranslations.isEnabled()) {
      result = phraseTranslations.applyToResult(result, uiLang);
    }
    if (result.liveAgent) {
      liveAgent.requestHandoff(sid, {
        userLanguage: uiLang,
        previewMessage: message ? message.trim() : '',
      });
      chatTranscript.mergeSessionMeta(sid, {
        channel: 'Web',
        liveAgentRequested: true,
      });
    }

    const userText = eventName ? '' : message && message.trim();
    chatTranscript.logDialogflowExchange(sid, userText, result);

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

/** --- Live agent service desk --- */
app.post('/api/live-agent/request', (req, res) => {
  const { sessionId, userLanguage, previewMessage } = req.body || {};
  res.json(
    liveAgent.requestHandoff(sessionId, {
      userLanguage,
      previewMessage,
    })
  );
});

app.get('/api/live-agent/state', (req, res) => {
  res.json(liveAgent.getUserState(req.query.sessionId));
});

app.get('/api/live-agent/poll', (req, res) => {
  const sessionId = req.query.sessionId;
  const since = req.query.since;
  res.json(liveAgent.getMessagesSince(sessionId, since));
});

app.post('/api/live-agent/user-message', (req, res) => {
  const { sessionId, message } = req.body || {};
  res.json(liveAgent.postUserMessage(sessionId, message));
});

function requireDeskAuth(req, res, next) {
  if (liveAgent.verifyDeskToken(req)) return next();
  res.status(401).json(liveAgent.deskAuthFailed());
}

app.get('/api/live-agent/queue', requireDeskAuth, (_req, res) => {
  res.json({ ok: true, ...liveAgent.getQueue() });
});

app.get('/api/live-agent/session', requireDeskAuth, (req, res) => {
  res.json(liveAgent.getSessionDetail(req.query.sessionId));
});

app.post('/api/live-agent/claim', requireDeskAuth, (req, res) => {
  const { sessionId, agentId, agentName } = req.body || {};
  res.json(
    liveAgent.claimSession(sessionId, {
      agentId: agentId || 'agent',
      agentName: agentName || 'Agent',
    })
  );
});

app.post('/api/live-agent/agent-message', requireDeskAuth, (req, res) => {
  const { sessionId, message, agentId, agentName } = req.body || {};
  res.json(
    liveAgent.postAgentMessage(sessionId, message, {
      agentId,
      agentName,
    })
  );
});

app.post('/api/live-agent/end', requireDeskAuth, (req, res) => {
  const { sessionId, agentId, agentName, reason } = req.body || {};
  res.json(
    liveAgent.endSession(
      sessionId,
      { agentId, agentName },
      reason || 'Agent ended the chat.'
    )
  );
});

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
    const files = req.files || [];
    if (!files.length) {
      return res.status(400).json({ error: 'files_required' });
    }
    try {
      const pack = await gcsUpload.uploadSubmissionFilesToGcs(files, {
        mobile: req.body.mobile,
        dialCode: req.body.dial_code || req.body.dialCode,
        clientSessionId: sessionId,
      });
      const meta = {
        document: pack.storage_folder,
        storage_folder: pack.storage_folder,
        storage_path: pack.storage_path,
        document_link: pack.document_link,
        document_links: pack.document_links,
      };
      chatTranscript.mergeSessionMeta(sessionId, meta);
      conversationSheet.scheduleSheetSync(sessionId);
      res.json({
        ok: true,
        sessionId,
        storage_folder: pack.storage_folder,
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
  const { sessionId, role, text, turns } = req.body || {};
  if (Array.isArray(turns) && turns.length) {
    return res.json({
      ok: true,
      added: chatTranscript.appendTurns(sessionId, turns),
    });
  }
  const turn = chatTranscript.appendTurn(sessionId, role, text);
  res.json({ ok: !!turn, turn });
});

app.get('/api/transcript', requireDeskAuth, (req, res) => {
  res.json(chatTranscript.getTranscript(req.query.sessionId));
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
