const path = require('path');
const fs = require('fs');
const dialogflow = require('@google-cloud/dialogflow').v2;
const { parseFulfillmentMessages } = require('./rich-content');

const PROJECT_ID = process.env.DIALOGFLOW_PROJECT_ID || 'qualityassistant-ygdm';
const CREDENTIALS_PATH =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  path.join(__dirname, '..', 'credentials.json');

let sessionsClient = null;
let initError = null;
let credentialsMeta = null;

function parseServiceAccountJson(raw) {
  let text = raw.trim();
  if (!text) throw new Error('GOOGLE_CREDENTIALS_JSON is empty');

  if (text.startsWith('"') && text.endsWith('"')) {
    try {
      text = JSON.parse(text);
    } catch {
      /* use original */
    }
  }

  try {
    return JSON.parse(text);
  } catch (firstErr) {
    try {
      return JSON.parse(text.replace(/\r?\n/g, '\\n'));
    } catch {
      throw new Error(
        `Invalid GOOGLE_CREDENTIALS_JSON on server: ${firstErr.message}. ` +
          'Paste the full service-account JSON as one line in Railway Variables.'
      );
    }
  }
}

function loadCredentials() {
  const base64 = process.env.GOOGLE_CREDENTIALS_JSON_BASE64;
  if (base64 && base64.trim()) {
    const decoded = Buffer.from(base64.trim(), 'base64').toString('utf8');
    const parsed = parseServiceAccountJson(decoded);
    credentialsMeta = {
      clientEmail: parsed.client_email,
      projectId: parsed.project_id,
    };
    return { credentials: parsed };
  }

  const jsonEnv = process.env.GOOGLE_CREDENTIALS_JSON;
  if (jsonEnv && jsonEnv.trim()) {
    const parsed = parseServiceAccountJson(jsonEnv);
    credentialsMeta = {
      clientEmail: parsed.client_email,
      projectId: parsed.project_id,
    };
    if (parsed.project_id && parsed.project_id !== PROJECT_ID) {
      console.warn(
        `[dialogflow] Credential project_id (${parsed.project_id}) differs from DIALOGFLOW_PROJECT_ID (${PROJECT_ID})`
      );
    }
    return { credentials: parsed };
  }

  if (fs.existsSync(CREDENTIALS_PATH)) {
    const parsed = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    credentialsMeta = {
      clientEmail: parsed.client_email,
      projectId: parsed.project_id,
    };
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
        'Dialogflow credentials missing. Set GOOGLE_CREDENTIALS_JSON in Railway Variables.'
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

function formatApiError(err) {
  const parts = [err.message];
  if (err.code) parts.unshift(String(err.code));
  if (Array.isArray(err.details) && err.details[0]) {
    parts.push(String(err.details[0]));
  }
  return parts.filter(Boolean).join(' — ');
}

function parseQueryResult(response, languageCode = 'en') {
  const result = response.queryResult;
  const { textParts, replyParts, chips, chipHeading, infoCards, downloads } =
    parseFulfillmentMessages(result.fulfillmentMessages);
  let reply = textParts.join('\n').trim();
  const hasReplyParts = replyParts.length > 0;
  const hasRich =
    chips.length > 0 ||
    infoCards.length > 0 ||
    downloads.length > 0 ||
    !!chipHeading ||
    hasReplyParts;
  if (!reply && hasReplyParts) {
    reply = replyParts.map((p) => p.text).join('');
  }
  /* Avoid fulfillmentText when structured messages exist — it often merges text + list title */
  if (!reply && !hasRich) {
    reply = (result.fulfillmentText || '').trim();
  }
  if (!reply && !hasRich) {
    reply = 'No response.';
  }
  return {
    reply,
    replyParts,
    chips,
    chipHeading: chipHeading || '',
    infoCards,
    downloads,
    intent: result.intent?.displayName || null,
    languageCode: result.languageCode || languageCode,
  };
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
  return parseQueryResult(response, languageCode);
}

/** Dialogflow ES custom/welcome event (e.g. FRESH, WELCOME). */
async function detectEvent(sessionId, eventName, languageCode = 'en') {
  const client = getClient();
  const name = (eventName || '').trim();
  if (!name) {
    throw new Error('event name is required');
  }
  const request = {
    session: client.projectAgentSessionPath(PROJECT_ID, sessionId),
    queryInput: {
      event: {
        name,
        languageCode,
      },
    },
  };
  const [response] = await client.detectIntent(request);
  return parseQueryResult(response, languageCode);
}

async function probe() {
  const id = 'health-probe-' + Date.now();
  await detectIntent(id, 'hi', 'en');
  return { ok: true, projectId: PROJECT_ID };
}

function isConfigured() {
  try {
    if (process.env.GOOGLE_CREDENTIALS_JSON_BASE64?.trim()) return true;
    if (process.env.GOOGLE_CREDENTIALS_JSON?.trim()) return true;
    return fs.existsSync(CREDENTIALS_PATH);
  } catch {
    return false;
  }
}

function getCredentialsMeta() {
  if (!credentialsMeta) {
    try {
      loadCredentials();
    } catch {
      return null;
    }
  }
  return credentialsMeta;
}

module.exports = {
  detectIntent,
  detectEvent,
  probe,
  isConfigured,
  formatApiError,
  getCredentialsMeta,
  PROJECT_ID,
};
