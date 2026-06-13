/**
 * ============================================================================
 * WHATSAPP INTEGRATION — YAHAN EDIT KARO
 * ============================================================================
 * Session ID prefix: wa-  (example: wa-919876543210)
 *
 * Railway Variables (tumhare names OK):
 *   WHATSAPP_TOKEN
 *   WHATSAPP_APP_SECRET
 *   WHATSAPP_PHONE_NUMBER_ID
 *   WHATSAPP_VERIFY_TOKEN
 *
 * Meta App → Webhook URL:
 *   https://YOUR_DOMAIN/webhooks/meta
 *   (ya /webhooks/whatsapp)
 *
 * Neeche functions mein apna custom logic add kar sakte ho:
 *   - extractMessages  → webhook payload parse
 *   - handleInboundMessage → message aane par kya karna hai
 *   - sendOutboundReply → user ko reply kaise bhejna hai
 * ============================================================================
 */

const channelSessions = require('../../lib/channels/channel-sessions');
const channelChat = require('../../lib/channels/channel-chat');
const meta = require('../../lib/channels/meta-shared');

/** Integration on/off — false karo jab tak setup na ho */
const enabled = true;

const sessionPrefix = 'wa-';
const channelName = 'WhatsApp';
const webhookObject = 'whatsapp_business_account';
const defaultLanguage = 'en';

/** Live agent queue message jab bot handoff kare */
const waitingForAgentMessage = 'Please wait — a team member will join shortly.';

function isConfigured() {
  return meta.isWhatsAppConfigured();
}

function mergeSessionMeta(sessionId, phone) {
  try {
    const chatTranscript = require('../../lib/chat-transcript');
    chatTranscript.mergeSessionMeta(sessionId, {
      channel: channelName,
      whatsappPhone: phone,
    });
  } catch {
    /* ignore */
  }
}

/**
 * Meta webhook body se messages nikalo.
 * Custom formats ke liye yahan edit karo.
 */
function extractMessages(body) {
  const out = [];
  const entries = Array.isArray(body && body.entry) ? body.entry : [];
  for (const entry of entries) {
    const changes = Array.isArray(entry.changes) ? entry.changes : [];
    for (const change of changes) {
      const value = change.value || {};
      const messages = Array.isArray(value.messages) ? value.messages : [];
      for (const msg of messages) {
        if (msg.type !== 'text' || !msg.text || !msg.text.body) continue;
        out.push({
          from: msg.from,
          text: msg.text.body,
          messageId: msg.id,
          phoneNumberId: value.metadata && value.metadata.phone_number_id,
        });
      }
    }
  }
  return out;
}

/**
 * Ek incoming message handle karo → Dialogflow → reply bhejo.
 * Apna flow yahan likho.
 */
async function handleInboundMessage(from, text, opts) {
  const phone = String(from || '').replace(/\D/g, '');
  if (!phone || !text || !String(text).trim()) return null;

  const sessionId = channelSessions.sessionIdFor('wa', phone);
  mergeSessionMeta(sessionId, phone);

  let result;
  try {
    result = await channelChat.processChatTurn({
      sessionId,
      message: String(text).trim(),
      languageCode: (opts && opts.languageCode) || defaultLanguage,
      channel: 'whatsapp',
    });
  } catch (err) {
    console.error('[whatsapp.integration]', err.message);
    return null;
  }

  const reply =
    result.outboundText ||
    (result.waitingForAgent ? waitingForAgentMessage : '');

  if (reply) {
    await sendOutboundReply(phone, reply);
  }
  return { sessionId, reply };
}

/** Agent desk / bot se user ko message bhejo */
async function sendOutboundReply(recipientId, text) {
  if (!isConfigured()) return null;
  return meta.sendWhatsAppText(recipientId, text);
}

async function processWebhookPayload(body) {
  if (!enabled) return { handled: false, count: 0, disabled: true };
  if (!body || body.object !== webhookObject) {
    return { handled: false, count: 0 };
  }
  const messages = extractMessages(body);
  for (const m of messages) {
    await handleInboundMessage(m.from, m.text, {});
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
