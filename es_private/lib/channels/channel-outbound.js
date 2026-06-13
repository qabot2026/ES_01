/**
 * Deliver agent / system text replies to WhatsApp, Instagram, Facebook sessions.
 */

const channelSessions = require('./channel-sessions');
const meta = require('./meta-shared');

async function deliverAgentReply(sessionId, text) {
  const sid = String(sessionId || '').trim();
  const body = text == null ? '' : String(text).trim();
  if (!sid || !body) return { sent: false, reason: 'empty' };

  const { channel, externalId } = channelSessions.parseSessionId(sid);

  if (channel === 'whatsapp') {
    if (!meta.isWhatsAppConfigured()) {
      return { sent: false, reason: 'whatsapp_not_configured' };
    }
    await meta.sendWhatsAppText(externalId, body);
    return { sent: true, channel: 'whatsapp' };
  }

  if (channel === 'instagram' || channel === 'facebook') {
    if (!meta.isMessengerConfigured()) {
      return { sent: false, reason: 'messenger_not_configured' };
    }
    await meta.sendMessengerText(externalId, body);
    return { sent: true, channel };
  }

  return { sent: false, reason: 'not_social_session' };
}

module.exports = {
  deliverAgentReply,
};
