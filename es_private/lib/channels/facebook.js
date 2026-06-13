/**
 * Facebook Messenger — Meta page messaging webhook (object: page).
 */

const channelSessions = require('./channel-sessions');
const channelChat = require('./channel-chat');
const meta = require('./meta-shared');

function mergeMeta(sessionId, psid) {
  try {
    const chatTranscript = require('../chat-transcript');
    chatTranscript.mergeSessionMeta(sessionId, {
      channel: 'Facebook',
      facebookPsid: psid,
    });
  } catch {
    /* ignore */
  }
}

async function handleInboundMessage(psid, text) {
  const id = String(psid || '').trim();
  const body = String(text || '').trim();
  if (!id || !body) return null;

  const sessionId = channelSessions.sessionIdFor('fb', id);
  mergeMeta(sessionId, id);

  let result;
  try {
    result = await channelChat.processChatTurn({
      sessionId,
      message: body,
      languageCode: 'en',
      channel: 'facebook',
    });
  } catch (err) {
    console.error('[facebook] chat turn:', err.message);
    return null;
  }

  const reply =
    result.outboundText ||
    (result.waitingForAgent
      ? 'Please wait — a team member will join shortly.'
      : '');

  if (reply && meta.isMessengerConfigured()) {
    try {
      await meta.sendMessengerText(id, reply);
    } catch (sendErr) {
      console.error('[facebook] send:', sendErr.message);
    }
  }
  return { sessionId, reply };
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

async function processWebhookPayload(body) {
  if (!body || body.object !== 'page') {
    return { handled: false, count: 0 };
  }
  const messages = extractMessages(body);
  for (const m of messages) {
    await handleInboundMessage(m.from, m.text);
  }
  return { handled: true, count: messages.length };
}

module.exports = {
  handleInboundMessage,
  extractMessages,
  processWebhookPayload,
};
