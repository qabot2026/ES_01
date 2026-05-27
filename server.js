const express = require('express');
const path = require('path');
const { randomUUID } = require('crypto');
const dialogflow = require('./lib/dialogflow');

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
app.use(express.static(publicDir, {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  etag: true,
}));

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'quality-assistant-chatbot',
    dialogflow: dialogflow.isConfigured() ? 'ready' : 'credentials_missing',
    projectId: dialogflow.PROJECT_ID,
  });
});

app.post('/api/chat', async (req, res) => {
  const { message, sessionId, languageCode = 'en' } = req.body || {};
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'message is required' });
  }
  const sid = sessionId || randomUUID();
  try {
    const result = await dialogflow.detectIntent(
      sid,
      message.trim(),
      languageCode
    );
    res.json({ sessionId: sid, ...result });
  } catch (err) {
    console.error('[dialogflow]', err.message);
    const status = err.message?.includes('not found') ? 503 : 500;
    res.status(status).json({
      error: 'dialogflow_error',
      message: dialogflow.isConfigured()
        ? 'Could not reach Dialogflow. Check credentials and agent setup.'
        : 'Add credentials.json (service account) to enable chat API.',
    });
  }
});

app.get('/api/config', (_req, res) => {
  res.json({
    projectId: dialogflow.PROJECT_ID,
    agentId: '07ccbfd0-4cad-4898-8323-e6baeec80fc1',
    title: 'QualityAssistant',
    subtitle: 'Your quality & compliance guide',
    dialogflowReady: dialogflow.isConfigured(),
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
    console.warn('⚠ credentials.json missing — UI works; /api/chat needs Google service account key.');
  }
});
