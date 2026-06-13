/**
 * Shared Meta Graph API helpers (WhatsApp Cloud API + Messenger / Instagram).
 */

const crypto = require('crypto');
const appEnv = require('../app-env');

const GRAPH_VERSION = 'v21.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

function metaConfig() {
  return {
    appSecret: appEnv.META_APP_SECRET,
    verifyToken: appEnv.META_VERIFY_TOKEN,
    whatsappToken: appEnv.WHATSAPP_ACCESS_TOKEN,
    whatsappPhoneNumberId: appEnv.WHATSAPP_PHONE_NUMBER_ID,
    pageAccessToken: appEnv.FB_PAGE_ACCESS_TOKEN,
    instagramPageId: appEnv.INSTAGRAM_PAGE_ID,
  };
}

function isWhatsAppConfigured() {
  const c = metaConfig();
  return Boolean(c.whatsappToken && c.whatsappPhoneNumberId);
}

function isMessengerConfigured() {
  return Boolean(metaConfig().pageAccessToken);
}

function verifyWebhookChallenge(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  const expected = metaConfig().verifyToken;

  if (mode === 'subscribe' && token && expected && token === expected) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
}

function verifySignature(req) {
  const secret = metaConfig().appSecret;
  if (!secret) return true;
  const sig = req.get('X-Hub-Signature-256') || '';
  const raw = req.rawBody;
  if (!sig || !raw || !Buffer.isBuffer(raw)) return false;
  const expected =
    'sha256=' +
    crypto.createHmac('sha256', secret).update(raw).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

async function graphPost(path, body, accessToken) {
  const token = accessToken || metaConfig().pageAccessToken;
  if (!token) throw new Error('Meta access token not configured');

  const res = await fetch(`${GRAPH_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (data.error && data.error.message) || res.statusText || 'Meta API error';
    throw new Error(msg);
  }
  return data;
}

async function sendWhatsAppPayload(to, payload) {
  const c = metaConfig();
  if (!isWhatsAppConfigured()) throw new Error('WhatsApp not configured');
  return graphPost(
    `/${c.whatsappPhoneNumberId}/messages`,
    {
      messaging_product: 'whatsapp',
      to: String(to).replace(/\D/g, ''),
      ...payload,
    },
    c.whatsappToken
  );
}

async function sendWhatsAppText(to, text) {
  const body = text == null ? '' : String(text).trim();
  if (!body) return null;
  return sendWhatsAppPayload(to, {
    type: 'text',
    text: { body: body.slice(0, 4096) },
  });
}

async function sendMessengerText(recipientId, text) {
  if (!isMessengerConfigured()) throw new Error('Messenger not configured');
  const body = text == null ? '' : String(text).trim();
  if (!body) return null;
  return graphPost('/me/messages', {
    recipient: { id: String(recipientId) },
    message: { text: body.slice(0, 2000) },
  });
}

module.exports = {
  metaConfig,
  isWhatsAppConfigured,
  isMessengerConfigured,
  verifyWebhookChallenge,
  verifySignature,
  sendWhatsAppText,
  sendWhatsAppPayload,
  sendMessengerText,
};
