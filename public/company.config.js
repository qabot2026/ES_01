/**
 * QualityAssistant — EDIT ONLY THIS FILE (same idea as refer company.config.js).
 * All 🟢 GREEN — UI / browser only.
 *
 * Logos: set your HTTPS image URLs below (refer uses chatIconUrl + chatTitleIconUrl).
 */

var QA_LOGO_LAUNCHER =
  'https://storage.googleapis.com/companybucket/Images/cat.png';
var QA_LOGO_HEADER =
  'https://storage.googleapis.com/companybucket/Images/cat-icon.png';

window.QA_CHAT_UI_CONFIG = {
  common: {
    cost: 'green',
    dialogflow: {
      projectId: 'qualityassistant-ygdm',
      agentId: '07ccbfd0-4cad-4898-8323-e6baeec80fc1',
      /**
       * Fire a Dialogflow ES event when the chat opens / restarts.
       * Create the same event name under Dialogflow → Events (e.g. FRESH).
       */
      welcomeEvent: {
        enabled: true,
        eventName: 'FRESH',
        triggerOnChatOpen: true,
        triggerOnRestart: true,
        /** One FRESH per page load until Restart (stops duplicate bot replies) */
        triggerOncePerSession: true,
      },
      /** GREEN — chips + info cards from Custom payload richContent */
      richContentChips: {
        enabled: true,
        cost: 'green',
        /** Info card image — contain = full image visible (no crop); cover = fill & crop */
        infoCardImage: {
          cardWidthPx: 220,
          imageMaxHeightPx: 220,
          objectFit: 'contain',
          background: '#e8f4fc',
        },
        /** open_gallery — horizontal image strip (urls in Dialogflow payload) */
        galleryImage: {
          itemWidthPx: 180,
          imageHeightPx: 120,
          objectFit: 'cover',
          background: '#e8f4fc',
        },
      },
    },

    deploy: {
      publicBaseUrl: 'https://es-based-chatbot-production.up.railway.app',
      embedScript:
        'https://es-based-chatbot-production.up.railway.app/embed.js',
    },

    typography: {
      fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
    },

    // Chat panel top bar — title + subtitle (only edit here, not server.js)
    header: {
      title: 'Quality Testing Assistant',
      subtitle: '🟢 We are online to help',
      chatIconUrl: QA_LOGO_LAUNCHER,
      chatTitleIconUrl: QA_LOGO_HEADER,
      headerIconUrl: QA_LOGO_HEADER,
      titlebarIconSizePx: 40,
      showHeaderIcon: true,
      botWritingText: 'Typing',
      botWritingDotsIntervalMs: 480,
    },

    welcome: {
      /** false = no welcome title/body/chips when chat opens or after Restart */
      enabled: false,
      title: 'Welcome',
      body: 'Select an option',
      restartTitle: 'Restarted',
      restartBody: 'Select an option.',
      /** Tap chips below welcome/restart text — sends message to bot */
      suggestionChips: {
        enabled: false,
        items: [
          {
            label: 'DisplayName',
            message: 'TriggerName',
          },
          {
            label: 'DisplayName',
            message: 'TriggerName',
          }, 
          {
            label: 'DisplayName',
            message: 'TriggerName',
          }, {
            label: 'DisplayName',
            message: 'TriggerName',
          },
        ],
      },
    },

    botPersona: {
      mode: 'image',
      imageUrl: QA_LOGO_HEADER,
      label: 'Quality',
      avatarSizePx: 32,
      gapBelowPx: 4,
      showTime: true,
      showSeconds: true,
      timeZone: 'Asia/Kolkata',
      messageTimeIncludesDate: false,
    },

    userPersona: {
      label: 'You',
      avatarSizePx: 18,
      gapBelowPx: 4,
      showTime: true,
      showSeconds: true,
      timeZone: 'Asia/Kolkata',
      messageTimeIncludesDate: false,
    },

    features: {
      multiLanguage: {
        enabled: true,
        defaultLanguage: 'en',
        selectWidthCh: 10,
        selectWidthExtraPx: 15,
        showSelectBorder: false,
        languages: [
          {
            code: 'en',
            label: 'English',
            nativeLabel: 'English',
            speech: 'en-IN',
            dialogflow: 'en',
          },
          {
            code: 'hi',
            label: 'Hindi',
            nativeLabel: 'हिन्दी',
            speech: 'hi-IN',
            dialogflow: 'hi',
          },
          {
            code: 'mr',
            label: 'Marathi',
            nativeLabel: 'मराठी',
            speech: 'mr-IN',
            dialogflow: 'mr',
          },
        ],
      },
      speechToText: { enabled: true },
      restartChat: { enabled: true, label: 'Restart' },
      inputPlaceholderByLanguage: {
        en: 'Type your message here…',
        hi: 'अपना संदेश लिखें…',
        mr: 'तुमचा संदेश लिहा…',
      },
    },

    poweredBy: {
      enabled: true,
      prefix: '⚡by ',
      brandName: 'QualityAssistant',
      logoUrl: "https://www.vhv.rs/dpng/d/6-68550_hanuman-ji-png-transparent-png.png",
      linkUrl: 'www.google.com',
      color: '#0369a1',
      fontSizePx: 11,
    },

    theme: {
      '--qa-primary': '#0284c7',
      '--qa-primary-dark': '#0369a1',
      '--qa-primary-deep': '#075985',
      '--qa-accent': '#0ea5e9',
      '--qa-accent-light': '#bae6fd',
      '--qa-bg': '#e8f4fc',
      '--qa-bg-2': '#f7fbff',
      '--qa-surface': '#ffffff',
      '--qa-text': '#0f172a',
      '--qa-text-soft': '#475569',
      '--qa-muted': '#475569',
      '--qa-border': '#dbe5ec',
      '--qa-bot-bg': 'linear-gradient(168deg, #e8f6ff 0%, #bae6fd 100%)',
      '--qa-bot-text': '#0c4a6e',
      '--qa-user-bg': 'linear-gradient(145deg, #0284c7 0%, #0ea5e9 100%)',
      '--qa-user-text': '#f0f9ff',
      '--qa-header-bg':
        'linear-gradient(180deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.1) 24%, transparent 46%), linear-gradient(168deg, #38bdf8 0%, #0284c7 42%, #075985 100%)',
      '--qa-shadow':
        '0 10px 28px -6px rgba(15, 23, 42, 0.1), 0 20px 40px -14px rgba(14, 165, 233, 0.12)',
      '--qa-launcher-shadow': '0 3px 10px -2px rgba(14, 165, 233, 0.2)',
      '--qa-launcher-shadow-hover': '0 5px 14px -2px rgba(14, 165, 233, 0.28)',
      '--qa-radius': '22px',
      '--qa-ring-color': '#0ea5e9',
    },

    chatPanel: {
      borderRadius: {
        topLeft: '22px',
        topRight: '22px',
        bottomLeft: '20px',
        bottomRight: '20px',
      },
    },

    chatLayout: { side: 'right' },

    launcher: {
      sizePx: 64,
      iconUrl: QA_LOGO_LAUNCHER,
      cornerRoundness: '50%',
      storyRing: {
        enabled: true,
        widthPx: 2.5,
        /** Spin the gradient around the ring (Instagram-style). Icon stays still. */
        rotateSeconds: 3,
        /**
         * When true, the colored ring animates (uses rotateSeconds).
         * When false, ring stays static (same colors, no motion).
         */
        colorRingMotionEnabled: true,
        /** true = Instagram rainbow ring; false = theme blue ring (from theme colors). */
        instagramStyle: true,
      },
    },

    launcherStrip: {
      enabled: true,
      text: '👋Hey, how are you?😊',
      position: { rightPx: 10, bottomPx: 66 },
      style: { fontSizePx: 13, paddingYpx: 10, paddingXpx: 14, maxWidthPx: 260 },
    },
  },

  desk: {
    showChatbot: true,
    titlebarIconSizePx: 40,
    chatWindow: {
      widthPx: 400,
      heightPx: 620,
      minHeightPx: 520,
      position: { rightPx: 10, bottomPx: 20, leftPx: null },
    },
    autoOpenChat: { enabled: true, delayMs: 2000 },
    launcherStrip: { text: '👋Hey, how are you?😊' },
  },

  mob: {
    showChatbot: true,
    titlebarIconSizePx: 36,
    chatWindow: {
      widthPx: null,
      heightPx: null,
      minHeightPx: 480,
      horizontalInsetPx: 12,
      bottomInsetPx: 10,
      topInsetPx: 26,
      position: { rightPx: 12, bottomPx: 10, leftPx: null },
    },
    autoOpenChat: { enabled: true, delayMs: 2000 },
    launcherStrip: {
      text: '🤖Chat with us',
      position: { rightPx: 12, bottomPx: 60 },
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
