const express = require('express');
const path = require('path');
const { randomUUID } = require('crypto');
const dialogflow = require('./lib/dialogflow');

const app = express();
const PORT = process.env.PORT || 4567;
const publicDir = path.join(__dirname, 'public');

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
  });
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  if (path.extname(req.path)) return next();
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`QualityAssistant → http://localhost:${PORT}`);
  if (!dialogflow.isConfigured()) {
    console.warn('⚠ credentials.json missing — UI works; /api/chat needs Google service account key.');
  }
});
