/** UI/UX config — Green Valley (Bot ID 10002, sitePreset: greenValley) */
(function (g) {
  g.QA_BOT_PRESETS = g.QA_BOT_PRESETS || {};
  g.QA_BOT_PRESETS["greenValley"] = {
  "botId": "10002",
  "name": "Green Valley",
  "welcomeEventName": "START_GREEN_VALLEY",
  "theme": {
    "--qa-primary": "#ca8a04",
    "--qa-primary-dark": "#a16207",
    "--qa-primary-deep": "#854d0e",
    "--qa-accent": "#eab308",
    "--qa-accent-light": "#fef08a",
    "--qa-bg": "#fefce8",
    "--qa-bg-2": "#fffbeb",
    "--qa-border": "#fde68a",
    "--qa-bot-bg": "linear-gradient(168deg, #fef9c3 0%, #fde047 100%)",
    "--qa-bot-text": "#713f12",
    "--qa-user-bg": "linear-gradient(145deg, #ca8a04 0%, #eab308 100%)",
    "--qa-user-text": "#fffbeb",
    "--qa-header-bg": "linear-gradient(180deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.1) 24%, transparent 46%), linear-gradient(168deg, #fde047 0%, #ca8a04 42%, #854d0e 100%)",
    "--qa-shadow": "0 10px 28px -6px rgba(15, 23, 42, 0.1), 0 20px 40px -14px rgba(202, 138, 4, 0.12)",
    "--qa-launcher-shadow": "0 3px 10px -2px rgba(202, 138, 4, 0.2)",
    "--qa-launcher-shadow-hover": "0 5px 14px -2px rgba(202, 138, 4, 0.28)",
    "--qa-ring-color": "#eab308"
  },
  "sitePreset": {
    "common": {
      "header": {
        "title": "Green Valley",
        "subtitle": "Explore your dream home"
      },
      "botPersona": {
        "label": "Green Valley",
        "mode": "image",
        "imageUrl": ""
      },
      "welcome": {
        "enabled": false
      },
      "features": {
        "multiLanguage": {
          "enabled": false
        },
        "speechToText": {
          "enabled": true
        },
        "composerUpload": {
          "enabled": false
        }
      },
      "dialogflow": {
        "liveAgent": {
          "enabled": false
        },
        "forms": {
          "enabled": true
        },
        "endChatEvent": {
          "enabled": true,
          "idleTimeoutMs": 15000
        }
      }
    },
    "desk": {
      "launcherStrip": {
        "enabled": false
      },
      "autoOpenChat": {
        "enabled": true,
        "delayMs": 5000
      },
      "restartButton": {
        "enabled": true
      },
      "poweredBy": {
        "enabled": false
      },
      "features": {
        "speechToText": {
          "enabled": true
        },
        "composerUpload": {
          "enabled": false
        },
        "restartChat": {
          "enabled": false
        }
      }
    },
    "mob": {
      "launcherStrip": {
        "enabled": false
      },
      "autoOpenChat": {
        "enabled": true,
        "delayMs": 4000
      },
      "restartButton": {
        "enabled": true
      },
      "poweredBy": {
        "enabled": false
      },
      "features": {
        "speechToText": {
          "enabled": false
        },
        "composerUpload": {
          "enabled": false
        },
        "restartChat": {
          "enabled": true
        }
      }
    }
  }
};
})(typeof window !== 'undefined' ? window : this);
