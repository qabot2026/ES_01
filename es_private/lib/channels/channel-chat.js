/**
 * Shared chat turn — Dialogflow + live agent + transcript (web + social).
 */

const dialogflow = require('../dialogflow');
const phraseTranslations = require('../phrase-translations');
const messageSyntax = require('../message-syntax');
const liveAgent = require('../live-agent');
const chatTranscript = require('../chat-transcript');
const esTestMode = require('../es-test-mode');
const channelSessions = require('./channel-sessions');

function pickReplyText(result) {
  if (!result) return '';
  const main = result.reply && String(result.reply).trim();
  if (main) return main;
  const parts = Array.isArray(result.replyParts) ? result.replyParts : [];
  return parts
    .map((p) => (p && p.text ? String(p.text).trim() : ''))
    .filter(Boolean)
    .join('\n\n');
}

/**
 * @param {object} opts
 * @param {string} opts.sessionId
 * @param {string} [opts.message]
 * @param {string} [opts.event]
 * @param {string} [opts.languageCode]
 * @param {string} [opts.uiLanguageCode]
 * @param {string} [opts.dialogflowProjectId]
 * @param {string} [opts.channel] web | whatsapp | instagram | facebook
 * @param {boolean} [opts.skipTranscriptUser]
 * @param {object} [opts.req] Express req for ES test detection
 */
async function processChatTurn(opts) {
  const {
    sessionId,
    message,
    languageCode = 'en',
    uiLanguageCode,
    event,
    dialogflowProjectId,
    channel = 'web',
    skipTranscriptUser = false,
    req,
    orchestrationMode,
    orchestrationChildId,
  } = opts || {};

  const sid = String(sessionId || '').trim();
  const isEsTest = req ? esTestMode.isEsTestRequest(req, sid) : false;
  const eventName =
    typeof event === 'string' && event.trim() ? event.trim() : null;
  const uiLang = uiLanguageCode || languageCode;
  const sheetChannel = channelSessions.sheetChannelName(sid);

  await liveAgent.refreshStore();

  if (!isEsTest && liveAgent.isDialogflowBlockedForSession(sid)) {
    const conv = liveAgent.getConversation(sid);
    const agentName = conv
      ? liveAgent.resolveAgentDisplayName(conv.assignedAgentEmail)
      : '';
    if (!eventName && message && typeof message === 'string' && message.trim()) {
      try {
        await liveAgent.postUserMessage(sid, message.trim());
      } catch (postErr) {
        console.warn('[live-agent] visitor message during handoff:', postErr.message);
      }
    }
    return {
      sessionId: sid,
      reply: '',
      replyParts: [],
      chips: [],
      forms: [],
      messages: [],
      liveAgent: true,
      humanActive: true,
      skipBot: true,
      agentConnected: !!(conv && conv.status === 'active' && conv.assignedAgentEmail),
      assignedAgentDisplayName: agentName,
      connectedMessage: agentName
        ? `You are now chatting with ${agentName}.`
        : '',
      outboundText: '',
    };
  }

  if (!eventName) {
    if (!message || typeof message !== 'string' || !message.trim()) {
      const err = new Error('message or event is required');
      err.status = 400;
      throw err;
    }
  }

  const dfProjectId =
    typeof dialogflowProjectId === 'string' && dialogflowProjectId.trim()
      ? dialogflowProjectId.trim()
      : undefined;

  let result = eventName
    ? await dialogflow.detectEvent(sid, eventName, languageCode, dfProjectId)
    : await dialogflow.detectIntent(sid, message.trim(), languageCode, dfProjectId);

  if (phraseTranslations.isEnabled()) {
    result = phraseTranslations.applyToResult(result, uiLang);
  }

  if (result.liveAgent && isEsTest) {
    result.liveAgent = false;
    result.waitingForAgent = false;
    result.humanActive = false;
    result.skipBot = false;
    const qaNote =
      'QA test mode: live agent handoff is disabled and nothing is saved.';
    if (!result.reply || !String(result.reply).trim()) {
      result.reply = qaNote;
    } else {
      result.reply = String(result.reply).trim() + '\n\n' + qaNote;
    }
  } else if (result.liveAgent) {
    let handoffVisitorName = '';
    try {
      const doc = chatTranscript.getSessionDoc(sid);
      const meta = doc && doc.meta && typeof doc.meta === 'object' ? doc.meta : {};
      handoffVisitorName =
        (typeof meta.name === 'string' && meta.name.trim()) ||
        (typeof meta.visitorName === 'string' && meta.visitorName.trim()) ||
        '';
    } catch {
      /* ignore */
    }
    const handoff = await liveAgent.requestHandoff(sid, {
      userLanguage: uiLang,
      previewMessage: message ? message.trim() : '',
      visitorName: handoffVisitorName,
      department:
        (result.liveAgentDepartment && String(result.liveAgentDepartment).trim()) ||
        '',
    });
    if (handoff && handoff.outsideHours) {
      const closedMsg =
        (handoff.message && String(handoff.message).trim()) ||
        'Our live support team is currently unavailable. Please try again during business hours.';
      return {
        sessionId: sid,
        reply: closedMsg,
        replyParts: [],
        chips: [],
        forms: [],
        messages: [],
        liveAgent: false,
        humanActive: false,
        skipBot: false,
        outsideHours: true,
        outboundText: closedMsg,
      };
    }
    if (handoff && handoff.dismissed) {
      const dismissedMsg =
        'This chat was closed by our team. You can continue with the assistant below.';
      return {
        sessionId: sid,
        reply: dismissedMsg,
        replyParts: [],
        chips: [],
        forms: [],
        messages: [],
        liveAgent: false,
        humanActive: false,
        skipBot: false,
        outboundText: dismissedMsg,
      };
    }
    chatTranscript.mergeSessionMeta(sid, {
      channel: sheetChannel,
      liveAgentRequested: true,
      liveAgentActive: true,
    });
    result.reply = '';
    result.replyParts = [];
    result.chips = [];
    result.chipHeading = '';
    result.forms = [];
    result.infoCards = [];
    result.downloads = [];
    result.dropdowns = [];
    result.galleries = [];
    result.cardCarousels = [];
    result.liveAgent = true;
    result.waitingForAgent = true;
    result.humanActive = false;
    result.skipBot = false;
  }

  const userText = eventName ? '' : message && message.trim();
  if (!isEsTest) {
    chatTranscript.logDialogflowExchange(sid, userText, result, {
      skipTranscriptUser,
    });
    if (sheetChannel && sheetChannel !== 'Web') {
      chatTranscript.mergeSessionMeta(sid, { channel: sheetChannel });
    }
  }

  messageSyntax.applyFormattedReplyFields(result, channel);

  const outboundText = pickReplyText(result);

  return {
    sessionId: sid,
    esTestMode: isEsTest,
    orchestrationMode: typeof orchestrationMode === 'string' ? orchestrationMode : '',
    orchestrationChildId:
      typeof orchestrationChildId === 'string' ? orchestrationChildId : '',
    outboundText,
    ...result,
  };
}

module.exports = {
  processChatTurn,
  pickReplyText,
};
