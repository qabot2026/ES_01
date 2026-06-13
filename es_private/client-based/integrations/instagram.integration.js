/**
 * ============================================================================
 * INSTAGRAM DM INTEGRATION — YAHAN EDIT KARO
 * ============================================================================
 * Session ID prefix: ig-  (example: ig-17841400123456789)
 *
 * Railway Variables:
 *   META_VERIFY_TOKEN, META_APP_SECRET
 *   FB_PAGE_ACCESS_TOKEN  (Instagram same Page token use karta hai)
 *   INSTAGRAM_PAGE_ID     (optional)
 *
 * Meta App → Webhook: instagram messaging subscribe karo
 * Webhook URL: https://YOUR_DOMAIN/webhooks/meta
 * ============================================================================
 */

const channelSessions = require('../../lib/channels/channel-sessions');
const channelChat = require('../../lib/channels/channel-chat');
const meta = require('../../lib/channels/meta-shared');

const enabled = true;

const sessionPrefix = 'ig-';
const channelName = 'Instagram';
const webhookObject = 'instagram';
const defaultLanguage = 'en';

const waitingForAgentMessage = 'Please wait — a team member will join shortly.';

function isConfigured() {
  return meta.isMessengerConfigured();
}

function mergeSessionMeta(sessionId, igUserId) {
  try {
    const chatTranscript = require('../../lib/chat-transcript');
    chatTranscript.mergeSessionMeta(sessionId, {
      channel: channelName,
      instagramUserId: igUserId,
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

async function handleInboundMessage(igUserId, text) {
  const uid = String(igUserId || '').trim();
  const body = String(text || '').trim();
  if (!uid || !body) return null;

  const sessionId = channelSessions.sessionIdFor('ig', uid);
  mergeSessionMeta(sessionId, uid);

  let result;
  try {
    result = await channelChat.processChatTurn({
      sessionId,
      message: body,
      languageCode: defaultLanguage,
      channel: 'instagram',
    });
  } catch (err) {
    console.error('[instagram.integration]', err.message);
    return null;
  }

  const reply =
    result.outboundText ||
    (result.waitingForAgent ? waitingForAgentMessage : '');

  if (reply) {
    await sendOutboundReply(uid, reply);
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
