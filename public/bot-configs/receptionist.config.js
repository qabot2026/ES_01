/** UI/UX config — Receptionist (Bot ID 10001, sitePreset: receptionist) */
(function (g) {
  g.QA_BOT_PRESETS = g.QA_BOT_PRESETS || {};
  g.QA_BOT_PRESETS["receptionist"] = {
  "botId": "10001",
  "name": "Receptionist",
  "welcomeEventName": "",
  "theme": {
    "--qa-primary": "#0284c7",
    "--qa-primary-dark": "#0369a1",
    "--qa-primary-deep": "#075985",
    "--qa-accent": "#0ea5e9",
    "--qa-accent-light": "#bae6fd",
    "--qa-bg": "#e8f4fc",
    "--qa-bg-2": "#f7fbff",
    "--qa-border": "#dbe5ec",
    "--qa-bot-bg": "linear-gradient(168deg, #e8f6ff 0%, #bae6fd 100%)",
    "--qa-bot-text": "#0c4a6e",
    "--qa-user-bg": "linear-gradient(145deg, #0284c7 0%, #0ea5e9 100%)",
    "--qa-user-text": "#f0f9ff",
    "--qa-header-bg": "linear-gradient(180deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.1) 24%, transparent 46%), linear-gradient(168deg, #38bdf8 0%, #0284c7 42%, #075985 100%)",
    "--qa-shadow": "0 10px 28px -6px rgba(15, 23, 42, 0.1), 0 20px 40px -14px rgba(14, 165, 233, 0.12)",
    "--qa-launcher-shadow": "0 3px 10px -2px rgba(14, 165, 233, 0.2)",
    "--qa-launcher-shadow-hover": "0 5px 14px -2px rgba(14, 165, 233, 0.28)",
    "--qa-ring-color": "#0ea5e9"
  },
  "sitePreset": {
    "common": {
      "header": {
        "title": "Receptionist",
        "subtitle": "We are online to assist you"
      },
      "botPersona": {
        "label": "Reception",
        "mode": "image",
        "imageUrl": ""
      },
      "welcome": {
        "enabled": false
      },
      "features": {
        "multiLanguage": {
          "enabled": true
        },
        "speechToText": {
          "enabled": true
        },
        "composerUpload": {
          "enabled": true
        }
      },
      "dialogflow": {
        "liveAgent": {
          "enabled": true
        },
        "forms": {
          "enabled": true
        },
        "endChatEvent": {
          "enabled": true,
          "idleTimeoutMs": 10000
        }
      }
    },
    "desk": {
      "launcherStrip": {
        "enabled": true,
        "text": "👋 Welcome! How can we help?"
      },
      "autoOpenChat": {
        "enabled": true,
        "delayMs": 10000
      },
      "restartButton": {
        "enabled": true
      },
      "poweredBy": {
        "enabled": true
      },
      "features": {
        "speechToText": {
          "enabled": true
        },
        "composerUpload": {
          "enabled": true
        },
        "restartChat": {
          "enabled": false
        }
      }
    },
    "mob": {
      "launcherStrip": {
        "enabled": true,
        "text": "👋 Welcome! How can we help?"
      },
      "autoOpenChat": {
        "enabled": true,
        "delayMs": 7000
      },
      "restartButton": {
        "enabled": true
      },
      "poweredBy": {
        "enabled": true
      },
      "features": {
        "speechToText": {
          "enabled": true
        },
        "composerUpload": {
          "enabled": true
        },
        "restartChat": {
          "enabled": true
        }
      }
    }
  }
};
})(typeof window !== 'undefined' ? window : this);
