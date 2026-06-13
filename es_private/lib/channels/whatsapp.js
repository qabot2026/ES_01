/**
 * WhatsApp Cloud API — inbound webhook + outbound via meta-shared.
 */

const channelSessions = require('./channel-sessions');
const channelChat = require('./channel-chat');
const meta = require('./meta-shared');

async function handleInboundMessage(from, text, opts) {
  const phone = String(from || '').replace(/\D/g, '');
  if (!phone || !text || !String(text).trim()) return null;

  const sessionId = channelSessions.sessionIdFor('wa', phone);
  chatTranscriptMeta(sessionId, phone);

  let result;
  try {
    result = await channelChat.processChatTurn({
      sessionId,
      message: String(text).trim(),
      languageCode: (opts && opts.languageCode) || 'en',
      channel: 'whatsapp',
      skipTranscriptUser: false,
    });
  } catch (err) {
    console.error('[whatsapp] chat turn:', err.message);
    return null;
  }

  const reply =
    result.outboundText ||
    (result.waitingForAgent
      ? 'Please wait — a team member will join shortly.'
      : '');

  if (reply && meta.isWhatsAppConfigured()) {
    try {
      await meta.sendWhatsAppText(phone, reply);
    } catch (sendErr) {
      console.error('[whatsapp] send:', sendErr.message);
    }
  }
  return { sessionId, reply };
}

function chatTranscriptMeta(sessionId, phone) {
  try {
    const chatTranscript = require('../chat-transcript');
    chatTranscript.mergeSessionMeta(sessionId, {
      channel: 'WhatsApp',
      whatsappPhone: phone,
    });
  } catch {
    /* ignore */
  }
}

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

async function processWebhookPayload(body) {
  if (!body || body.object !== 'whatsapp_business_account') {
    return { handled: false, count: 0 };
  }
  const messages = extractMessages(body);
  for (const m of messages) {
    await handleInboundMessage(m.from, m.text, {});
  }
  return { handled: true, count: messages.length };
}

module.exports = {
  handleInboundMessage,
  extractMessages,
  processWebhookPayload,
};
