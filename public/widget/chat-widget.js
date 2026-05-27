(function (global) {
  'use strict';

  var ICONS = {
    bot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7v1h1a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H6a2 2 0 01-2-2v-1H3a1 1 0 01-1-1v-3a1 1 0 011-1h1v-1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z"/><circle cx="9" cy="13" r="1" fill="currentColor"/><circle cx="15" cy="13" r="1" fill="currentColor"/><path d="M9 17h6"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>',
    mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>',
    restart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
    header: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>',
  };

  function getRootCfg() {
    return (global.QA_CHAT_UI_CONFIG && global.QA_CHAT_UI_CONFIG.common) || {};
  }

  function getViewportCfg() {
    var root = global.QA_CHAT_UI_CONFIG || {};
    var mob =
      global.matchMedia && global.matchMedia('(max-width: 768px)').matches;
    return mob ? root.mob || {} : root.desk || {};
  }

  function getLangList() {
    var ml = getRootCfg().features && getRootCfg().features.multiLanguage;
    if (ml && ml.languages && ml.languages.length) return ml.languages;
    return [
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
    ];
  }

  function langMapFromList(list) {
    var map = {};
    list.forEach(function (L) {
      map[L.code] = {
        label: L.label,
        speech: L.speech || 'en-IN',
        df: L.dialogflow || L.code,
      };
    });
    return map;
  }

  function shallowMerge(base, over) {
    var out = {};
    var b = base || {};
    var o = over || {};
    Object.keys(b).forEach(function (k) {
      out[k] = b[k];
    });
    Object.keys(o).forEach(function (k) {
      out[k] = o[k];
    });
    return out;
  }

  function getLauncherStripCfg() {
    return shallowMerge(
      getRootCfg().launcherStrip || {},
      getViewportCfg().launcherStrip || {}
    );
  }

  function normalizeExternalUrl(url) {
    if (!url || typeof url !== 'string') return '';
    var trimmed = url.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return 'https://' + trimmed;
  }

  function langOptionLabel(lang) {
    return lang.nativeLabel || lang.label || lang.code;
  }

  function formatPersonaTime(persona) {
    if (!persona || !persona.showTime) return '';
    var tz = persona.timeZone || 'Asia/Kolkata';
    var opts = {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };
    if (persona.showSeconds !== false) {
      opts.second = '2-digit';
    }
    if (persona.messageTimeIncludesDate) {
      opts.day = '2-digit';
      opts.month = 'short';
    }
    try {
      return new Date().toLocaleString('en-IN', opts);
    } catch (e) {
      return new Date().toLocaleTimeString('en-IN', { hour12: true });
    }
  }

  function QualityAssistantWidget(options) {
    var common = getRootCfg();
    var header = common.header || {};
    var welcome = common.welcome || {};
    var deploy = common.deploy || {};

    this.cfg = global.QA_CHAT_UI_CONFIG || {};
    this.langList = getLangList();
    this.langMap = langMapFromList(this.langList);

    this.apiBase =
      (options && options.apiBase) ||
      (global.QA_CONFIG && global.QA_CONFIG.apiBase) ||
      deploy.publicBaseUrl ||
      '';

    this.title = header.title || 'QualityAssistant';
    this.subtitle = header.subtitle || 'Your quality & compliance guide';
    this.welcomeTitle = welcome.title || 'Welcome to ' + this.title;
    this.welcomeBody =
      welcome.body ||
      'Ask about quality standards, procedures, or compliance.';
    this.restartTitle = welcome.restartTitle || 'Conversation restarted';
    this.restartBody = welcome.restartBody || 'How can I help you today?';

    this.sessionId = this.newSessionId();
    this.language =
      (common.features &&
        common.features.multiLanguage &&
        common.features.multiLanguage.defaultLanguage) ||
      'en';
    this.isOpen = false;
    this.isSending = false;
    this.recognition = null;
    this.root = null;
    this.els = {};
    this.init();
  }

  QualityAssistantWidget.prototype.newSessionId = function () {
    return 'qa-' + Date.now() + '-' + Math.random().toString(36).slice(2, 11);
  };

  QualityAssistantWidget.prototype.init = function () {
    var vp = getViewportCfg();
    if (vp.showChatbot === false) return;

    this.root = document.createElement('div');
    this.root.className = 'qa-widget';
    this.root.innerHTML = this.template();
    document.body.appendChild(this.root);
    this.applyTheme();
    this.applyLayout();
    this.cacheElements();
    this.applyFeatureToggles();
    this.bindEvents();
    this.fetchConfig();
    this.maybeAutoOpen();
  };

  QualityAssistantWidget.prototype.applyTheme = function () {
    var common = getRootCfg();
    var theme = common.theme || {};
    var typo = common.typography || {};
    if (typo.fontFamily) {
      this.root.style.setProperty('--qa-font', typo.fontFamily);
      this.root.style.fontFamily = typo.fontFamily;
    }
    Object.keys(theme).forEach(
      function (key) {
        if (key === 'cost') return;
        this.root.style.setProperty(key, theme[key]);
      }.bind(this)
    );
    var ml = common.features && common.features.multiLanguage;
    if (ml) {
      var ch = ml.selectWidthCh != null ? ml.selectWidthCh : 10;
      var extra = ml.selectWidthExtraPx != null ? ml.selectWidthExtraPx : 5;
      this.root.style.setProperty('--qa-lang-width', 'calc(' + ch + 'ch + ' + extra + 'px)');
      if (ml.showSelectBorder === false) {
        this.root.classList.add('qa-lang--no-border');
      }
    }
    var side = (common.chatLayout && common.chatLayout.side) || 'right';
    if (side === 'left') this.root.classList.add('qa-widget--left');

    var panel = common.chatPanel && common.chatPanel.borderRadius;
    if (panel) {
      this.root.style.setProperty('--qa-panel-tl', panel.topLeft || '16px');
      this.root.style.setProperty('--qa-panel-tr', panel.topRight || '16px');
      this.root.style.setProperty('--qa-panel-bl', panel.bottomLeft || '16px');
      this.root.style.setProperty('--qa-panel-br', panel.bottomRight || '16px');
    }

    var vp = getViewportCfg();
    var iconPx =
      vp.titlebarIconSizePx ||
      (common.header && common.header.titlebarIconSizePx) ||
      44;
    this.root.style.setProperty('--qa-header-icon-size', iconPx + 'px');

    var bp = common.botPersona || {};
    var up = common.userPersona || {};
    if (bp.avatarSizePx) {
      this.root.style.setProperty('--qa-bot-avatar-size', bp.avatarSizePx + 'px');
    }
    if (up.avatarSizePx) {
      this.root.style.setProperty('--qa-user-avatar-size', up.avatarSizePx + 'px');
    }
    if (bp.gapBelowPx != null) {
      this.root.style.setProperty('--qa-bot-gap', bp.gapBelowPx + 'px');
    }

    var pb = common.poweredBy || {};
    if (pb.color) this.root.style.setProperty('--qa-powered-color', pb.color);
    if (pb.fontSizePx) {
      this.root.style.setProperty('--qa-powered-size', pb.fontSizePx + 'px');
    }
  };

  QualityAssistantWidget.prototype.applyLayout = function () {
    var vp = getViewportCfg();
    var win = vp.chatWindow || {};
    var panel = this.root.querySelector('.qa-panel');
    var launcher = this.root.querySelector('.qa-launcher');
    if (!panel) return;

    if (win.widthPx) {
      panel.style.width = win.widthPx + 'px';
      panel.style.maxWidth = win.widthPx + 'px';
    }
    if (win.heightPx) {
      panel.style.height = win.heightPx + 'px';
      panel.style.maxHeight = win.heightPx + 'px';
    } else if (win.minHeightPx) {
      panel.style.minHeight = win.minHeightPx + 'px';
      panel.style.height = 'min(92vh, ' + (win.minHeightPx + 80) + 'px)';
      panel.style.maxHeight = 'min(92vh, ' + (win.minHeightPx + 80) + 'px)';
    }
    var isMob =
      global.matchMedia && global.matchMedia('(max-width: 768px)').matches;
    if (isMob && win.horizontalInsetPx != null) {
      panel.style.width = 'calc(100vw - ' + win.horizontalInsetPx * 2 + 'px)';
      panel.style.maxWidth = 'calc(100vw - ' + win.horizontalInsetPx * 2 + 'px)';
    }

    var pos = win.position || {};
    if (pos.rightPx != null) {
      this.root.style.right = pos.rightPx + 'px';
      if (launcher) launcher.style.right = '0';
    }
    if (pos.leftPx != null) {
      this.root.style.left = pos.leftPx + 'px';
      this.root.style.right = 'auto';
    }
    if (pos.bottomPx != null) {
      this.root.style.bottom = pos.bottomPx + 'px';
    }

    var launch = getRootCfg().launcher || {};
    var hdr = getRootCfg().header || {};
    var launcherImg =
      launch.iconUrl || hdr.chatIconUrl || hdr.headerIconUrl || '';
    if (launcher) {
      if (launch.sizePx) {
        launcher.style.width = launch.sizePx + 'px';
        launcher.style.height = launch.sizePx + 'px';
      }
      if (launch.cornerRoundness) {
        launcher.style.borderRadius = launch.cornerRoundness;
      }
      if (launcherImg) {
        launcher.innerHTML =
          '<img src="' +
          launcherImg.replace(/"/g, '') +
          '" alt="" style="width:88%;height:88%;object-fit:cover;border-radius:inherit"/>';
      }
      if (launch.storyRing && launch.storyRing.enabled) {
        launcher.classList.add('qa-launcher--ring');
        var ring = launch.storyRing;
        if (ring.widthPx) {
          launcher.style.setProperty('--qa-ring-width', ring.widthPx + 'px');
        }
        if (ring.rotateSeconds) {
          launcher.style.setProperty(
            '--qa-ring-duration',
            ring.rotateSeconds + 's'
          );
        }
      }
    }

    var stripCfg = getLauncherStripCfg();
    var strip = this.root.querySelector('.qa-launcher-strip');
    if (strip && stripCfg.position) {
      if (stripCfg.position.bottomPx != null) {
        strip.style.bottom = stripCfg.position.bottomPx + 'px';
      }
      if (stripCfg.position.rightPx != null) {
        strip.style.right = stripCfg.position.rightPx + 'px';
      }
      if (stripCfg.position.leftPx != null) {
        strip.style.left = stripCfg.position.leftPx + 'px';
        strip.style.right = 'auto';
      }
    }
    if (strip && stripCfg.style) {
      var st = stripCfg.style;
      if (st.fontSizePx) strip.style.fontSize = st.fontSizePx + 'px';
      if (st.paddingXpx != null || st.paddingYpx != null) {
        strip.style.padding =
          (st.paddingYpx || 8) + 'px ' + (st.paddingXpx || 12) + 'px';
      }
      if (st.maxWidthPx) strip.style.maxWidth = st.maxWidthPx + 'px';
    }
  };

  QualityAssistantWidget.prototype.applyFeatureToggles = function () {
    var feats = (getRootCfg().features) || {};
    if (feats.speechToText && feats.speechToText.enabled === false && this.els.mic) {
      this.els.mic.style.display = 'none';
    }
    if (feats.restartChat && feats.restartChat.enabled === false && this.els.restart) {
      this.els.restart.style.display = 'none';
    }
    if (
      feats.multiLanguage &&
      feats.multiLanguage.enabled === false &&
      this.els.lang
    ) {
      this.els.lang.style.display = 'none';
    }
    var pb = getRootCfg().poweredBy;
    var powered = this.root.querySelector('.qa-powered');
    if (pb && pb.enabled === false && powered) {
      powered.style.display = 'none';
    }
  };

  QualityAssistantWidget.prototype.maybeAutoOpen = function () {
    var vp = getViewportCfg();
    var ao = vp.autoOpenChat;
    if (!ao || !ao.enabled) return;
    var self = this;
    setTimeout(function () {
      self.open();
    }, ao.delayMs || 0);
  };

  QualityAssistantWidget.prototype.template = function () {
    var common = getRootCfg();
    var header = common.header || {};
    var feats = common.features || {};
    var ml = feats.multiLanguage || {};
    var restart = feats.restartChat || {};
    var pb = common.poweredBy || {};
    var placeholders = feats.inputPlaceholderByLanguage || {};

    var langOptions = this.langList
      .map(function (L) {
        return (
          '<option value="' +
          L.code +
          '">' +
          langOptionLabel(L) +
          '</option>'
        );
      })
      .join('');

    var placeholder =
      placeholders[this.language] || placeholders.en || 'Type your message…';

    var titleIconUrl =
      header.chatTitleIconUrl || header.headerIconUrl || '';
    var headerIcon = ICONS.header;
    if (titleIconUrl) {
      headerIcon =
        '<img src="' +
        this.escape(titleIconUrl) +
        '" alt="" style="width:100%;height:100%;border-radius:12px;object-fit:cover"/>';
    } else if (header.showHeaderIcon === false) {
      headerIcon = '';
    }

    var logoSrc =
      pb.logoUrl ||
      (this.apiBase ? this.apiBase + '/widget/logo-powered.svg' : '');
    var poweredLink = normalizeExternalUrl(pb.linkUrl);
    var poweredHtml = '';
    if (pb.enabled !== false) {
      var logoImg = logoSrc
        ? '<img class="qa-powered__logo" src="' +
          this.escape(logoSrc) +
          '" alt="" width="90" height="18" onerror="this.style.display=\'none\'"/>'
        : '';
      var logoBlock = logoImg;
      if (logoImg && poweredLink) {
        logoBlock =
          '<a class="qa-powered__logo-link" href="' +
          this.escape(poweredLink) +
          '" target="_blank" rel="noopener noreferrer" aria-label="' +
          this.escape(pb.brandName || 'QualityAssistant') +
          '">' +
          logoImg +
          '</a>';
      }
      var brandName = pb.brandName || 'QualityAssistant';
      var brandBlock =
        '<strong class="qa-powered__brand">' +
        this.escape(brandName) +
        '</strong>';
      if (poweredLink) {
        brandBlock =
          '<a class="qa-powered__brand-link" href="' +
          this.escape(poweredLink) +
          '" target="_blank" rel="noopener noreferrer">' +
          brandBlock +
          '</a>';
      }
      var inner =
        '<span>' +
        this.escape(pb.prefix || 'Powered by') +
        '</span>' +
        logoBlock +
        brandBlock;
      poweredHtml = '<div class="qa-powered">' + inner + '</div>';
    }

    var stripCfg = getLauncherStripCfg();
    var stripHtml = '';
    if (stripCfg.enabled !== false && stripCfg.text) {
      stripHtml =
        '<div class="qa-launcher-strip" role="note">' +
        this.escape(stripCfg.text) +
        '</div>';
    }

    return (
      stripHtml +
      '<button type="button" class="qa-launcher" aria-label="Open chat">' +
      (common.launcher && common.launcher.iconUrl ? '' : ICONS.chat) +
      '</button>' +
      '<div class="qa-panel" role="dialog" aria-label="' +
      this.escape(this.title) +
      ' chat">' +
      '<header class="qa-header">' +
      (headerIcon
        ? '<div class="qa-header__icon" aria-hidden="true">' + headerIcon + '</div>'
        : '') +
      '<div class="qa-header__text">' +
      '<h2 class="qa-header__title">' +
      this.escape(this.title) +
      '</h2>' +
      '<p class="qa-header__subtitle">' +
      this.escape(this.subtitle) +
      '</p></div>' +
      '<button type="button" class="qa-header__close" aria-label="Close chat">' +
      ICONS.close +
      '</button></header>' +
      '<div class="qa-messages" role="log" aria-live="polite">' +
      '<div class="qa-welcome"><strong>' +
      this.escape(this.welcomeTitle) +
      '</strong>' +
      this.escape(this.welcomeBody) +
      '</div></div>' +
      '<footer class="qa-footer">' +
      '<div class="qa-input-row">' +
      '<textarea class="qa-input" rows="1" placeholder="' +
      this.escape(placeholder) +
      '" aria-label="Message"></textarea>' +
      '<button type="button" class="qa-mic" aria-label="Speech to text">' +
      ICONS.mic +
      '</button>' +
      '<button type="button" class="qa-send" aria-label="Send message">' +
      ICONS.send +
      '</button></div>' +
      '<div class="qa-toolbar">' +
      (ml.enabled !== false
        ? '<select class="qa-lang" aria-label="Language">' + langOptions + '</select>'
        : '') +
      (restart.enabled !== false
        ? '<button type="button" class="qa-restart">' +
          ICONS.restart +
          ' ' +
          this.escape(restart.label || 'Restart') +
          '</button>'
        : '') +
      '</div>' +
      poweredHtml +
      '<p class="qa-error" hidden></p></footer></div>'
    );
  };

  QualityAssistantWidget.prototype.cacheElements = function () {
    this.els = {
      launcher: this.root.querySelector('.qa-launcher'),
      panel: this.root.querySelector('.qa-panel'),
      close: this.root.querySelector('.qa-header__close'),
      messages: this.root.querySelector('.qa-messages'),
      input: this.root.querySelector('.qa-input'),
      send: this.root.querySelector('.qa-send'),
      mic: this.root.querySelector('.qa-mic'),
      lang: this.root.querySelector('.qa-lang'),
      restart: this.root.querySelector('.qa-restart'),
      error: this.root.querySelector('.qa-error'),
      welcome: this.root.querySelector('.qa-welcome'),
    };
    if (this.els.lang) this.els.lang.value = this.language;
  };

  QualityAssistantWidget.prototype.bindEvents = function () {
    var self = this;
    var feats = getRootCfg().features || {};
    var placeholders = feats.inputPlaceholderByLanguage || {};

    this.els.launcher.addEventListener('click', function () {
      self.open();
    });
    this.els.close.addEventListener('click', function () {
      self.close();
    });
    this.els.send.addEventListener('click', function () {
      self.sendMessage();
    });
    this.els.input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        self.sendMessage();
      }
    });
    this.els.input.addEventListener('input', function () {
      self.els.input.style.height = 'auto';
      self.els.input.style.height =
        Math.min(self.els.input.scrollHeight, 100) + 'px';
    });
    if (this.els.lang) {
      this.els.lang.addEventListener('change', function () {
        self.language = self.els.lang.value;
        var ph =
          placeholders[self.language] || placeholders.en || self.els.input.placeholder;
        self.els.input.placeholder = ph;
      });
    }
    if (this.els.restart) {
      this.els.restart.addEventListener('click', function () {
        self.restart();
      });
    }
    if (this.els.mic) {
      this.els.mic.addEventListener('click', function () {
        self.toggleSpeech();
      });
    }
  };

  QualityAssistantWidget.prototype.fetchConfig = function () {
    var self = this;
    if (!this.apiBase) return;
    fetch(this.apiBase + '/api/config')
      .then(function (r) {
        return r.json();
      })
      .then(function (cfg) {
        if (cfg.title) {
          self.title = cfg.title;
          var t = self.root.querySelector('.qa-header__title');
          if (t) t.textContent = cfg.title;
        }
        if (cfg.subtitle) {
          self.subtitle = cfg.subtitle;
          var s = self.root.querySelector('.qa-header__subtitle');
          if (s) s.textContent = cfg.subtitle;
        }
        if (!cfg.dialogflowReady) {
          self.showError(
            'Server credentials missing. Set GOOGLE_CREDENTIALS_JSON on Railway.'
          );
        }
      })
      .catch(function () {});
  };

  QualityAssistantWidget.prototype.open = function () {
    this.isOpen = true;
    this.els.panel.classList.add('qa-panel--open');
    this.els.launcher.classList.add('qa-launcher--hidden');
    var strip = this.root.querySelector('.qa-launcher-strip');
    if (strip) strip.classList.add('qa-launcher-strip--hidden');
    this.els.input.focus();
  };

  QualityAssistantWidget.prototype.close = function () {
    this.isOpen = false;
    this.els.panel.classList.remove('qa-panel--open');
    this.els.launcher.classList.remove('qa-launcher--hidden');
    var strip = this.root.querySelector('.qa-launcher-strip');
    if (strip) strip.classList.remove('qa-launcher-strip--hidden');
    this.stopSpeech();
  };

  QualityAssistantWidget.prototype.restart = function () {
    this.sessionId = this.newSessionId();
    this.els.messages.innerHTML =
      '<div class="qa-welcome"><strong>' +
      this.escape(this.restartTitle) +
      '</strong>' +
      this.escape(this.restartBody) +
      '</div>';
    this.els.welcome = this.root.querySelector('.qa-welcome');
    this.hideError();
    this.els.input.focus();
  };

  QualityAssistantWidget.prototype.botAvatarHtml = function () {
    var bp = getRootCfg().botPersona || {};
    if (bp.mode === 'image' && bp.imageUrl) {
      return (
        '<img src="' +
        this.escape(bp.imageUrl) +
        '" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover"/>'
      );
    }
    if (bp.label && bp.mode !== 'icon') {
      return '<span style="font-size:0.65rem;font-weight:700">' + this.escape(bp.label) + '</span>';
    }
    return ICONS.bot;
  };

  QualityAssistantWidget.prototype.userAvatarHtml = function () {
    return ICONS.user;
  };

  QualityAssistantWidget.prototype.buildPersonaRow = function (role) {
    var bp = getRootCfg().botPersona || {};
    var up = getRootCfg().userPersona || {};
    var p = role === 'bot' ? bp : up;
    var name =
      p.label || (role === 'bot' ? 'Quality' : 'You');
    var timeStr = formatPersonaTime(p);

    var row = document.createElement('div');
    row.className = 'qa-msg__persona-row';

    var avatar = document.createElement('div');
    avatar.className = 'qa-msg__avatar qa-msg__avatar--' + role;
    if (role === 'bot' && bp.mode === 'image' && bp.imageUrl) {
      avatar.classList.add('qa-msg__avatar--image');
    }
    if (role === 'user') {
      avatar.classList.add('qa-msg__avatar--sm');
    }
    avatar.setAttribute('aria-hidden', 'true');
    avatar.innerHTML =
      role === 'bot' ? this.botAvatarHtml() : this.userAvatarHtml();

    var meta = document.createElement('div');
    meta.className = 'qa-msg__persona-meta';

    var nameEl = document.createElement('span');
    nameEl.className = 'qa-msg__persona-name';
    nameEl.textContent = name;
    meta.appendChild(nameEl);

    if (timeStr) {
      var timeEl = document.createElement('span');
      timeEl.className = 'qa-msg__persona-time';
      timeEl.textContent = timeStr;
      meta.appendChild(timeEl);
    }

    row.appendChild(avatar);
    row.appendChild(meta);
    return row;
  };

  QualityAssistantWidget.prototype.appendMessage = function (role, text) {
    if (this.els.welcome) {
      this.els.welcome.remove();
      this.els.welcome = null;
    }
    var row = document.createElement('div');
    row.className = 'qa-msg qa-msg--' + role;
    var body = document.createElement('div');
    body.className = 'qa-msg__body';
    body.appendChild(this.buildPersonaRow(role));
    var bubble = document.createElement('div');
    bubble.className = 'qa-msg__bubble';
    bubble.textContent = text;
    body.appendChild(bubble);
    row.appendChild(body);
    this.els.messages.appendChild(row);
    this.els.messages.scrollTop = this.els.messages.scrollHeight;
    return row;
  };

  QualityAssistantWidget.prototype.showTyping = function () {
    var self = this;
    var header = getRootCfg().header || {};
    var baseText = header.botWritingText || 'Typing';
    var interval = header.botWritingDotsIntervalMs || 480;
    var row = document.createElement('div');
    row.className = 'qa-msg qa-msg--bot qa-msg--typing-indicator';
    var body = document.createElement('div');
    body.className = 'qa-msg__body';
    body.appendChild(this.buildPersonaRow('bot'));
    var bubble = document.createElement('div');
    bubble.className = 'qa-msg__bubble qa-msg__typing-text';
    bubble.textContent = baseText;
    body.appendChild(bubble);
    row.appendChild(body);
    var dots = 0;
    row._typingTimer = setInterval(function () {
      dots = (dots + 1) % 4;
      bubble.textContent = baseText + '.'.repeat(dots);
    }, interval);
    this.els.messages.appendChild(row);
    this.els.messages.scrollTop = this.els.messages.scrollHeight;
    row._stopTyping = function () {
      if (row._typingTimer) clearInterval(row._typingTimer);
    };
    return row;
  };

  QualityAssistantWidget.prototype.sendMessage = function () {
    var text = (this.els.input.value || '').trim();
    if (!text || this.isSending) return;
    var self = this;
    this.hideError();
    this.appendMessage('user', text);
    this.els.input.value = '';
    this.els.input.style.height = 'auto';
    this.isSending = true;
    this.els.send.disabled = true;
    var typing = this.showTyping();
    var langCode = this.langMap[this.language]
      ? this.langMap[this.language].df
      : 'en';

    fetch(this.apiBase + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        sessionId: this.sessionId,
        languageCode: langCode,
      }),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (result) {
        if (typing._stopTyping) typing._stopTyping();
        typing.remove();
        if (result.ok && result.data.reply) {
          if (result.data.sessionId) self.sessionId = result.data.sessionId;
          self.appendMessage('bot', result.data.reply);
        } else {
          self.appendMessage(
            'bot',
            result.data.message ||
              'Sorry, I could not connect right now. Please try again.'
          );
          if (result.data.message) self.showError(result.data.message);
        }
      })
      .catch(function () {
        if (typing._stopTyping) typing._stopTyping();
        typing.remove();
        self.appendMessage(
          'bot',
          'Network error. Check your connection and try again.'
        );
        self.showError('Could not reach chat server.');
      })
      .finally(function () {
        self.isSending = false;
        self.els.send.disabled = false;
      });
  };

  QualityAssistantWidget.prototype.toggleSpeech = function () {
    var stt = getRootCfg().features && getRootCfg().features.speechToText;
    if (stt && stt.enabled === false) return;

    if (this.recognition) {
      this.stopSpeech();
      return;
    }
    var SpeechRecognition =
      global.SpeechRecognition || global.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.showError(
        'Speech-to-text is not supported in this browser. Use Chrome or Edge.'
      );
      return;
    }
    var self = this;
    var lang = this.langMap[this.language]
      ? this.langMap[this.language].speech
      : 'en-IN';
    this.recognition = new SpeechRecognition();
    this.recognition.lang = lang;
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;
    this.els.mic.classList.add('qa-mic--active');
    this.recognition.onresult = function (e) {
      var transcript = e.results[0][0].transcript;
      self.els.input.value = (self.els.input.value + ' ' + transcript).trim();
      self.els.input.dispatchEvent(new Event('input'));
    };
    this.recognition.onerror = function () {
      self.showError('Could not capture speech. Check microphone permission.');
      self.stopSpeech();
    };
    this.recognition.onend = function () {
      self.stopSpeech();
    };
    this.recognition.start();
  };

  QualityAssistantWidget.prototype.stopSpeech = function () {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
      this.recognition = null;
    }
    if (this.els.mic) this.els.mic.classList.remove('qa-mic--active');
  };

  QualityAssistantWidget.prototype.showError = function (msg) {
    this.els.error.textContent = msg;
    this.els.error.hidden = false;
  };

  QualityAssistantWidget.prototype.hideError = function () {
    this.els.error.hidden = true;
    this.els.error.textContent = '';
  };

  QualityAssistantWidget.prototype.escape = function (s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  };

  global.QualityAssistantWidget = QualityAssistantWidget;
})(typeof window !== 'undefined' ? window : this);
