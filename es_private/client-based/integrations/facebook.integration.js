/**
 * ============================================================================
 * FACEBOOK MESSENGER INTEGRATION — YAHAN EDIT KARO
 * ============================================================================
 * Session ID prefix: fb-  (example: fb-1234567890123456)
 *
 * Railway Variables:
 *   META_VERIFY_TOKEN, META_APP_SECRET
 *   FB_PAGE_ACCESS_TOKEN
 *
 * Meta App → Webhook: Page messaging subscribe karo
 * Webhook URL: https://YOUR_DOMAIN/webhooks/meta
 * ============================================================================
 */

const channelSessions = require('../../lib/channels/channel-sessions');
const channelChat = require('../../lib/channels/channel-chat');
const meta = require('../../lib/channels/meta-shared');

const enabled = true;

const sessionPrefix = 'fb-';
const channelName = 'Facebook';
const webhookObject = 'page';
const defaultLanguage = 'en';

const waitingForAgentMessage = 'Please wait — a team member will join shortly.';

function isConfigured() {
  return meta.isMessengerConfigured();
}

function mergeSessionMeta(sessionId, psid) {
  try {
    const chatTranscript = require('../../lib/chat-transcript');
    chatTranscript.mergeSessionMeta(sessionId, {
      channel: channelName,
      facebookPsid: psid,
    });
  } catch {
    /* ignore */
  }
}

function extractMessages(body) {
  const out = [];
  const entries = Array.isArray(body && body.entry) ? body.entry : [];
  for (const entry of entries) {
    const messaging = Array.isArray(entry.messaging) ? entry.messaging : [];
    for (const ev of messaging) {
      const msg = ev.message;
      if (!msg || msg.is_echo) continue;
      const text = msg.text || (msg.quick_reply && msg.quick_reply.payload);
      if (!text || !String(text).trim()) continue;
      const sender = ev.sender && ev.sender.id;
      if (!sender) continue;
      out.push({ from: sender, text: String(text).trim(), messageId: msg.mid });
    }
  }
  return out;
}

async function handleInboundMessage(psid, text) {
  const id = String(psid || '').trim();
  const body = String(text || '').trim();
  if (!id || !body) return null;

  const sessionId = channelSessions.sessionIdFor('fb', id);
  mergeSessionMeta(sessionId, id);

  let result;
  try {
    result = await channelChat.processChatTurn({
      sessionId,
      message: body,
      languageCode: defaultLanguage,
      channel: 'facebook',
    });
  } catch (err) {
    console.error('[facebook.integration]', err.message);
    return null;
  }

  const reply =
    result.outboundText ||
    (result.waitingForAgent ? waitingForAgentMessage : '');

  if (reply) {
    await sendOutboundReply(id, reply);
  }
  return { sessionId, reply };
}

async function sendOutboundReply(recipientId, text) {
  if (!isConfigured()) return null;
  return meta.sendMessengerText(recipientId, text);
}

async function processWebhookPayload(body) {
  if (!enabled) return { handled: false, count: 0, disabled: true };
  if (!body || body.object !== webhookObject) {
    return { handled: false, count: 0 };
  }
  const messages = extractMessages(body);
  for (const m of messages) {
    await handleInboundMessage(m.from, m.text);
  }
  return { handled: true, count: messages.length };
}

module.exports = {
  enabled,
  sessionPrefix,
  channelName,
  webhookObject,
  isConfigured,
  extractMessages,
  handleInboundMessage,
  sendOutboundReply,
  processWebhookPayload,
};
