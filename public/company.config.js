/**
 * QualityAssistant — single settings file (Dialogflow ES + custom widget).
 *
 * How to use:
 * 1. Edit values below, save.
 * 2. Hard-refresh (Ctrl+F5) or bump ?v= on script tags after deploy.
 *
 * Load order (before chat-widget.js):
 *   company.config.js → chat-widget.js
 *
 * Embed one-liner for client sites:
 *   <script src="https://es-based-chatbot-production.up.railway.app/embed.js" async></script>
 *
 * Layout: common = shared | desk = desktop | mob = mobile (≤768px)
 *
 * Cost flags (for planning):
 *   🟢 Green = no extra API / free (UI, browser speech)
 *   🔴 Red = extra Dialogflow/Railway/paid API usage
 */

window.QA_CHAT_UI_CONFIG = {
  // ========================= COMMON =========================
  common: {
    // Dialogflow ES (not CX — no location field).
    dialogflow: {
      projectId: 'qualityassistant-ygdm',
      agentId: '07ccbfd0-4cad-4898-8323-e6baeec80fc1',
    },

    // Production / embed URLs.
    deploy: {
      publicBaseUrl: 'https://es-based-chatbot-production.up.railway.app',
      embedScript:
        'https://es-based-chatbot-production.up.railway.app/embed.js',
    },

    // Header (open chat panel).
    header: {
      title: 'QualityAssistant',
      subtitle: 'Your quality & compliance guide',
      // Optional HTTPS image URLs (leave "" to use built-in SVG icon).
      headerIconUrl: '',
      showHeaderIcon: true,
    },

    // Welcome block (first open / after restart).
    welcome: {
      title: 'Welcome to QualityAssistant',
      body: 'Ask about quality standards, procedures, or compliance.',
      restartTitle: 'Conversation restarted',
      restartBody: 'How can I help you today?',
    },

    // Bot row avatar 🟢 UI only
    botPersona: {
      mode: 'icon', // "icon" | "image"
      imageUrl: '',
      label: 'QA',
    },

    // User row avatar 🟢 UI only
    userPersona: {
      label: 'You',
    },

    // Footer: language + mic + restart + powered by
    features: {
      // 🟢 Each message = 1 Dialogflow detectIntent (required for chat).
      multiLanguage: {
        enabled: true,
        defaultLanguage: 'en',
        // Dropdown width: ch + extra px; border on/off
        selectWidthCh: 10,
        selectWidthExtraPx: 5,
        showSelectBorder: false,
        languages: [
          { code: 'en', label: 'English', speech: 'en-IN', dialogflow: 'en' },
          { code: 'hi', label: 'Hindi', speech: 'hi-IN', dialogflow: 'hi' },
          { code: 'mr', label: 'Marathi', speech: 'mr-IN', dialogflow: 'mr' },
        ],
      },

      // 🟢 Browser Web Speech API (no Google Speech bill).
      speechToText: {
        enabled: true,
      },

      // 🟢 New session id only — no extra API until user sends again.
      restartChat: {
        enabled: true,
        label: 'Restart',
      },

      // Composer placeholder per language (optional).
      inputPlaceholderByLanguage: {
        en: 'Type your message…',
        hi: 'अपना संदेश लिखें…',
        mr: 'तुमचा संदेश लिहा…',
      },
    },

    // "Powered by" strip in footer 🟢
    poweredBy: {
      enabled: true,
      prefix: 'Powered by',
      brandName: 'QualityAssistant',
      logoUrl: '', // empty = /widget/logo-powered.svg from apiBase
      linkUrl: '',
      fontSizePx: 11,
    },

    // Chat colors (CSS variables on .qa-widget) 🟢
    theme: {
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
    },

    // Widget position when closed (launcher bubble).
    chatLayout: {
      side: 'right', // "right" | "left"
    },

    // Launcher button (closed state) 🟢
    launcher: {
      sizePx: 60,
    },
  },

  // ========================= DESKTOP =========================
  desk: {
    showChatbot: true,
    chatWindow: {
      widthPx: 400,
      heightPx: 640,
      position: { rightPx: 24, bottomPx: 24, leftPx: null },
    },
    autoOpenChat: {
      enabled: false,
      delayMs: 0,
    },
  },

  // ========================= MOBILE (≤768px) =========================
  mob: {
    showChatbot: true,
    chatWindow: {
      widthPx: null, // null = full width minus inset
      heightPx: null,
      horizontalInsetPx: 16,
      bottomInsetPx: 16,
      position: { rightPx: 16, bottomPx: 16, leftPx: null },
    },
    autoOpenChat: {
      enabled: false,
      delayMs: 0,
    },
  },
};

// Back-compat for embed / demos that read QA_CONFIG.
(function () {
  var c = window.QA_CHAT_UI_CONFIG;
  if (!c || !c.common) return;
  window.QA_CONFIG = {
    apiBase: c.common.deploy.publicBaseUrl,
    embedScript: c.common.deploy.embedScript,
  };
})();
