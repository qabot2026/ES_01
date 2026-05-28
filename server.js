const express = require('express');
const path = require('path');
const { randomUUID } = require('crypto');
const dialogflow = require('./lib/dialogflow');
const translate = require('./lib/translate');
const phraseTranslations = require('./lib/phrase-translations');

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
    publicBaseUrl: PUBLIC_BASE_URL,
    embedScript: `${PUBLIC_BASE_URL}/embed.js`,
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
  dialogflow
    .probe()
    .then(() => console.log('Dialogflow probe OK'))
    .catch((err) =>
      console.error('Dialogflow probe failed:', dialogflow.formatApiError(err))
    );
});
