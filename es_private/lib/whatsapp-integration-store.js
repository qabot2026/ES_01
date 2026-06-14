/**
 * WhatsApp vendor settings — saved from Supersetting dashboard.
 * Runtime adapters (Meta, WATI, …) can read this file later.
 */

const fs = require('fs');
const clientPaths = require('./client-paths');
const dataFileSync = require('./data-file-sync');

const FILE_NAME = 'whatsapp-integration.json';

const PROVIDER_IDS = [
  'meta',
  'aisensy',
  'wati',
  'interakt',
  'gupshup',
  'dialog360',
  'twilio',
];

const PROVIDER_SCHEMAS = {
  meta: {
    id: 'meta',
    label: 'Meta Cloud API',
    webhookPath: '/webhooks/meta',
    docsUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api',
    fields: [
      {
        key: 'accessToken',
        label: 'Access token',
        placeholder: 'EAAxxxx…',
        secret: true,
        env: 'WHATSAPP_TOKEN',
        hint: 'Meta App → WhatsApp → API setup → temporary or permanent token.',
      },
      {
        key: 'phoneNumberId',
        label: 'Phone number ID',
        placeholder: '123456789012345',
        env: 'WHATSAPP_PHONE_NUMBER_ID',
        hint: 'WhatsApp Business Account → Phone numbers → Phone number ID.',
      },
      {
        key: 'appSecret',
        label: 'App secret',
        placeholder: 'Meta app secret',
        secret: true,
        env: 'WHATSAPP_APP_SECRET',
        hint: 'Meta App → Settings → Basic → App secret. Used for webhook signature.',
      },
      {
        key: 'verifyToken',
        label: 'Webhook verify token',
        placeholder: 'your-verify-string',
        env: 'WHATSAPP_VERIFY_TOKEN',
        hint: 'Any string you choose — same value in Meta webhook setup.',
      },
    ],
  },
  aisensy: {
    id: 'aisensy',
    label: 'AiSensy',
    webhookPath: '/webhooks/aisensy',
    docsUrl: 'https://docs.aisensy.com/',
    fields: [
      {
        key: 'apiKey',
        label: 'API key',
        placeholder: 'Partner / API key',
        secret: true,
        env: 'AISENSY_API_KEY',
        hint: 'AiSensy dashboard → API / Integrations.',
      },
      {
        key: 'projectId',
        label: 'Project / campaign ID',
        placeholder: 'Optional project identifier',
        env: 'AISENSY_PROJECT_ID',
        hint: 'If AiSensy gives a project or campaign ID for your WhatsApp number.',
      },
      {
        key: 'webhookSecret',
        label: 'Webhook secret',
        placeholder: 'Optional signature secret',
        secret: true,
        env: 'AISENSY_WEBHOOK_SECRET',
        hint: 'For verifying inbound webhooks from AiSensy.',
      },
    ],
  },
  wati: {
    id: 'wati',
    label: 'WATI',
    webhookPath: '/webhooks/wati',
    docsUrl: 'https://docs.wati.io/',
    fields: [
      {
        key: 'apiBaseUrl',
        label: 'API base URL',
        placeholder: 'https://live-server-xxxx.wati.io/api/v1',
        env: 'WATI_API_BASE_URL',
        hint: 'WATI → More → API docs — copy your server base URL.',
      },
      {
        key: 'accessToken',
        label: 'Bearer token',
        placeholder: 'WATI API token',
        secret: true,
        env: 'WATI_ACCESS_TOKEN',
        hint: 'WATI → More → API docs → Bearer token.',
      },
      {
        key: 'webhookSecret',
        label: 'Webhook secret',
        placeholder: 'Optional',
        secret: true,
        env: 'WATI_WEBHOOK_SECRET',
        hint: 'If WATI lets you set a webhook signing secret.',
      },
    ],
  },
  interakt: {
    id: 'interakt',
    label: 'Interakt',
    webhookPath: '/webhooks/interakt',
    docsUrl: 'https://www.interakt.shop/resource-center/',
    fields: [
      {
        key: 'apiKey',
        label: 'API key',
        placeholder: 'Interakt API key',
        secret: true,
        env: 'INTERAKT_API_KEY',
        hint: 'Interakt → Settings → Developer settings → API key.',
      },
      {
        key: 'webhookSecret',
        label: 'Webhook secret',
        placeholder: 'Webhook signing secret',
        secret: true,
        env: 'INTERAKT_WEBHOOK_SECRET',
        hint: 'Used to verify callbacks from Interakt.',
      },
    ],
  },
  gupshup: {
    id: 'gupshup',
    label: 'Gupshup',
    webhookPath: '/webhooks/gupshup',
    docsUrl: 'https://docs.gupshup.io/',
    fields: [
      {
        key: 'apiKey',
        label: 'API key',
        placeholder: 'Gupshup API key',
        secret: true,
        env: 'GUPSHUP_API_KEY',
        hint: 'Gupshup dashboard → API keys.',
      },
      {
        key: 'appName',
        label: 'App name',
        placeholder: 'Your Gupshup app name',
        env: 'GUPSHUP_APP_NAME',
        hint: 'App name used in send message API (src.name).',
      },
      {
        key: 'sourceNumber',
        label: 'Source WhatsApp number',
        placeholder: '91XXXXXXXXXX',
        env: 'GUPSHUP_SOURCE_NUMBER',
        hint: 'Registered WhatsApp business number without + or spaces.',
      },
      {
        key: 'webhookSecret',
        label: 'Webhook secret',
        placeholder: 'Optional',
        secret: true,
        env: 'GUPSHUP_WEBHOOK_SECRET',
        hint: 'If Gupshup provides webhook verification.',
      },
    ],
  },
  dialog360: {
    id: 'dialog360',
    label: '360dialog',
    webhookPath: '/webhooks/360dialog',
    docsUrl: 'https://docs.360dialog.com/',
    fields: [
      {
        key: 'apiKey',
        label: 'D360 API key',
        placeholder: 'D360-API-KEY',
        secret: true,
        env: 'DIALOG360_API_KEY',
        hint: '360dialog Hub → API keys → D360-API-KEY header value.',
      },
      {
        key: 'phoneNumberId',
        label: 'Phone number ID',
        placeholder: 'Optional WABA phone ID',
        env: 'DIALOG360_PHONE_NUMBER_ID',
        hint: 'If 360dialog assigns a phone number ID separate from Meta.',
      },
      {
        key: 'webhookSecret',
        label: 'Webhook secret',
        placeholder: 'Optional',
        secret: true,
        env: 'DIALOG360_WEBHOOK_SECRET',
        hint: 'For inbound webhook signature verification.',
      },
    ],
  },
  twilio: {
    id: 'twilio',
    label: 'Twilio',
    webhookPath: '/webhooks/twilio',
    docsUrl: 'https://www.twilio.com/docs/whatsapp',
    fields: [
      {
        key: 'accountSid',
        label: 'Account SID',
        placeholder: 'ACxxxxxxxx',
        env: 'TWILIO_ACCOUNT_SID',
        hint: 'Twilio Console → Account Info → Account SID.',
      },
      {
        key: 'authToken',
        label: 'Auth token',
        placeholder: 'Twilio auth token',
        secret: true,
        env: 'TWILIO_AUTH_TOKEN',
        hint: 'Twilio Console → Account Info → Auth token.',
      },
      {
        key: 'whatsappFrom',
        label: 'WhatsApp sender number',
        placeholder: 'whatsapp:+14155238886',
        env: 'TWILIO_WHATSAPP_FROM',
        hint: 'Your Twilio WhatsApp-enabled sender in whatsapp:+E164 format.',
      },
      {
        key: 'messagingServiceSid',
        label: 'Messaging service SID',
        placeholder: 'MGxxxxxxxx (optional)',
        env: 'TWILIO_MESSAGING_SERVICE_SID',
        hint: 'Optional — if you use a Twilio Messaging Service for WhatsApp.',
      },
    ],
  },
};

const BOT_FIELD_SCHEMA = [
  {
    key: 'welcomeEventName',
    label: 'Welcome event name',
    placeholder: 'START_GREEN_VALLEY',
    hint: 'Dialogflow event on Hi/Hello. Empty = no welcome event.',
  },
  {
    key: 'sitePreset',
    label: 'Site preset',
    placeholder: 'greenValley',
    hint: 'Sheet / analytics preset: greenValley, receptionist, lakeView, …',
  },
  {
    key: 'botId',
    label: 'Bot ID',
    placeholder: '10002',
    hint: '5-digit bot ID from Registered bots table.',
  },
  {
    key: 'idleTimeoutMs',
    label: 'ENDCHAT idle (ms)',
    placeholder: '10000',
    hint: 'Milliseconds of inactivity before ENDCHAT goodbye. 0 = disabled.',
  },
];

function defaultProviderValues() {
  const out = {};
  for (const id of PROVIDER_IDS) {
    const schema = PROVIDER_SCHEMAS[id];
    const row = { notes: '' };
    for (const f of schema.fields) {
      row[f.key] = '';
    }
    out[id] = row;
  }
  return out;
}

function defaultBotConfig(botId) {
  const bid = String(botId || '').trim();
  let reg = null;
  try {
    const sitePresetsStore = require('./site-presets-store');
    reg =
      sitePresetsStore.listProjects().find((b) => b.id === bid) || null;
  } catch {
    /* ignore */
  }
  return {
    enabled: false,
    activeProvider: 'meta',
    providers: defaultProviderValues(),
    bot: {
      welcomeEventName: reg ? String(reg.welcomeEventName || '').trim() : '',
      sitePreset: reg ? String(reg.sitePreset || '').trim() : '',
      botId: bid,
      idleTimeoutMs: 10000,
    },
  };
}

function normalizeBotConfig(raw, botId) {
  const base = defaultBotConfig(botId);
  const cfg = raw && typeof raw === 'object' ? raw : {};
  const providers = defaultProviderValues();
  const incoming =
    cfg.providers && typeof cfg.providers === 'object' ? cfg.providers : {};
  for (const id of PROVIDER_IDS) {
    const row = incoming[id] && typeof incoming[id] === 'object' ? incoming[id] : {};
    providers[id] = Object.assign({}, providers[id], row);
  }
  const botIn = cfg.bot && typeof cfg.bot === 'object' ? cfg.bot : {};
  return {
    enabled: Boolean(cfg.enabled),
    activeProvider: PROVIDER_IDS.includes(cfg.activeProvider)
      ? cfg.activeProvider
      : base.activeProvider,
    providers,
    bot: Object.assign({}, base.bot, botIn, { botId: String(botId || '').trim() }),
  };
}

function isBotConfigured(cfg) {
  if (!cfg) return false;
  if (cfg.enabled) return true;
  const providers = cfg.providers && typeof cfg.providers === 'object' ? cfg.providers : {};
  for (const id of PROVIDER_IDS) {
    const row = providers[id];
    if (!row || typeof row !== 'object') continue;
    const schema = PROVIDER_SCHEMAS[id];
    for (const f of schema.fields) {
      if (String(row[f.key] || '').trim()) return true;
    }
    if (String(row.notes || '').trim()) return true;
  }
  return false;
}

function readFileDoc() {
  ensureDir();
  const fp = filePath();
  if (!fs.existsSync(fp)) {
    const seed = { updatedAt: new Date().toISOString(), bots: {} };
    fs.writeFileSync(fp, JSON.stringify(seed, null, 2), 'utf8');
    return seed;
  }
  try {
    const raw = JSON.parse(fs.readFileSync(fp, 'utf8'));
    if (raw && raw.bots && typeof raw.bots === 'object') {
      return {
        updatedAt: raw.updatedAt || new Date().toISOString(),
        bots: raw.bots,
      };
    }
    /** Legacy single-bot file → migrate under bot ID from saved bot.botId */
    if (raw && (raw.providers || raw.enabled != null)) {
      const legacyBotId = String((raw.bot && raw.bot.botId) || '10002').trim();
      return {
        updatedAt: raw.updatedAt || new Date().toISOString(),
        bots: {
          [legacyBotId]: normalizeBotConfig(raw, legacyBotId),
        },
      };
    }
    return { updatedAt: new Date().toISOString(), bots: {} };
  } catch (err) {
    console.warn('[whatsapp-integration] read failed:', err.message);
    return { updatedAt: new Date().toISOString(), bots: {} };
  }
}

function writeFileDoc(doc) {
  const next = {
    updatedAt: new Date().toISOString(),
    bots: doc && doc.bots && typeof doc.bots === 'object' ? doc.bots : {},
  };
  ensureDir();
  fs.writeFileSync(filePath(), JSON.stringify(next, null, 2), 'utf8');
  dataFileSync.scheduleSync(FILE_NAME);
  return next;
}

function readBotConfig(botId) {
  const bid = String(botId || '').trim();
  if (!bid) return defaultBotConfig('');
  const doc = readFileDoc();
  const stored = doc.bots[bid];
  if (!stored) return defaultBotConfig(bid);
  return normalizeBotConfig(stored, bid);
}

function validateBotId(botId) {
  const bid = String(botId || '').trim();
  if (!/^\d{5}$/.test(bid)) {
    return { ok: false, error: 'Invalid bot ID' };
  }
  try {
    const sitePresetsStore = require('./site-presets-store');
    const bot = sitePresetsStore.listProjects().find((b) => b.id === bid);
    if (!bot) return { ok: false, error: 'Bot not found' };
    return { ok: true, botId: bid, bot };
  } catch (err) {
    return { ok: false, error: err.message || 'Bot registry unavailable' };
  }
}

function saveBotConfig(botId, patch) {
  const check = validateBotId(botId);
  if (!check.ok) return check;

  const bid = check.botId;
  const doc = readFileDoc();
  const current = readBotConfig(bid);
  const next = normalizeBotConfig(current, bid);

  if (patch && typeof patch === 'object') {
    if (patch.enabled != null) next.enabled = Boolean(patch.enabled);
    if (patch.activeProvider && PROVIDER_IDS.includes(patch.activeProvider)) {
      next.activeProvider = patch.activeProvider;
    }
    if (patch.providers && typeof patch.providers === 'object') {
      for (const id of PROVIDER_IDS) {
        if (!patch.providers[id] || typeof patch.providers[id] !== 'object') continue;
        const schema = PROVIDER_SCHEMAS[id];
        const allowed = new Set(schema.fields.map((f) => f.key).concat(['notes']));
        for (const [key, val] of Object.entries(patch.providers[id])) {
          if (!allowed.has(key)) continue;
          next.providers[id][key] = val == null ? '' : String(val).trim();
        }
      }
    }
    if (patch.bot && typeof patch.bot === 'object') {
      for (const f of BOT_FIELD_SCHEMA) {
        if (f.key === 'botId') continue;
        if (patch.bot[f.key] == null) continue;
        if (f.key === 'idleTimeoutMs') {
          const n = parseInt(patch.bot.idleTimeoutMs, 10);
          next.bot.idleTimeoutMs = Number.isFinite(n) ? Math.max(0, n) : 0;
        } else {
          next.bot[f.key] = String(patch.bot[f.key]).trim();
        }
      }
    }
  }

  next.bot.botId = bid;
  doc.bots[bid] = next;
  writeFileDoc(doc);
  return { ok: true, config: next, botId: bid };
}

function getPublicView(botId, publicBaseUrl) {
  const check = validateBotId(botId);
  if (!check.ok) return check;

  const bid = check.botId;
  const cfg = readBotConfig(bid);
  const active = PROVIDER_SCHEMAS[cfg.activeProvider] || PROVIDER_SCHEMAS.meta;
  const base = String(publicBaseUrl || '').replace(/\/$/, '');
  const webhookPath = active.webhookPath || '/webhooks/meta';
  const webhookUrl = base
    ? `${base}${webhookPath}?bid=${encodeURIComponent(bid)}`
    : `${webhookPath}?bid=${encodeURIComponent(bid)}`;

  return {
    ok: true,
    botId: bid,
    botName: check.bot.name,
    configured: isBotConfigured(cfg),
    config: cfg,
    schema: {
      providerIds: PROVIDER_IDS,
      providers: PROVIDER_SCHEMAS,
      botFields: BOT_FIELD_SCHEMA.filter((f) => f.key !== 'botId'),
    },
    publicBaseUrl: publicBaseUrl || '',
    webhookUrl,
    webhookPath,
  };
}

/** @deprecated use readBotConfig */
function readConfig() {
  return readBotConfig('10002');
}

/** @deprecated use saveBotConfig */
function saveConfig(patch) {
  const bid = (patch && patch.bot && patch.bot.botId) || '10002';
  return saveBotConfig(bid, patch);
}

/** @deprecated */
function defaultConfig() {
  return defaultBotConfig('10002');
}

module.exports = {
  FILE_NAME,
  PROVIDER_IDS,
  PROVIDER_SCHEMAS,
  BOT_FIELD_SCHEMA,
  readBotConfig,
  saveBotConfig,
  getPublicView,
  validateBotId,
  isBotConfigured,
  readConfig,
  saveConfig,
  defaultBotConfig,
  defaultConfig,
};

function filePath() {
  return clientPaths.whatsappIntegrationSettingsPath();
}

function ensureDir() {
  const dir = clientPaths.dataDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
