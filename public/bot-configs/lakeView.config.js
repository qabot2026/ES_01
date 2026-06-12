/** UI/UX config — Lake View (Bot ID 10003, sitePreset: lakeView) */
(function (g) {
  g.QA_BOT_PRESETS = g.QA_BOT_PRESETS || {};
  g.QA_BOT_PRESETS["lakeView"] = {
  "botId": "10003",
  "name": "Lake View",
  "welcomeEventName": "START_LAKE_VIEW",
  "theme": {
    "--qa-primary": "#16a34a",
    "--qa-primary-dark": "#15803d",
    "--qa-primary-deep": "#166534",
    "--qa-accent": "#22c55e",
    "--qa-accent-light": "#bbf7d0",
    "--qa-bg": "#f0fdf4",
    "--qa-bg-2": "#f7fef9",
    "--qa-border": "#bbf7d0",
    "--qa-bot-bg": "linear-gradient(168deg, #dcfce7 0%, #86efac 100%)",
    "--qa-bot-text": "#14532d",
    "--qa-user-bg": "linear-gradient(145deg, #16a34a 0%, #22c55e 100%)",
    "--qa-user-text": "#f0fdf4",
    "--qa-header-bg": "linear-gradient(180deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.1) 24%, transparent 46%), linear-gradient(168deg, #4ade80 0%, #16a34a 42%, #166534 100%)",
    "--qa-shadow": "0 10px 28px -6px rgba(15, 23, 42, 0.1), 0 20px 40px -14px rgba(22, 163, 74, 0.12)",
    "--qa-launcher-shadow": "0 3px 10px -2px rgba(22, 163, 74, 0.2)",
    "--qa-launcher-shadow-hover": "0 5px 14px -2px rgba(22, 163, 74, 0.28)",
    "--qa-ring-color": "#22c55e"
  },
  "sitePreset": {
    "common": {
      "header": {
        "title": "Lake View",
        "subtitle": "Luxury lakeside living"
      },
      "botPersona": {
        "label": "Lake View",
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
          "idleTimeoutMs": 12000
        }
      }
    },
    "desk": {
      "launcherStrip": {
        "enabled": true,
        "text": "🌿 Discover Lake View homes"
      },
      "autoOpenChat": {
        "enabled": false
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
        "text": "🌿 Discover Lake View homes"
      },
      "autoOpenChat": {
        "enabled": false
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
