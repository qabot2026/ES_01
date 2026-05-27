const path = require('path');
const fs = require('fs');
const dialogflow = require('@google-cloud/dialogflow').v2;

const PROJECT_ID = process.env.DIALOGFLOW_PROJECT_ID || 'qualityassistant-ygdm';
const CREDENTIALS_PATH =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  path.join(__dirname, '..', 'credentials.json');

let sessionsClient = null;
let initError = null;

function loadCredentials() {
  const jsonEnv = process.env.GOOGLE_CREDENTIALS_JSON;
  if (jsonEnv && jsonEnv.trim()) {
    return JSON.parse(jsonEnv);
  }
  if (fs.existsSync(CREDENTIALS_PATH)) {
    return { keyFilename: CREDENTIALS_PATH };
  }
  return null;
}

function getClient() {
  if (sessionsClient) return sessionsClient;
  if (initError) throw initError;
  try {
    const creds = loadCredentials();
    if (!creds) {
      initError = new Error(
        'Dialogflow credentials missing. Set GOOGLE_CREDENTIALS_JSON (Railway) or add credentials.json locally.'
      );
      throw initError;
    }
    sessionsClient = new dialogflow.SessionsClient(creds);
    return sessionsClient;
  } catch (err) {
    initError = err;
    throw err;
  }
}

async function detectIntent(sessionId, text, languageCode = 'en') {
  const client = getClient();
  const request = {
    session: client.projectAgentSessionPath(PROJECT_ID, sessionId),
    queryInput: {
      text: {
        text,
        languageCode,
      },
    },
  };
  const [response] = await client.detectIntent(request);
  const result = response.queryResult;
  const messages = (result.fulfillmentMessages || [])
    .map((m) => m.text?.text?.[0])
    .filter(Boolean);
  const reply = messages.join('\n') || result.fulfillmentText || 'No response.';
  return {
    reply,
    intent: result.intent?.displayName || null,
    languageCode: result.languageCode || languageCode,
  };
}

function isConfigured() {
  try {
    if (process.env.GOOGLE_CREDENTIALS_JSON?.trim()) return true;
    return fs.existsSync(CREDENTIALS_PATH);
  } catch {
    return false;
  }
}

module.exports = { detectIntent, isConfigured, PROJECT_ID };
