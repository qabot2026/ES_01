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
const waRich = require('../../lib/channels/whatsapp-rich-outbound');

/** Integration on/off — false karo jab tak setup na ho */
const enabled = true;

const sessionPrefix = 'wa-';
const channelName = 'WhatsApp';
const webhookObject = 'whatsapp_business_account';
const defaultLanguage = 'en';

/**
 * Pehli baar WhatsApp chat — website ki tarah welcome event.
 * recebot-ptav → FRESH → "Recep Start" (main receptionist menu)
 * Green Valley ke liye: 'START_GREEN_VALLEY'
 * Lake View ke liye: 'START_LAKE_VIEW' (Dialogflow mein jo event ho)
 */
const welcomeEventName = 'FRESH';

/** Purani chat kitni der baad nayi maani jaye (4 ghante) */
const SESSION_IDLE_MS = 4 * 60 * 60 * 1000;

/** Dialogflow context clear — purane number / stale session ke liye */
const resetEventName = 'ENDCHAT';

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

function trimText(text) {
  return String(text || '').trim();
}

function clearFallbackFlag(sessionId) {
  try {
    const chatTranscript = require('../../lib/chat-transcript');
    chatTranscript.mergeSessionMeta(
      sessionId,
      { fallback: '' },
      { scheduleSheet: false }
    );
  } catch {
    /* ignore */
  }
}

function storeLastIntent(sessionId, intent) {
  try {
    const chatTranscript = require('../../lib/chat-transcript');
    chatTranscript.mergeSessionMeta(
      sessionId,
      { lastIntent: String(intent || '').trim() },
      { scheduleSheet: false }
    );
  } catch {
    /* ignore */
  }
}

function lastActivityMs(doc) {
  const turns = doc && Array.isArray(doc.turns) ? doc.turns : [];
  if (!turns.length) return 0;
  const last = turns[turns.length - 1];
  const at = last && last.at ? Date.parse(last.at) : NaN;
  return Number.isFinite(at) ? at : 0;
}

/** Green Valley / Lake View ke andar — wahan Hi = GV greeting, FRESH mat bhejo */
function isInChildFlow(meta) {
  const last = String((meta && meta.lastIntent) || '').trim();
  if (!last) return false;
  if (/fallback/i.test(last)) return false;
  return /^(rec green valley|gv|landing green|lake view|rec lake|lv)/i.test(last);
}

/** Kab FRESH welcome bhejna hai — har number (purana/naya) ke liye */
function welcomeReason(sessionId, text) {
  const msg = trimText(text);
  const chatTranscript = require('../../lib/chat-transcript');
  const doc = chatTranscript.getSessionDoc(sessionId);
  const turns = Array.isArray(doc.turns) ? doc.turns : [];
  const meta = doc && doc.meta && typeof doc.meta === 'object' ? doc.meta : {};

  if (/^(main menu|menu|restart|start over|start)$/i.test(msg)) {
    return 'restart';
  }
  if (turns.length === 0) return 'new';
  if (String(meta.fallback || '').toLowerCase() === 'yes') return 'recover';

  const idle =
    turns.length > 0 &&
    Date.now() - lastActivityMs(doc) > SESSION_IDLE_MS;
  if (idle && isGenericOpener(msg)) return 'idle';

  if (/^(hi|hello|hey|hii|hola|namaste)$/i.test(msg) && !isInChildFlow(meta)) {
    return 'opener';
  }
  return null;
}

async function sendWelcomeMenu(sessionId, phone, opts, withReset) {
  if (withReset && resetEventName) {
    try {
      await channelChat.processChatTurn({
        sessionId,
        event: resetEventName,
        languageCode: (opts && opts.languageCode) || defaultLanguage,
        channel: 'whatsapp',
        skipTranscriptUser: true,
      });
    } catch {
      /* ENDCHAT optional */
    }
  }

  const welcome = await channelChat.processChatTurn({
    sessionId,
    event: welcomeEventName,
    languageCode: (opts && opts.languageCode) || defaultLanguage,
    channel: 'whatsapp',
    skipTranscriptUser: true,
  });

  const welcomeText =
    welcome.outboundText ||
    (welcome.waitingForAgent ? waitingForAgentMessage : '');

  if (welcomeText || (welcome.chips && welcome.chips.length)) {
    await sendDialogflowResult(phone, welcome);
  }
  clearFallbackFlag(sessionId);
  storeLastIntent(sessionId, welcome.intent);
  return welcome;
}

function isGenericOpener(text) {
  return /^(hi|hello|hey|hii|hola|namaste|start|menu|main menu|restart|start over)$/i.test(
    trimText(text)
  );
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
        let text = '';
        if (msg.type === 'text' && msg.text && msg.text.body) {
          text = msg.text.body;
        } else if (msg.type === 'interactive' && msg.interactive) {
          const ir = msg.interactive;
          if (ir.type === 'button_reply' && ir.button_reply) {
            text = ir.button_reply.title || ir.button_reply.id || '';
          } else if (ir.type === 'list_reply' && ir.list_reply) {
            text = ir.list_reply.title || ir.list_reply.id || '';
          }
        }
        if (!text || !String(text).trim()) continue;
        out.push({
          from: msg.from,
          text: String(text).trim(),
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

  const chatTranscript = require('../../lib/chat-transcript');
  const reason = welcomeReason(sessionId, text);

  if (reason && welcomeEventName) {
    try {
      const withReset = reason !== 'new';
      const welcome = await sendWelcomeMenu(
        sessionId,
        phone,
        opts,
        withReset
      );
      const welcomeText =
        welcome.outboundText ||
        (welcome.waitingForAgent ? waitingForAgentMessage : '');
      if (isGenericOpener(text)) {
        return { sessionId, reply: welcomeText };
      }
    } catch (err) {
      console.error('[whatsapp.integration] welcome:', err.message);
    }
  }

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

  if (result.intentIsFallback && welcomeEventName) {
    try {
      const welcome = await sendWelcomeMenu(sessionId, phone, opts, true);
      return {
        sessionId,
        reply: welcome.outboundText || waitingForAgentMessage,
        recoveredFromFallback: true,
      };
    } catch (err) {
      console.error('[whatsapp.integration] fallback recover:', err.message);
    }
  }

  const reply =
    result.outboundText ||
    (result.waitingForAgent ? waitingForAgentMessage : '');

  const hasRich =
    (result.chips && result.chips.length) ||
    (result.dropdowns && result.dropdowns.length) ||
    (result.downloads && result.downloads.length) ||
    (result.infoCards && result.infoCards.length) ||
    (result.galleries && result.galleries.length) ||
    (result.cardCarousels && result.cardCarousels.length) ||
    (result.forms && result.forms.length) ||
    (result.replyParts && result.replyParts.length > 1);

  if (reply || hasRich) {
    if (result.waitingForAgent && !hasRich) {
      await sendOutboundReply(phone, reply);
    } else {
      await sendDialogflowResult(phone, result);
    }
  }
  if (!result.intentIsFallback) {
    clearFallbackFlag(sessionId);
    storeLastIntent(sessionId, result.intent);
  } else {
    try {
      const chatTranscript = require('../../lib/chat-transcript');
      chatTranscript.mergeSessionMeta(
        sessionId,
        { fallback: 'yes' },
        { scheduleSheet: false }
      );
    } catch {
      /* ignore */
    }
  }
  return { sessionId, reply };
}

/** Dialogflow result — text + chips/lists/images/forms */
async function sendDialogflowResult(recipientId, result) {
  if (!isConfigured()) return null;
  try {
    return await waRich.deliverDialogflowResult(recipientId, result);
  } catch (err) {
    console.error('[whatsapp.integration] rich send:', err.message);
    const fallback =
      (result && (result.outboundText || result.reply)) || '';
    if (fallback) return sendOutboundReply(recipientId, fallback);
    return null;
  }
}

/** Agent desk / simple text reply */
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
  welcomeEventName,
  extractMessages,
  handleInboundMessage,
  sendDialogflowResult,
  sendOutboundReply,
  processWebhookPayload,
};
