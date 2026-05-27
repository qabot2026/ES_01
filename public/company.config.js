/**
 * QualityAssistant — EDIT ONLY THIS FILE to customize the chatbot.
 * All sections below are 🟢 GREEN (UI / browser only — no extra paid APIs).
 *
 * Load: company.config.js → chat-widget.js
 * Embed: <script src="https://es-based-chatbot-production.up.railway.app/embed.js" async></script>
 */

window.QA_CHAT_UI_CONFIG = {
  common: {
    cost: 'green',
    dialogflow: {
      cost: 'green',
      projectId: 'qualityassistant-ygdm',
      agentId: '07ccbfd0-4cad-4898-8323-e6baeec80fc1',
    },

    deploy: {
      cost: 'green',
      publicBaseUrl: 'https://es-based-chatbot-production.up.railway.app',
      embedScript:
        'https://es-based-chatbot-production.up.railway.app/embed.js',
    },

    typography: {
      cost: 'green',
      fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
    },

    header: {
      cost: 'green',
      title: 'QualityAssistant',
      subtitle: 'Your quality & compliance guide',
      headerIconUrl: '',
      titlebarIconSizePx: 44,
      showHeaderIcon: true,
      botWritingText: 'Typing',
      botWritingDotsIntervalMs: 480,
    },

    welcome: {
      cost: 'green',
      title: 'Welcome to QualityAssistant',
      body: 'Ask about quality standards, procedures, or compliance.',
      restartTitle: 'Conversation restarted',
      restartBody: 'How can I help you today?',
    },

    botPersona: {
      cost: 'green',
      mode: 'icon',
      imageUrl: '',
      label: 'QA',
      avatarSizePx: 36,
      gapBelowPx: 4,
      showTime: false,
      timeZone: 'Asia/Kolkata',
      messageTimeIncludesDate: false,
    },

    userPersona: {
      cost: 'green',
      label: 'You',
      showTime: false,
      timeZone: 'Asia/Kolkata',
    },

    features: {
      multiLanguage: {
        cost: 'green',
        enabled: true,
        defaultLanguage: 'en',
        selectWidthCh: 10,
        selectWidthExtraPx: 5,
        showSelectBorder: false,
        languages: [
          { code: 'en', label: 'English', speech: 'en-IN', dialogflow: 'en' },
          { code: 'hi', label: 'Hindi', speech: 'hi-IN', dialogflow: 'hi' },
          { code: 'mr', label: 'Marathi', speech: 'mr-IN', dialogflow: 'mr' },
        ],
      },
      speechToText: {
        cost: 'green',
        enabled: true,
      },
      restartChat: {
        cost: 'green',
        enabled: true,
        label: 'Restart',
      },
      inputPlaceholderByLanguage: {
        cost: 'green',
        en: 'Type your message…',
        hi: 'अपना संदेश लिखें…',
        mr: 'तुमचा संदेश लिहा…',
      },
    },

    poweredBy: {
      cost: 'green',
      enabled: true,
      prefix: 'Powered by',
      brandName: 'QualityAssistant',
      logoUrl: '',
      linkUrl: '',
      color: '#64748b',
      fontSizePx: 11,
    },

    theme: {
      cost: 'green',
      '--qa-primary': '#0f766e',
      '--qa-primary-dark': '#0d5c56',
      '--qa-accent': '#14b8a6',
      '--qa-bg': '#f0fdfa',
      '--qa-surface': '#ffffff',
      '--qa-text': '#0f172a',
      '--qa-muted': '#64748b',
      '--qa-border': '#e2e8f0',
      '--qa-bot-bg': '#f1f5f9',
      '--qa-user-bg': 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
      '--qa-shadow': '0 25px 50px -12px rgba(15, 118, 110, 0.25)',
      '--qa-radius': '16px',
    },

    chatPanel: {
      cost: 'green',
      borderRadius: {
        topLeft: '16px',
        topRight: '16px',
        bottomLeft: '16px',
        bottomRight: '16px',
      },
    },

    chatLayout: {
      cost: 'green',
      side: 'right',
    },

    launcher: {
      cost: 'green',
      sizePx: 60,
      iconUrl: '',
      cornerRoundness: '50%',
      storyRing: {
        enabled: false,
        widthPx: 3,
        rotateSeconds: 5,
      },
    },

    launcherStrip: {
      cost: 'green',
      enabled: true,
      text: '👋 How can we help?',
      position: { rightPx: 0, bottomPx: 72 },
      style: {
        fontSizePx: 13,
        paddingYpx: 8,
        paddingXpx: 12,
        maxWidthPx: 220,
      },
    },
  },

  desk: {
    cost: 'green',
    showChatbot: true,
    titlebarIconSizePx: 44,
    chatWindow: {
      widthPx: 400,
      heightPx: 640,
      position: { rightPx: 24, bottomPx: 24, leftPx: null },
    },
    autoOpenChat: {
      enabled: false,
      delayMs: 3000,
    },
    launcherStrip: {
      text: '👋 How can we help?',
    },
  },

  mob: {
    cost: 'green',
    showChatbot: true,
    titlebarIconSizePx: 40,
    chatWindow: {
      horizontalInsetPx: 16,
      bottomInsetPx: 16,
      topInsetPx: 24,
      position: { rightPx: 16, bottomPx: 16, leftPx: null },
    },
    autoOpenChat: {
      enabled: false,
      delayMs: 3000,
    },
    launcherStrip: {
      text: '👋 Chat with us',
      position: { rightPx: 0, bottomPx: 68 },
    },
  },
};

(function () {
  var c = window.QA_CHAT_UI_CONFIG;
  if (!c || !c.common) return;
  window.QA_CONFIG = {
    apiBase: c.common.deploy.publicBaseUrl,
    embedScript: c.common.deploy.embedScript,
  };
})();
