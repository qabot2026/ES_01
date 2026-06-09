/** Yahi file edit karo. common = Dialogflow/language. desk/mob = har device ki alag UI. showChatbot: false = us device par chatbot hide. composerUpload.enabled: false = 📎 upload button hide. */

var QA_LOGO_LAUNCHER =
  'https://storage.googleapis.com/companybucket/Images/cat.png';
var QA_LOGO_HEADER =
  'https://storage.googleapis.com/companybucket/Images/cat-icon.png';

window.QA_CHAT_UI_CONFIG = {
  common: {
    dialogflow: {
      projectId: 'recebot-ptav',
      agentId: '5ea01258-d01b-44eb-9b2a-9f6338d43d63',
      /**
       * Home page = receptionist + child project bots (full flow in one chat).
       * Project pages = standalone (see AGENT-ORCHESTRATION.md).
       * Dialogflow ES: har bot = alag GCP projectId.
       */
      agentOrchestration: {
        enabled: true,
        role: 'receptionist',
        childWelcomeEvent: 'FRESH',
        returnWelcomeEvent: 'FRESH',
        returnTriggers: [
          'Main menu',
          'main menu',
          'Back',
          'back',
          'Menu',
          'menu',
          'Receptionist',
          'receptionist',
        ],
        children: [
          {
            id: 'green-valley',
            label: 'Green Valley',
            projectId: 'greenvalley-aryq',
            openTriggers: ['Green Valley', 'green valley', 'Project A', 'project a'],
            welcomeEvent: 'FRESH',
          },
          {
            id: 'lake-view',
            label: 'Lake View',
            projectId: 'lakeview-pgsd',
            openTriggers: ['Lake View', 'lake view', 'Project B', 'project b'],
            welcomeEvent: 'FRESH',
          },
        ],
      },
      /** Dialogflow events — not the ↻ button (see desk/mob restartButton). */
      welcomeEvent: {
        enabled: true,
        eventName: 'FRESH',
        triggerOnChatOpen: true,
        /** User clicks ↻ Restart: send FRESH to Dialogflow? */
        triggerOnRestart: true,
        triggerOncePerSession: true,
      },
      endChatEvent: {
        enabled: true,
        eventName: 'ENDCHAT',
        triggerOnIdle: true,
        idleTimeoutMs: 20000,
        triggerOnChatClose: false,
        /** User clicks ↻ Restart: send ENDCHAT before new session? */
        triggerOnRestart: false,
        showBotResponse: true,
        closePanelAfterEnd: false,
        closePanelAfterMs: 2500,
        triggerOncePerSession: true,
        requireUserInteraction: true,
      },
      richContentChips: {
        enabled: true,
        infoCardImage: {
          cardWidthPx: 220,
          imageMaxHeightPx: 220,
          objectFit: 'contain',
          background: '#e8f4fc',
        },
        scrollStrip: {
          autoScroll: true,
          autoScrollSecondsPerItem: 4,
          stopAutoScrollOnInteraction: true,
        },
        cardCarousel: {
          cardWidthPx: 200,
          imageHeightPx: 140,
          objectFit: 'cover',
          background: '#e8f4fc',
        },
        galleryImage: {
          itemWidthPx: 120,
          imageHeightPx: 90,
          objectFit: 'cover',
          background: '#e8f4fc',
        },
        inlineSelect: { display: 'dropdown' },
      },
      /** In-chat forms — definitions in /public/forms/*.js */
      /**
       * Live agent desk — team chats at /live-agent/
       * Dialogflow: intent "Live Agent" or parameter live_agent=true
       */
      liveAgent: {
        enabled: true,
        pollIntervalMs: 600,
        deskUrl: '/live-agent/',
        dashboardUrl: '/dashboard/',
      },
      forms: {
        enabled: true,
        /**
         * Appointment form_id: "appointment" — edit on server:
         *   data/appointment-schedule.json  (forms.appointment)
         *   data/appointment-booked.json    (booked counts per slot)
         * weekdays + periods (9:00 AM–5:00 PM), slotMinutes, slotCapacity per day.
         */
        appointment: {
          scheduleFile: 'data/appointment-schedule.json',
        },
      },
    },

    deploy: {
      publicBaseUrl: 'https://es-based-chatbot-production.up.railway.app',
      embedScript: 'https://es-based-chatbot-production.up.railway.app/embed.js',
    },

    typography: {
      fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
    },

    header: {
      title: 'Quality Testing Assistant',
      subtitle: 'We are online to assist you',
      chatIconUrl: QA_LOGO_LAUNCHER,
      chatTitleIconUrl: QA_LOGO_HEADER,
      headerIconUrl: QA_LOGO_HEADER,
      showHeaderIcon: true,
      botWritingText: 'Typing',
      botWritingDotsIntervalMs: 480,
    },

    welcome: {
      enabled: false,
      title: 'Welcome',
      body: 'Select an option',
      restartTitle: 'Restarted',
      restartBody: 'Select an option.',
      suggestionChips: {
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

    /** Shown when a human agent joins (live-agent handoff). */
    agentPersona: {
      mode: 'icon',
      label: 'Support Agent',
      imageUrl: '',
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

    personaDisplay: {
      nameFontSizePx: 11,
      timeFontSizePx: 10,
      blurPx: 0.35,
      opacity: 0.82,
    },

    features: {
      multiLanguage: {
        enabled: true,
        defaultLanguage: 'en',
        alwaysUseDialogflowLanguage: 'en',
        usePhraseTranslationFile: true,
        autoTranslateBotReplies: false,
        translationSourceLanguage: 'en',
        translationOverridesByLanguage: { hi: {}, mr: {} },
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
      speechToText: { enabled: true }, // mic button on/off
      /**
       * 📎 in composer — upload without Dialogflow upload form
       * enabled: false = button off (global). desk/mob.features.composerUpload se alag device par off.
       * display: 'rich' = clear SVG clip | 'emoji' = 📎 emoji
       * tiltDeg: icon tilt (e.g. -18)
       */
      composerUpload: {
        enabled: true,
        display: 'rich',
        emoji: '📎',
        tiltDeg: -18,
        /** false = no bot “Upload successful!” message after 📎 upload */
        showSuccessAck: false,
        /** false = no “Uploading…” bot message while upload runs */
        showUploadingStatus: false,
        accept:
          'image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf,.odt,.ods,.odp,.zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/csv,application/zip,application/x-zip-compressed',
        successByLanguage: {
          en: '✅ Upload successful! We received your document(s): {files}',
          hi: '✅ अपलोड सफल! हमें आपके दस्तावेज़ मिल गए: {files}',
          mr: '✅ अपलोड यशस्वी! आम्हाला तुमचे दस्तऐवज मिळाले: {files}',
        },
        duplicateByLanguage: {
          en: '✅ We already received your document(s): {files}',
          hi: '✅ ये दस्तावेज़ पहले से प्राप्त हैं: {files}',
          mr: '✅ हे दस्तऐवज आधीच मिळाले आहेत: {files}',
        },
        failedByLanguage: {
          en: 'Could not upload. Please try again or use Contact us first.',
          hi: 'अपलोड नहीं हो सका। दोबारा कोशिश करें या पहले संपर्क फॉर्म भरें।',
          mr: 'अपलोड झाले नाही. पुन्हा प्रयत्न करा किंवा आधी संपर्क फॉर्म भरा.',
        },
        uploadingByLanguage: {
          en: 'Uploading your document(s)…',
          hi: 'आपके दस्तावेज़ अपलोड हो रहे हैं…',
          mr: 'तुमचे दस्तऐवज अपलोड होत आहेत…',
        },
      },
      inputPlaceholderByLanguage: {
        en: 'Type your message here…',
        hi: 'अपना संदेश लिखें…',
        mr: 'तुमचा संदेश लिहा…',
      },
    },

    /** Gap between language dropdown and ↻ button (desk + mob). Show/hide: desk.mob.restartButton */
    restartButton: { gapAfterLanguagePx: 10 },

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
  },

  /** Desktop (screen > 768px) — poori UI yahan */
  desk: {
    showChatbot: true,

    chatLayout: { side: 'right' },

    header: {
      titleFontSizePx: 18,
      subtitleFontSizePx: 13,
      iconSizePx: 44,
      titlebarIconSizePx: 40,
    },

    launcher: {
      sizePx: 64,
      iconUrl: QA_LOGO_LAUNCHER,
      cornerRoundness: '50%',
      /** enabled: true = bubble+X | false = bubble hide, panel niche (panelBottomPx) */
      closeBubbleWhenOpen: { enabled: true, panelBottomPx: 8 },
      storyRing: {
        enabled: true,
        widthPx: 2.5,
        rotateSeconds: 3,
        colorRingMotionEnabled: true,
        instagramStyle: true,
      },
    },

    launcherStrip: {
      enabled: true,
      text: '👋Hey, how are you?😊',
      /** delayMs = page load ke kitne sec baad haath wave; durationMs = wave kitni der */
      wavePopup: { enabled: true, delayMs: 3000, durationMs: 3000, scale: 3 },
      position: { rightPx: 5, bottomPx: 66 },
      style: { fontSizePx: 13, paddingYpx: 10, paddingXpx: 14, maxWidthPx: 260 },
    },

    chatWindow: {
      widthPx: 400,
      heightPx: 520,
      minHeightPx: 360,
      topInsetPx: 16,
      position: { rightPx: 10, bottomPx: 20, leftPx: null },
    },

    autoOpenChat: { enabled: true, delayMs: 10000 },

    restartButton: { enabled: true },

    poweredBy: {
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

    features: {
      speechToText: { enabled: true },
      composerUpload: { enabled: true },
      restartChat: { enabled: false, label: 'Restart' },
    },
  },

  /** Mobile (screen ≤ 768px) — poori UI yahan */
  mob: {
    showChatbot: true,

    chatLayout: { side: 'right' },

    header: {
      titleFontSizePx: 15,
      subtitleFontSizePx: 11,
      iconSizePx: 32,
      titlebarIconSizePx: 36,
    },

    launcher: {
      sizePx: 58,
      iconUrl: QA_LOGO_LAUNCHER,
      cornerRoundness: '50%',
      closeBubbleWhenOpen: {
        enabled: true,
        panelBottomPx: 10,
        panelHeightExtraPx: 35,
      },
      storyRing: {
        enabled: true,
        widthPx: 2.5,
        rotateSeconds: 3,
        colorRingMotionEnabled: true,
        instagramStyle: true,
      },
    },

    launcherStrip: {
      enabled: true,
      text: '👋Hey, how are you?😊',
      wavePopup: { enabled: true, delayMs: 3000, durationMs: 3000, scale: 3 },
      position: { rightPx: 10, bottomPx: 60, leftPx: null },
      style: { fontSizePx: 12, paddingYpx: 8, paddingXpx: 12, maxWidthPx: 220 },
    },

    chatWindow: {
      widthPx: null,
      heightPx: null,
      minHeightPx: 480,
      horizontalInsetPx: 12,
      bottomInsetPx: 10,
      topInsetPx: 26,
      position: { rightPx: 12, bottomPx: 10, leftPx: null },
    },

    autoOpenChat: { enabled: true, delayMs: 7000 },

    restartButton: { enabled: true },

    poweredBy: {
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

    features: {
      speechToText: { enabled: true },
      composerUpload: { enabled: true },
      restartChat: { enabled: true, label: 'Restart' },
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
