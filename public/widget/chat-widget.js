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

  var QA_RING_GRADIENT_INSTAGRAM =
    'conic-gradient(from 180deg, #f09433 0deg, #e6683c 72deg, #dc2743 144deg, #cc2366 216deg, #bc1888 252deg, #833ab4 288deg, #5851db 324deg, #405de6 360deg, #f09433 360deg)';

  function getStoryRingGradient(ring) {
    if (ring && ring.gradient) return ring.gradient;
    if (ring && ring.instagramStyle === true) return QA_RING_GRADIENT_INSTAGRAM;
    var theme = getRootCfg().theme || {};
    var c1 = theme['--qa-ring-color'] || '#0ea5e9';
    var c2 = theme['--qa-accent'] || '#0ea5e9';
    var c3 = theme['--qa-primary'] || '#0284c7';
    var c4 = theme['--qa-primary-dark'] || '#0369a1';
    var c5 = theme['--qa-primary-deep'] || '#075985';
    return (
      'conic-gradient(from 0deg, ' +
      c1 +
      ' 0deg, ' +
      c2 +
      ' 72deg, ' +
      c3 +
      ' 144deg, ' +
      c4 +
      ' 216deg, ' +
      c5 +
      ' 288deg, ' +
      c1 +
      ' 360deg)'
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

  function isWelcomeEnabled() {
    var welcome = getRootCfg().welcome || {};
    return welcome.enabled !== false;
  }

  function getWelcomeEventCfg() {
    var df = getRootCfg().dialogflow || {};
    return df.welcomeEvent || {};
  }

  function getEndChatEventCfg() {
    var df = getRootCfg().dialogflow || {};
    return df.endChatEvent || {};
  }

  function isRichContentEnabled() {
    var df = getRootCfg().dialogflow || {};
    var rc = df.richContentChips || {};
    return rc.enabled !== false;
  }

  /** 'chips' | 'dropdown' — how payload options are shown */
  function getInlineSelectDisplay() {
    var rc = (getRootCfg().dialogflow || {}).richContentChips || {};
    var mode = String((rc.inlineSelect && rc.inlineSelect.display) || 'chips')
      .toLowerCase()
      .trim();
    return mode === 'dropdown' ? 'dropdown' : 'chips';
  }

  function getWelcomeChips() {
    if (!isWelcomeEnabled()) return [];
    var welcome = getRootCfg().welcome || {};
    var chips = welcome.suggestionChips;
    if (!chips || chips.enabled === false) return [];
    var items = Array.isArray(chips) ? chips : chips.items || [];
    return items
      .map(function (c) {
        if (typeof c === 'string') return { label: c, message: c };
        return {
          label: c.label || c.message || '',
          message: c.message || c.label || '',
        };
      })
      .filter(function (c) {
        return c.label && c.message;
      });
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
    /* Use ?? so empty string "" in config is kept (|| wrongly showed defaults). */
    this.welcomeTitle =
      welcome.title ?? 'Welcome to ' + this.title;
    this.welcomeBody =
      welcome.body ??
      'Ask about quality standards, procedures, or compliance.';
    this.restartTitle = welcome.restartTitle ?? 'Conversation restarted';
    this.restartBody = welcome.restartBody ?? 'How can I help you today?';

    this.sessionId = this.newSessionId();
    this.language =
      (common.features &&
        common.features.multiLanguage &&
        common.features.multiLanguage.defaultLanguage) ||
      'en';
    this.isOpen = false;
    this.isSending = false;
    this._welcomeEventSent = false;
    this._welcomeEventInFlight = false;
    this._endChatEventSent = false;
    this._endChatEventInFlight = false;
    this._endChatCloseTimer = null;
    this._idleTimer = null;
    this._idleActivityAt = 0;
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

    var pd = common.personaDisplay || {};
    if (pd.nameFontSizePx != null) {
      this.root.style.setProperty(
        '--qa-persona-name-size',
        pd.nameFontSizePx + 'px'
      );
    }
    if (pd.timeFontSizePx != null) {
      this.root.style.setProperty(
        '--qa-persona-time-size',
        pd.timeFontSizePx + 'px'
      );
    }
    if (pd.blurPx != null) {
      this.root.style.setProperty('--qa-persona-blur', pd.blurPx + 'px');
    }
    if (pd.opacity != null) {
      this.root.style.setProperty('--qa-persona-meta-opacity', String(pd.opacity));
    }

    var pb = common.poweredBy || {};
    if (pb.color) this.root.style.setProperty('--qa-powered-color', pb.color);
    if (pb.fontSizePx) {
      this.root.style.setProperty('--qa-powered-size', pb.fontSizePx + 'px');
    }

    var rc = common.dialogflow && common.dialogflow.richContentChips;
    var imgCfg = (rc && rc.infoCardImage) || {};
    if (imgCfg.cardWidthPx != null) {
      this.root.style.setProperty(
        '--qa-rich-card-width',
        imgCfg.cardWidthPx + 'px'
      );
    }
    if (imgCfg.imageMaxHeightPx != null) {
      this.root.style.setProperty(
        '--qa-rich-card-img-max-height',
        imgCfg.imageMaxHeightPx + 'px'
      );
    }
    if (imgCfg.imageHeightPx != null) {
      this.root.style.setProperty(
        '--qa-rich-card-img-height',
        imgCfg.imageHeightPx + 'px'
      );
    }
    if (imgCfg.objectFit) {
      this.root.style.setProperty('--qa-rich-card-img-fit', imgCfg.objectFit);
    }
    if (imgCfg.background) {
      this.root.style.setProperty('--qa-rich-card-img-bg', imgCfg.background);
    }

    var galCfg = (rc && rc.galleryImage) || {};
    if (galCfg.itemWidthPx != null) {
      this.root.style.setProperty(
        '--qa-gallery-item-width',
        galCfg.itemWidthPx + 'px'
      );
    }
    if (galCfg.itemMaxWidthVw != null) {
      this.root.style.setProperty(
        '--qa-gallery-item-max-vw',
        galCfg.itemMaxWidthVw + 'vw'
      );
    }
    if (galCfg.imageHeightPx != null) {
      this.root.style.setProperty(
        '--qa-gallery-img-height',
        galCfg.imageHeightPx + 'px'
      );
    }
    if (galCfg.objectFit) {
      this.root.style.setProperty('--qa-gallery-img-fit', galCfg.objectFit);
    }
    if (galCfg.background) {
      this.root.style.setProperty('--qa-gallery-img-bg', galCfg.background);
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
          '" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:inherit"/>';
      }
    }
    var wrap = this.root.querySelector('.qa-launcher-wrap');
    if (wrap && launch.storyRing && launch.storyRing.enabled) {
      wrap.classList.add('qa-launcher-wrap--ring');
      var ring = launch.storyRing;
      var ringW = ring.widthPx != null ? ring.widthPx : 2.5;
      wrap.style.setProperty('--qa-ring-width', ringW + 'px');
      wrap.style.setProperty('--qa-ring-gradient', getStoryRingGradient(ring));
      if (ring.instagramStyle === true) {
        wrap.classList.add('qa-launcher-wrap--ring-ig');
      } else {
        wrap.classList.add('qa-launcher-wrap--ring-brand');
      }
      var motionOn =
        ring.colorRingMotionEnabled !== false &&
        ring.rotateSeconds > 0;
      if (motionOn) {
        wrap.classList.add('qa-launcher-wrap--ring-spin');
        wrap.style.setProperty(
          '--qa-ring-duration',
          ring.rotateSeconds + 's'
        );
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
      '<div class="qa-launcher-wrap">' +
      '<span class="qa-launcher-ring-bg" aria-hidden="true"></span>' +
      '<button type="button" class="qa-launcher" aria-label="Open chat">' +
      (common.launcher && common.launcher.iconUrl ? '' : ICONS.chat) +
      '</button></div>' +
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
      this.buildWelcomeHtml(this.welcomeTitle, this.welcomeBody) +
      '</div>' +
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
      launcherWrap: this.root.querySelector('.qa-launcher-wrap'),
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
      self.noteUserActivity();
    });
    this.els.input.addEventListener('keydown', function () {
      self.noteUserActivity();
    });
    if (this.els.panel) {
      var panelActivity = function () {
        self.noteUserActivity();
      };
      this.els.panel.addEventListener('mousedown', panelActivity);
      this.els.panel.addEventListener('touchstart', panelActivity, { passive: true });
      this.els.panel.addEventListener('scroll', panelActivity, true);
    }
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
    this.els.messages.addEventListener('click', function (e) {
      var chip = e.target.closest('.qa-chip[data-message]');
      if (!chip || self.isSending) return;
      var msg = chip.getAttribute('data-message');
      if (msg) self.sendMessageWithText(msg);
    });
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
        /* Title/subtitle: edit company.config.js → common.header (not /api/config). */
        if (!cfg.dialogflowReady) {
          self.showError(
            'Server credentials missing. Set GOOGLE_CREDENTIALS_JSON on Railway.'
          );
        }
      })
      .catch(function () {});
  };

  QualityAssistantWidget.prototype.getDialogflowLang = function () {
    return this.langMap[this.language]
      ? this.langMap[this.language].df
      : 'en';
  };

  QualityAssistantWidget.prototype.applyDialogflowResult = function (result) {
    if (!result.ok) {
      this.appendMessage(
        'bot',
        result.data.message ||
          'Sorry, I could not connect right now. Please try again.'
      );
      if (result.data.message) this.showError(result.data.message);
      return;
    }
    if (result.data.sessionId) this.sessionId = result.data.sessionId;
    var richOn = isRichContentEnabled();
    var chips = richOn && result.data.chips ? result.data.chips : [];
    var infoCards = richOn && result.data.infoCards ? result.data.infoCards : [];
    var downloads = richOn && result.data.downloads ? result.data.downloads : [];
    var dropdowns = result.data.dropdowns || [];
    var galleries = result.data.galleries || [];
    var reply = (result.data.reply || '').trim();
    var replyParts = result.data.replyParts || [];
    var chipHeading = (result.data.chipHeading || '').trim();
    if (
      reply ||
      replyParts.length ||
      chips.length ||
      chipHeading ||
      infoCards.length ||
      downloads.length ||
      dropdowns.length ||
      galleries.length
    ) {
      this.appendMessage('bot', reply, {
        replyParts: replyParts,
        chips: chips,
        chipHeading: chipHeading,
        infoCards: infoCards,
        downloads: downloads,
        dropdowns: dropdowns,
        galleries: galleries,
      });
    }
  };

  QualityAssistantWidget.prototype.postToDialogflow = function (body, opts) {
    opts = opts || {};
    var self = this;
    if (!this.apiBase) {
      return Promise.resolve();
    }
    if (opts.skipIfSending && this.isSending) {
      return Promise.resolve();
    }
    if (!opts.silent && this.isSending) {
      return Promise.resolve();
    }

    var showTyping = opts.showTyping !== false && !opts.silent;
    var applyResponse = opts.applyResponse !== false && !opts.silent;

    if (!opts.silent) {
      this.hideError();
      this.isSending = true;
      this.els.send.disabled = true;
    }
    var typing = showTyping ? this.showTyping() : null;

    return fetch(this.apiBase + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (result) {
        if (typing) {
          if (typing._stopTyping) typing._stopTyping();
          typing.remove();
        }
        if (applyResponse) self.applyDialogflowResult(result);
      })
      .catch(function () {
        if (typing) {
          if (typing._stopTyping) typing._stopTyping();
          typing.remove();
        }
        if (applyResponse) {
          self.appendMessage(
            'bot',
            'Network error. Check your connection and try again.'
          );
          self.showError('Could not reach chat server.');
        }
      })
      .finally(function () {
        if (!opts.silent) {
          self.isSending = false;
          self.els.send.disabled = false;
        }
        if (self.isOpen) self.resetIdleTimer();
      });
  };

  QualityAssistantWidget.prototype.triggerWelcomeEvent = function () {
    var cfg = getWelcomeEventCfg();
    if (cfg.enabled === false) return;
    if (this._welcomeEventSent || this._welcomeEventInFlight || this.isSending) {
      return;
    }
    var name = (cfg.eventName || 'FRESH').trim();
    if (!name) return;
    var self = this;
    this._welcomeEventInFlight = true;
    this.postToDialogflow({
      event: name,
      sessionId: this.sessionId,
      languageCode: this.getDialogflowLang(),
    }).finally(function () {
      self._welcomeEventInFlight = false;
      self._welcomeEventSent = true;
    });
  };

  QualityAssistantWidget.prototype.triggerEndChatEvent = function (opts) {
    opts = opts || {};
    var cfg = getEndChatEventCfg();
    if (cfg.enabled === false) return Promise.resolve();
    if (this._endChatEventInFlight) return Promise.resolve();
    if (cfg.triggerOncePerSession && this._endChatEventSent) {
      return Promise.resolve();
    }

    var name = (cfg.eventName || 'ENDCHAT').trim();
    if (!name) return Promise.resolve();

    var self = this;
    var showBotResponse = cfg.showBotResponse !== false;
    this._endChatEventInFlight = true;

    return this.postToDialogflow(
      {
        event: name,
        sessionId: this.sessionId,
        languageCode: this.getDialogflowLang(),
      },
      {
        silent: !showBotResponse,
        showTyping: showBotResponse,
        applyResponse: showBotResponse,
        skipIfSending: false,
      }
    )
      .finally(function () {
        self._endChatEventInFlight = false;
        self._endChatEventSent = true;
      });
  };

  QualityAssistantWidget.prototype.getIdleTimeoutMs = function () {
    var cfg = getEndChatEventCfg();
    if (cfg.idleTimeoutMs != null) {
      return Math.max(0, parseInt(cfg.idleTimeoutMs, 10) || 0);
    }
    return 20000;
  };

  QualityAssistantWidget.prototype.clearIdleTimer = function () {
    if (this._idleTimer) {
      clearTimeout(this._idleTimer);
      this._idleTimer = null;
    }
  };

  QualityAssistantWidget.prototype.noteUserActivity = function () {
    var cfg = getEndChatEventCfg();
    if (cfg.enabled === false || cfg.triggerOnIdle === false) return;
    if (!this.isOpen) return;
    var now = Date.now();
    if (now - this._idleActivityAt < 800) return;
    this._idleActivityAt = now;
    this.resetIdleTimer();
  };

  QualityAssistantWidget.prototype.resetIdleTimer = function () {
    var cfg = getEndChatEventCfg();
    if (cfg.enabled === false || cfg.triggerOnIdle === false) return;
    if (!this.isOpen) return;
    if (cfg.triggerOncePerSession && this._endChatEventSent) return;

    var ms = this.getIdleTimeoutMs();
    if (ms <= 0) return;

    var self = this;
    this.clearIdleTimer();
    this._idleTimer = setTimeout(function () {
      self._idleTimer = null;
      self.onUserIdle();
    }, ms);
  };

  QualityAssistantWidget.prototype.onUserIdle = function () {
    var cfg = getEndChatEventCfg();
    if (cfg.enabled === false || cfg.triggerOnIdle === false) return;
    if (!this.isOpen) return;
    if (cfg.triggerOncePerSession && this._endChatEventSent) return;
    if (this.isSending || this._endChatEventInFlight) {
      this.resetIdleTimer();
      return;
    }

    var self = this;
    this.triggerEndChatEvent().finally(function () {
      if (cfg.closePanelAfterEnd === true) {
        self.scheduleFinishClose();
      }
    });
  };

  QualityAssistantWidget.prototype.finishClose = function () {
    this.clearIdleTimer();
    this.isOpen = false;
    this.els.panel.classList.remove('qa-panel--open');
    if (this.els.launcherWrap) {
      this.els.launcherWrap.classList.remove('qa-launcher--hidden');
    }
    var strip = this.root.querySelector('.qa-launcher-strip');
    if (strip) strip.classList.remove('qa-launcher-strip--hidden');
    this.stopSpeech();
  };

  QualityAssistantWidget.prototype.maybeTriggerWelcomeEvent = function () {
    var cfg = getWelcomeEventCfg();
    if (cfg.enabled === false || cfg.triggerOnChatOpen === false) return;
    if (this._welcomeEventSent || this._welcomeEventInFlight) return;
    var self = this;
    setTimeout(function () {
      self.triggerWelcomeEvent();
    }, 0);
  };

  QualityAssistantWidget.prototype.open = function () {
    this.isOpen = true;
    this.els.panel.classList.add('qa-panel--open');
    if (this.els.launcherWrap) {
      this.els.launcherWrap.classList.add('qa-launcher--hidden');
    }
    var strip = this.root.querySelector('.qa-launcher-strip');
    if (strip) strip.classList.add('qa-launcher-strip--hidden');
    this.els.input.focus();
    this.maybeTriggerWelcomeEvent();
    this.resetIdleTimer();
  };

  QualityAssistantWidget.prototype.scheduleFinishClose = function () {
    var self = this;
    var cfg = getEndChatEventCfg();
    if (cfg.closePanelAfterEnd !== true) {
      self.finishClose();
      return;
    }
    var delay = 0;
    if (cfg.showBotResponse !== false && cfg.closePanelAfterMs != null) {
      delay = Math.max(0, parseInt(cfg.closePanelAfterMs, 10) || 0);
    }
    if (self._endChatCloseTimer) {
      clearTimeout(self._endChatCloseTimer);
      self._endChatCloseTimer = null;
    }
    if (delay > 0) {
      self._endChatCloseTimer = setTimeout(function () {
        self._endChatCloseTimer = null;
        self.finishClose();
      }, delay);
      return;
    }
    self.finishClose();
  };

  QualityAssistantWidget.prototype.close = function () {
    var self = this;
    var cfg = getEndChatEventCfg();
    var shouldEnd =
      cfg.enabled !== false &&
      cfg.triggerOnChatClose !== false &&
      !(cfg.triggerOncePerSession && this._endChatEventSent);

    if (shouldEnd && !this._endChatEventInFlight) {
      this.triggerEndChatEvent().finally(function () {
        self.scheduleFinishClose();
      });
      return;
    }
    this.finishClose();
  };

  QualityAssistantWidget.prototype.restart = function () {
    var self = this;
    var endCfg = getEndChatEventCfg();
    var runRestart = function () {
      self.sessionId = self.newSessionId();
      self._welcomeEventSent = false;
      self._welcomeEventInFlight = false;
      self._endChatEventSent = false;
      self._endChatEventInFlight = false;
      self.els.messages.innerHTML = self.buildWelcomeHtml(
        self.restartTitle,
        self.restartBody
      );
      self.els.welcome = isWelcomeEnabled()
        ? self.root.querySelector('.qa-welcome')
        : null;
      self.hideError();
      self.els.input.focus();
      var ev = getWelcomeEventCfg();
      if (ev.enabled !== false && ev.triggerOnRestart !== false) {
        self.triggerWelcomeEvent();
      }
      self.resetIdleTimer();
    };

    this.clearIdleTimer();
    if (
      endCfg.enabled !== false &&
      endCfg.triggerOnRestart !== false &&
      !this._endChatEventInFlight
    ) {
      this.triggerEndChatEvent().finally(runRestart);
      return;
    }
    runRestart();
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

  QualityAssistantWidget.prototype.buildWelcomeHtml = function (title, body) {
    if (!isWelcomeEnabled()) return '';
    var titleStr = (title == null ? '' : String(title)).trim();
    var bodyStr = (body == null ? '' : String(body)).trim();
    var chips = getWelcomeChips();
    if (!titleStr && !bodyStr && !chips.length) return '';
    var html = '<div class="qa-welcome">';
    if (titleStr) {
      html += '<strong>' + this.escape(titleStr) + '</strong>';
    }
    if (bodyStr) {
      html += this.escape(bodyStr);
    }
    if (chips.length) {
      html +=
        '<div class="qa-welcome-chips" role="group" aria-label="Suggested questions">';
      var self = this;
      chips.forEach(function (c) {
        html +=
          '<button type="button" class="qa-chip" data-message="' +
          self.escape(c.message) +
          '">' +
          self.escape(c.label) +
          '</button>';
      });
      html += '</div>';
    }
    html += '</div>';
    return html;
  };

  QualityAssistantWidget.prototype.buildInfoCardsEl = function (cards) {
    var wrap = document.createElement('div');
    wrap.className = 'qa-rich-cards';
    wrap.setAttribute('role', 'list');
    var self = this;

    cards.forEach(function (card) {
      var article = document.createElement('article');
      article.className = 'qa-rich-card';
      article.setAttribute('role', 'listitem');

      if (card.imageUrl) {
        var imgWrap = document.createElement('div');
        imgWrap.className = 'qa-rich-card__media';
        var img = document.createElement('img');
        img.className = 'qa-rich-card__img';
        img.src = card.imageUrl;
        img.alt = card.title || '';
        img.loading = 'lazy';
        img.onerror = function () {
          imgWrap.style.display = 'none';
        };
        if (card.actionLink) {
          var imgLink = document.createElement('a');
          imgLink.href = card.actionLink;
          imgLink.target = '_blank';
          imgLink.rel = 'noopener noreferrer';
          imgLink.appendChild(img);
          imgWrap.appendChild(imgLink);
        } else {
          imgWrap.appendChild(img);
        }
        article.appendChild(imgWrap);
      }

      if (card.title) {
        var titleEl = document.createElement('div');
        titleEl.className = 'qa-rich-card__title';
        titleEl.textContent = card.title;
        article.appendChild(titleEl);
      }

      if (card.subtitle) {
        var subEl = document.createElement('div');
        subEl.className = 'qa-rich-card__subtitle';
        subEl.textContent = card.subtitle;
        article.appendChild(subEl);
      }

      if (card.body) {
        var bodyEl = document.createElement('div');
        bodyEl.className = 'qa-rich-card__body';
        bodyEl.textContent = card.body;
        article.appendChild(bodyEl);
      }

      var buttons = card.buttons || [];
      if (buttons.length) {
        var actions = document.createElement('div');
        actions.className = 'qa-rich-card__actions';
        buttons.forEach(function (btn) {
          var label = btn.label || '';
          if (!label) return;
          if (
            btn.href &&
            btn.download &&
            self.appendDownloadLink(actions, {
              href: btn.href,
              label: label,
              download: true,
              fileName: btn.fileName || label,
            })
          ) {
            /* download link */
          } else if (btn.href) {
            var link = document.createElement('a');
            link.className = 'qa-chip qa-chip--bot qa-chip--link';
            link.href = btn.href;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = label;
            actions.appendChild(link);
          } else {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'qa-chip qa-chip--bot';
            b.setAttribute('data-message', btn.message || label);
            b.textContent = label;
            actions.appendChild(b);
          }
        });
        if (actions.childNodes.length) article.appendChild(actions);
      }

      wrap.appendChild(article);
    });

    return wrap;
  };

  QualityAssistantWidget.prototype.createDownloadLink = function (entry) {
    var a = document.createElement('a');
    a.className = 'qa-download-btn';
    a.href = entry.href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    var fileName = entry.fileName || entry.label || '';
    if (fileName) a.setAttribute('download', fileName);
    if (entry.iconUrl) {
      var icon = document.createElement('img');
      icon.className = 'qa-download-btn__icon';
      icon.src = entry.iconUrl;
      icon.alt = '';
      icon.loading = 'lazy';
      icon.onerror = function () {
        icon.remove();
      };
      a.appendChild(icon);
    }
    var labelEl = document.createElement('span');
    labelEl.className = 'qa-download-btn__label';
    labelEl.textContent = entry.label || 'Download';
    a.appendChild(labelEl);
    return a;
  };

  QualityAssistantWidget.prototype.ensureGalleryLightbox = function () {
    if (this._lightboxEl) return this._lightboxEl;

    var lb = document.createElement('div');
    lb.className = 'qa-lightbox';
    lb.hidden = true;
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Image gallery');
    lb.innerHTML =
      '<button type="button" class="qa-lightbox__backdrop" aria-label="Close gallery"></button>' +
      '<div class="qa-lightbox__panel">' +
      '<button type="button" class="qa-lightbox__close" aria-label="Close">&times;</button>' +
      '<button type="button" class="qa-lightbox__nav qa-lightbox__prev" aria-label="Previous image">&#8249;</button>' +
      '<button type="button" class="qa-lightbox__nav qa-lightbox__next" aria-label="Next image">&#8250;</button>' +
      '<figure class="qa-lightbox__figure">' +
      '<img class="qa-lightbox__img" alt="" />' +
      '<figcaption class="qa-lightbox__caption"></figcaption>' +
      '</figure>' +
      '</div>';

    var self = this;
    lb.querySelector('.qa-lightbox__backdrop').addEventListener('click', function () {
      self.closeGalleryLightbox();
    });
    lb.querySelector('.qa-lightbox__close').addEventListener('click', function () {
      self.closeGalleryLightbox();
    });
    lb.querySelector('.qa-lightbox__prev').addEventListener('click', function () {
      self.stepGalleryLightbox(-1);
    });
    lb.querySelector('.qa-lightbox__next').addEventListener('click', function () {
      self.stepGalleryLightbox(1);
    });

    if (!this._lightboxKeyHandler) {
      this._lightboxKeyHandler = function (e) {
        if (!self._lightboxEl || self._lightboxEl.hidden) return;
        if (e.key === 'Escape') self.closeGalleryLightbox();
        if (e.key === 'ArrowLeft') self.stepGalleryLightbox(-1);
        if (e.key === 'ArrowRight') self.stepGalleryLightbox(1);
      };
      document.addEventListener('keydown', this._lightboxKeyHandler);
    }

    document.body.appendChild(lb);
    this._lightboxEl = lb;
    this._lightboxImages = [];
    this._lightboxIndex = 0;
    return lb;
  };

  QualityAssistantWidget.prototype.renderGalleryLightbox = function () {
    var lb = this._lightboxEl;
    var images = this._lightboxImages || [];
    if (!lb || !images.length) return;

    var index = this._lightboxIndex;
    if (index < 0) index = 0;
    if (index >= images.length) index = images.length - 1;
    this._lightboxIndex = index;

    var current = images[index];
    var imgEl = lb.querySelector('.qa-lightbox__img');
    var capEl = lb.querySelector('.qa-lightbox__caption');
    imgEl.src = current.url;
    imgEl.alt = current.name || '';
    capEl.textContent = current.name || '';
    capEl.hidden = !current.name;

    var multi = images.length > 1;
    lb.querySelector('.qa-lightbox__prev').hidden = !multi;
    lb.querySelector('.qa-lightbox__next').hidden = !multi;
  };

  QualityAssistantWidget.prototype.openGalleryLightbox = function (images, startIndex) {
    var list = (images || []).filter(function (img) {
      return img && img.url;
    });
    if (!list.length) return;

    this.ensureGalleryLightbox();
    this._lightboxImages = list;
    this._lightboxIndex =
      typeof startIndex === 'number' && startIndex >= 0 ? startIndex : 0;
    this.renderGalleryLightbox();
    this._lightboxEl.hidden = false;
    document.body.classList.add('qa-lightbox-open');
    this._lightboxEl.querySelector('.qa-lightbox__close').focus();
  };

  QualityAssistantWidget.prototype.closeGalleryLightbox = function () {
    if (!this._lightboxEl) return;
    this._lightboxEl.hidden = true;
    document.body.classList.remove('qa-lightbox-open');
    var imgEl = this._lightboxEl.querySelector('.qa-lightbox__img');
    if (imgEl) imgEl.removeAttribute('src');
  };

  QualityAssistantWidget.prototype.stepGalleryLightbox = function (delta) {
    var images = this._lightboxImages || [];
    if (!images.length) return;
    var next = this._lightboxIndex + delta;
    if (next < 0) next = images.length - 1;
    if (next >= images.length) next = 0;
    this._lightboxIndex = next;
    this.renderGalleryLightbox();
  };

  QualityAssistantWidget.prototype.buildGalleryEl = function (gallery) {
    var wrap = document.createElement('div');
    wrap.className = 'qa-gallery';
    if (gallery.message) {
      var heading = document.createElement('div');
      heading.className = 'qa-gallery__label';
      heading.textContent = gallery.message;
      wrap.appendChild(heading);
    }
    var track = document.createElement('div');
    track.className = 'qa-gallery__track';
    track.setAttribute('role', 'list');

    var images = (gallery.images || []).filter(function (img) {
      return img && img.url;
    });
    var self = this;

    images.forEach(function (img, index) {
      var item = document.createElement('button');
      item.type = 'button';
      item.className = 'qa-gallery__item';
      item.setAttribute('role', 'listitem');
      item.title = img.name || 'View image';
      item.addEventListener('click', function () {
        self.openGalleryLightbox(images, index);
      });
      var image = document.createElement('img');
      image.className = 'qa-gallery__img';
      image.src = img.url;
      image.alt = img.name || '';
      image.loading = 'lazy';
      image.draggable = false;
      image.onerror = function () {
        item.classList.add('qa-gallery__item--error');
      };
      item.appendChild(image);
      if (img.name) {
        var cap = document.createElement('span');
        cap.className = 'qa-gallery__caption';
        cap.textContent = img.name;
        item.appendChild(cap);
      }
      track.appendChild(item);
    });
    if (track.childNodes.length) wrap.appendChild(track);
    return wrap;
  };

  QualityAssistantWidget.prototype.buildInlineSelectEl = function (dropdown, opts) {
    if (getInlineSelectDisplay() === 'dropdown') {
      return this.buildInlineSelectDropdownEl(dropdown, opts);
    }
    return this.buildInlineSelectChipsEl(dropdown, opts);
  };

  QualityAssistantWidget.prototype.buildInlineSelectChipsEl = function (dropdown, opts) {
    opts = opts || {};
    var wrap = document.createElement('div');
    wrap.className = 'qa-inline-select qa-inline-select--chips';

    if (dropdown.message && !opts.hideLabel) {
      var heading = document.createElement('div');
      heading.className = 'qa-inline-select__label';
      heading.textContent = dropdown.message;
      wrap.appendChild(heading);
    }

    var chipsWrap = document.createElement('div');
    chipsWrap.className = 'qa-msg__chips qa-inline-select__chips';
    chipsWrap.setAttribute('role', 'group');
    chipsWrap.setAttribute(
      'aria-label',
      dropdown.message || 'Choose an option'
    );

    (dropdown.options || []).forEach(function (opt) {
      var label = opt.label || opt.value || '';
      var message = opt.value || opt.label || '';
      if (!label) return;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'qa-chip qa-chip--bot';
      btn.setAttribute('data-message', message);
      btn.textContent = label;
      chipsWrap.appendChild(btn);
    });

    if (chipsWrap.childNodes.length) {
      chipsWrap.addEventListener(
        'click',
        function (e) {
          var chip = e.target.closest('.qa-chip[data-message]');
          if (!chip || wrap.classList.contains('qa-inline-select--used')) return;
          wrap.classList.add('qa-inline-select--used');
          chipsWrap.querySelectorAll('.qa-chip').forEach(function (b) {
            b.disabled = true;
          });
        },
        true
      );
      wrap.appendChild(chipsWrap);
    }

    return wrap;
  };

  QualityAssistantWidget.prototype.buildInlineSelectDropdownEl = function (
    dropdown,
    opts
  ) {
    opts = opts || {};
    var wrap = document.createElement('div');
    wrap.className = 'qa-inline-select qa-inline-select--dropdown';
    var selectId =
      'qa-select-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);

    if (dropdown.message && !opts.hideLabel) {
      var label = document.createElement('label');
      label.className = 'qa-inline-select__label';
      label.setAttribute('for', selectId);
      label.textContent = dropdown.message;
      wrap.appendChild(label);
    }

    var select = document.createElement('select');
    select.id = selectId;
    select.className = 'qa-inline-select__control';
    select.setAttribute('aria-label', dropdown.message || 'Select an option');

    var placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = dropdown.placeholder || 'Choose…';
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.hidden = true;
    select.appendChild(placeholder);

    (dropdown.options || []).forEach(function (opt) {
      var option = document.createElement('option');
      option.value = opt.value || opt.label || '';
      option.textContent = opt.label || opt.value || '';
      select.appendChild(option);
    });

    var self = this;
    select.addEventListener('change', function () {
      var val = (select.value || '').trim();
      if (!val || self.isSending) return;
      select.disabled = true;
      wrap.classList.add('qa-inline-select--used');
      self.sendMessageWithText(val);
    });

    wrap.appendChild(select);
    return wrap;
  };

  QualityAssistantWidget.prototype.buildDownloadsEl = function (downloads) {
    var wrap = document.createElement('div');
    wrap.className = 'qa-downloads';
    wrap.setAttribute('role', 'list');
    var self = this;
    (downloads || []).forEach(function (entry) {
      if (!entry || !entry.href) return;
      var item = document.createElement('div');
      item.className = 'qa-download-item';
      item.setAttribute('role', 'listitem');
      item.appendChild(self.createDownloadLink(entry));
      wrap.appendChild(item);
    });
    return wrap;
  };

  QualityAssistantWidget.prototype.appendDownloadLink = function (
    parent,
    btn
  ) {
    if (!btn || !btn.href || !/^https?:\/\//i.test(btn.href)) return false;
    var link = document.createElement('a');
    link.className =
      'qa-chip qa-chip--bot qa-chip--link' +
      (btn.download ? ' qa-chip--download' : '');
    link.href = btn.href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    if (btn.download) {
      link.setAttribute('download', btn.fileName || btn.label || '');
    }
    link.textContent = btn.label || 'Download';
    parent.appendChild(link);
    return true;
  };

  QualityAssistantWidget.prototype.fillMessageBubble = function (bubble, text, replyParts) {
    bubble.textContent = '';
    var parts = replyParts && replyParts.length ? replyParts : null;
    if (!parts) {
      var textStr = text == null ? '' : String(text).trim();
      if (textStr) bubble.textContent = textStr;
      return;
    }
    var self = this;
    parts.forEach(function (part) {
      if (part.type === 'link' && part.href && /^https?:\/\//i.test(part.href)) {
        var a = document.createElement('a');
        a.className = 'qa-msg__link';
        a.href = part.href;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = part.text || part.href;
        bubble.appendChild(a);
        return;
      }
      var chunk = part.text != null ? String(part.text) : '';
      if (chunk) bubble.appendChild(document.createTextNode(chunk));
    });
    if (!bubble.childNodes.length && text) {
      bubble.textContent = String(text).trim();
    }
  };

  QualityAssistantWidget.prototype.appendMessage = function (role, text, options) {
    options = options || {};
    if (this.els.welcome) {
      this.els.welcome.remove();
      this.els.welcome = null;
    }
    var row = document.createElement('div');
    row.className = 'qa-msg qa-msg--' + role;
    var body = document.createElement('div');
    body.className = 'qa-msg__body';
    body.appendChild(this.buildPersonaRow(role));
    var textStr = text == null ? '' : String(text).trim();
    var replyParts = options.replyParts || [];
    var dropdowns = options.dropdowns || [];
    var galleries = options.galleries || [];
    var skipBubbleForDropdown =
      role === 'bot' &&
      textStr &&
      (dropdowns.some(function (d) {
        return String(d.message || '').trim() === textStr;
      }) ||
        galleries.some(function (g) {
          return String(g.message || '').trim() === textStr;
        }));
    if ((textStr || replyParts.length) && !skipBubbleForDropdown) {
      var bubble = document.createElement('div');
      bubble.className = 'qa-msg__bubble';
      this.fillMessageBubble(bubble, textStr, replyParts);
      body.appendChild(bubble);
    }
    var chips = options.chips || [];
    var chipHeading = (options.chipHeading || '').trim();
    if (role === 'bot' && chipHeading) {
      var headingEl = document.createElement('div');
      headingEl.className = 'qa-msg__chips-heading';
      headingEl.textContent = chipHeading;
      body.appendChild(headingEl);
    }
    if (role === 'bot' && chips.length) {
      var chipsWrap = document.createElement('div');
      chipsWrap.className = 'qa-msg__chips';
      chipsWrap.setAttribute('role', 'group');
      chipsWrap.setAttribute('aria-label', 'Suggested replies');
      var self = this;
      chips.forEach(function (c) {
        var label = c.label || c.message || '';
        var message = c.message || c.label || '';
        if (!label) return;
        if (
          c.href &&
          /^https?:\/\//i.test(c.href) &&
          self.appendDownloadLink(chipsWrap, {
            href: c.href,
            label: label,
            download: true,
            fileName: label,
          })
        ) {
          return;
        }
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'qa-chip qa-chip--bot';
        btn.setAttribute('data-message', message);
        btn.textContent = label;
        chipsWrap.appendChild(btn);
      });
      if (chipsWrap.childNodes.length) body.appendChild(chipsWrap);
    }
    var infoCards = options.infoCards || [];
    if (role === 'bot' && infoCards.length) {
      body.appendChild(this.buildInfoCardsEl(infoCards));
    }
    var downloads = options.downloads || [];
    if (role === 'bot' && downloads.length) {
      body.appendChild(this.buildDownloadsEl(downloads));
    }
    if (role === 'bot' && galleries.length) {
      var selfGallery = this;
      galleries.forEach(function (gallery) {
        body.appendChild(selfGallery.buildGalleryEl(gallery));
      });
    }
    if (role === 'bot' && dropdowns.length) {
      var selfDropdown = this;
      var sharedGalleryMsg =
        galleries.length === 1 ? String(galleries[0].message || '').trim() : '';
      dropdowns.forEach(function (dropdown) {
        var hideLabel =
          sharedGalleryMsg &&
          String(dropdown.message || '').trim() === sharedGalleryMsg;
        body.appendChild(selfDropdown.buildInlineSelectEl(dropdown, { hideLabel: hideLabel }));
      });
    }
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
    this.els.input.value = '';
    this.els.input.style.height = 'auto';
    this.sendMessageWithText(text);
  };

  QualityAssistantWidget.prototype.sendMessageWithText = function (text) {
    text = (text || '').trim();
    if (!text || this.isSending) return;
    this.noteUserActivity();
    this.appendMessage('user', text);
    this.postToDialogflow({
      message: text,
      sessionId: this.sessionId,
      languageCode: this.getDialogflowLang(),
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
