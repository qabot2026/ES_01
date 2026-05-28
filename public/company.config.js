/**

 * QualityAssistant — EDIT ONLY THIS FILE.

 *

 * COST LEGEND (Dialogflow ES)

 *   🟢 green = no extra detectIntent charge (UI / browser / data already in bot reply)

 *   🔴 red   = billable Dialogflow request via /api/chat (text or event)

 *

 * Full table: FEATURE-COSTS.md in project root.

 *

 * Logos: HTTPS image URLs below.

 */



var QA_LOGO_LAUNCHER =

  'https://storage.googleapis.com/companybucket/Images/cat.png';

var QA_LOGO_HEADER =

  'https://storage.googleapis.com/companybucket/Images/cat-icon.png';



window.QA_CHAT_UI_CONFIG = {

  common: {

    /** 🟢 This config file itself does not call APIs */

    cost: 'green',



  /**

   * Quick reference — match keys to sections below.

   * cost: 'green' | 'red'

   */

    featureCostGuide: [

      { id: 'userMessage', cost: 'red', label: 'User Send / typed message' },

      { id: 'welcomeEvent', cost: 'red', label: 'FRESH event (open / restart)' },

      { id: 'endChatEvent', cost: 'red', label: 'ENDCHAT event (idle / close)' },

      { id: 'chipsAndButtons', cost: 'red', label: 'Chip / card CTA / dropdown selection' },

      { id: 'restartChat', cost: 'red', label: 'Restart (+ FRESH if enabled)' },

      { id: 'speechToText', cost: 'green', label: 'Mic (browser STT)' },

      { id: 'speechSend', cost: 'red', label: 'Sending mic transcript' },

      { id: 'multiLanguage', cost: 'green', label: 'Language picker UI' },

      { id: 'richContent', cost: 'green', label: 'Cards, gallery, carousel, chips display' },

      { id: 'carouselAutoScroll', cost: 'green', label: 'Auto-scroll / arrows / lightbox' },

      { id: 'themeLayout', cost: 'green', label: 'Theme, launcher, header, personas' },

      { id: 'hostedImages', cost: 'green', label: 'Show images (GCS bandwidth only, not Dialogflow)' },

    ],



    dialogflow: {

      projectId: 'qualityassistant-ygdm',

      agentId: '07ccbfd0-4cad-4898-8323-e6baeec80fc1',

      /** 🔴 FRESH — 1 detectIntent per open/restart (when enabled) */

      welcomeEvent: {

        cost: 'red',

        enabled: true,

        eventName: 'FRESH',

        triggerOnChatOpen: true,

        triggerOnRestart: true,

        triggerOncePerSession: true,

      },

      /** 🔴 ENDCHAT — 1 detectIntent per idle/close (when enabled) */

      endChatEvent: {

        cost: 'red',

        enabled: true,

        eventName: 'ENDCHAT',

        triggerOnIdle: true,

        idleTimeoutMs: 20000,

        triggerOnChatClose: false,

        triggerOnRestart: false,

        showBotResponse: true,

        closePanelAfterEnd: false,

        closePanelAfterMs: 2500,

        triggerOncePerSession: true,

        requireUserInteraction: true,

      },

      /**

       * 🟢 Display only — parsed from fulfillment JSON (no extra API).

       * 🔴 User taps chip / card button / dropdown → sends message (billable).

       */

      richContentChips: {

        enabled: true,

        cost: 'green',

        infoCardImage: {

          cost: 'green',

          cardWidthPx: 220,

          imageMaxHeightPx: 220,

          objectFit: 'contain',

          background: '#e8f4fc',

        },

        scrollStrip: {

          cost: 'green',

          autoScroll: true,

          autoScrollSecondsPerItem: 4,

          stopAutoScrollOnInteraction: true,

        },

        cardCarousel: {

          cost: 'green',

          cardWidthPx: 200,

          imageHeightPx: 140,

          objectFit: 'cover',

          background: '#e8f4fc',

        },

        galleryImage: {

          cost: 'green',

          itemWidthPx: 120,

          imageHeightPx: 90,

          objectFit: 'cover',

          background: '#e8f4fc',

        },

        inlineSelect: {

          cost: 'green',

          display: 'dropdown',

        },

      },

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

      title: 'Quality Testing Assistant',

      subtitle: '🟢 We are online to assist you',

      chatIconUrl: QA_LOGO_LAUNCHER,

      chatTitleIconUrl: QA_LOGO_HEADER,

      headerIconUrl: QA_LOGO_HEADER,

      titlebarIconSizePx: 40,
      /** Default font sizes (px) — overridden by desk.header / mob.header */
      titleFontSizePx: 17,
      subtitleFontSizePx: 12,

      showHeaderIcon: true,

      botWritingText: 'Typing',

      botWritingDotsIntervalMs: 480,

    },



    welcome: {

      cost: 'green',

      enabled: false,

      title: 'Welcome',

      body: 'Select an option',

      restartTitle: 'Restarted',

      restartBody: 'Select an option.',

      /** 🟢 show chips · 🔴 each chip tap sends message */

      suggestionChips: {

        cost: 'red',

        enabled: false,

        items: [

          { label: 'DisplayName', message: 'TriggerName' },

          { label: 'DisplayName', message: 'TriggerName' },

          { label: 'DisplayName', message: 'TriggerName' },

          { label: 'DisplayName', message: 'TriggerName' },

        ],

      },

    },



    botPersona: {

      cost: 'green',

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

      cost: 'green',

      label: 'You',

      avatarSizePx: 18,

      gapBelowPx: 4,

      showTime: true,

      showSeconds: true,

      timeZone: 'Asia/Kolkata',

      messageTimeIncludesDate: false,

    },



    personaDisplay: {

      cost: 'green',

      nameFontSizePx: 11,

      timeFontSizePx: 10,

      blurPx: 0.35,

      opacity: 0.82,

    },



    features: {

      /** 🟢 picker only — does not call Dialogflow until user sends */

      multiLanguage: {

        cost: 'green',

        enabled: true,

        defaultLanguage: 'en',

        /** UI Marathi/Hindi — Dialogflow hamesha en (English training phrases) */
        alwaysUseDialogflowLanguage: 'en',

        /**
         * 🟢 Whole bot: English phrase → hi/mr (data/phrase-translations.json).
         * Same line works on ANY intent, chips, dropdown. See PHRASE-TRANSLATIONS.md.
         */
        usePhraseTranslationFile: true,

        /**
         * 🔴 Google Translate API — off when phrase file is used.
         */
        autoTranslateBotReplies: false,
        translationSourceLanguage: 'en',
        translationOverridesByLanguage: {
          hi: {},
          mr: {},
        },

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

            dialogflow: 'en',

          },

          {

            code: 'mr',

            label: 'Marathi',

            nativeLabel: 'मराठी',

            speech: 'mr-IN',

            dialogflow: 'en',

          },

        ],

      },

      /** 🟢 mic · 🔴 sending recognized text */

      speechToText: { cost: 'green', enabled: true },

      /** 🔴 clears session UI + FRESH when welcomeEvent.triggerOnRestart */

      restartChat: { cost: 'red', enabled: false, label: 'Restart' },

      inputPlaceholderByLanguage: {

        cost: 'green',

        en: 'Type your message here…',

        hi: 'अपना संदेश लिखें…',

        mr: 'तुमचा संदेश लिहा…',

      },

    },



    poweredBy: {

      cost: 'green',

      enabled: true,

      prefix: '⚡by ',

      brandName: 'QualityAssistant',

      logoUrl:

        'https://www.vhv.rs/dpng/d/6-68550_hanuman-ji-png-transparent-png.png',

      linkUrl: 'www.google.com',

      color: '#0369a1',

      fontSizePx: 9,

      logoHeightPx: 12,

      offsetDownPx: 15,

    },



    restartButton: {

      cost: 'green',

      gapAfterLanguagePx: 10,

    },

    /** Default on/off — overridden by desk.restartButton / mob.restartButton */



    theme: {

      cost: 'green',

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

      cost: 'green',

      borderRadius: {

        topLeft: '22px',

        topRight: '22px',

        bottomLeft: '20px',

        bottomRight: '20px',

      },

    },



    chatLayout: { cost: 'green', side: 'right' },



    launcher: {

      cost: 'green',

      sizePx: 64,

      iconUrl: QA_LOGO_LAUNCHER,

      cornerRoundness: '50%',

      storyRing: {

        cost: 'green',

        enabled: true,

        widthPx: 2.5,

        rotateSeconds: 3,

        colorRingMotionEnabled: true,

        instagramStyle: true,

      },

    },



    launcherStrip: {

      cost: 'green',

      enabled: true,

      text: '👋Hey, how are you?😊',

      position: { rightPx: 10, bottomPx: 66 },

      style: { fontSizePx: 13, paddingYpx: 10, paddingXpx: 14, maxWidthPx: 260 },

    },

  },



  desk: {

    cost: 'green',

    showChatbot: true,

    titlebarIconSizePx: 40,

    /** Desktop header sizes (px) */
    header: {
      titleFontSizePx: 18,
      subtitleFontSizePx: 13,
      iconSizePx: 44,
    },

    /** Desktop footer Restart button */
    restartButton: {
      enabled: true,
    },

    chatWindow: {

      cost: 'green',

      widthPx: 400,

      heightPx: 520,

      minHeightPx: 360,

      topInsetPx: 16,

      position: { rightPx: 10, bottomPx: 20, leftPx: null },

    },

    /** 🟢 opens panel · 🔴 +1 if welcomeEvent on open */

    autoOpenChat: { cost: 'green', enabled: true, delayMs: 2000 },

    launcherStrip: { cost: 'green', text: '👋Hey, how are you?😊' },

  },



  mob: {

    cost: 'green',

    showChatbot: true,

    titlebarIconSizePx: 36,

    /** Mobile header sizes (px) */
    header: {
      titleFontSizePx: 15,
      subtitleFontSizePx: 11,
      iconSizePx: 32,
    },

    /** Mobile footer Restart button */
    restartButton: {
      enabled: false,
    },

    chatWindow: {

      cost: 'green',

      widthPx: null,

      heightPx: null,

      minHeightPx: 480,

      horizontalInsetPx: 12,

      bottomInsetPx: 10,

      topInsetPx: 26,

      position: { rightPx: 12, bottomPx: 10, leftPx: null },

    },

    autoOpenChat: { cost: 'green', enabled: true, delayMs: 2000 },

    launcherStrip: {

      cost: 'green',

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


