(function (global) {
  'use strict';

  var ICONS = {
    bot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7v1h1a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H6a2 2 0 01-2-2v-1H3a1 1 0 01-1-1v-3a1 1 0 011-1h1v-1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z"/><circle cx="9" cy="13" r="1" fill="currentColor"/><circle cx="15" cy="13" r="1" fill="currentColor"/><path d="M9 17h6"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>',
    send: '<svg class="qa-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M6 11l6-6 6 6" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    mic: '<svg class="qa-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 12a6 6 0 0 0 12 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M12 18v3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>',
    restart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
    header: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>',
    agentHuman:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><circle cx="12" cy="8" r="3.25"/><path d="M5 20v-.75C5 16.13 8.13 14 12 14s7 2.13 7 5.25V20"/><path d="M16.5 9.5l1.2 1.2 2.3-2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    attach:
      '<svg class="qa-attach__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14.25 8.25v7.5a2.75 2.75 0 1 1-5.5 0V7a4.25 4.25 0 1 1 8.5 0v8.75a6.25 6.25 0 0 1-12.5 0V8.5" stroke="currentColor" stroke-width="2.35" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };

  function getRootCfg() {
    return (global.QA_CHAT_UI_CONFIG && global.QA_CHAT_UI_CONFIG.common) || {};
  }

  function isMobileViewport() {
    return !!(global.matchMedia && global.matchMedia('(max-width: 768px)').matches);
  }

  function getViewportCfg() {
    var root = global.QA_CHAT_UI_CONFIG || {};
    return isMobileViewport() ? root.mob || {} : root.desk || {};
  }

  function isPlainObject(v) {
    return v && typeof v === 'object' && !Array.isArray(v);
  }

  function deepMerge(base, over) {
    var out = {};
    var b = base || {};
    var o = over || {};
    Object.keys(b).forEach(function (k) {
      out[k] = b[k];
    });
    Object.keys(o).forEach(function (k) {
      if (isPlainObject(b[k]) && isPlainObject(o[k])) {
        out[k] = deepMerge(b[k], o[k]);
      } else {
        out[k] = o[k];
      }
    });
    return out;
  }

  /** common + current device (desk | mob) */
  function getEffectiveCfg() {
    return deepMerge(getRootCfg(), getViewportCfg());
  }

  function isChatbotEnabledForViewport() {
    return getViewportCfg().showChatbot !== false;
  }

  function isChatbotEnabledAnywhere() {
    var root = global.QA_CHAT_UI_CONFIG || {};
    var desk = root.desk || {};
    var mob = root.mob || {};
    return desk.showChatbot !== false || mob.showChatbot !== false;
  }

  function getChatLayoutSide() {
    var cl = getViewportCfg().chatLayout || {};
    return String(cl.side || 'right').toLowerCase() === 'left' ? 'left' : 'right';
  }

  function getRestartCfg() {
    var rb = getEffectiveCfg().restartButton || {};
    return {
      enabled: rb.enabled !== false,
      label: String(rb.label != null ? rb.label : 'Restart').trim() || 'Restart',
    };
  }

  function getHeaderLayoutCfg() {
    var hdr = getEffectiveCfg().header || {};
    return {
      titleFontSizePx: hdr.titleFontSizePx,
      subtitleFontSizePx: hdr.subtitleFontSizePx,
      iconSizePx: hdr.iconSizePx != null ? hdr.iconSizePx : hdr.titlebarIconSizePx,
    };
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
    return getViewportCfg().launcherStrip || {};
  }

  /** Chat open hone par niche launcher bubble par X — desk/mob launcher.closeBubbleWhenOpen */
  function isLauncherCloseBubbleEnabled() {
    var launch = getEffectiveCfg().launcher || {};
    var cfg = launch.closeBubbleWhenOpen;
    if (cfg && cfg.enabled === false) return false;
    return true;
  }

  function getLauncherCloseBubbleCfg() {
    var launch = getEffectiveCfg().launcher || {};
    return launch.closeBubbleWhenOpen || {};
  }

  /** Chat open: panel kitni upar — bubble+X on = launcher ke upar; off = niche (panelBottomPx) */
  function getLauncherStackPx(isChatOpen) {
    var launch = getEffectiveCfg().launcher || {};
    var size = launch.sizePx != null ? launch.sizePx : 60;
    var cfg = getLauncherCloseBubbleCfg();
    if (isChatOpen && cfg.enabled === false) {
      return cfg.panelBottomPx != null ? cfg.panelBottomPx : 8;
    }
    return size + 12;
  }

  function getPanelHeightExtraPx(whenChatOpen) {
    var cfg = getLauncherCloseBubbleCfg();
    if (cfg.enabled !== false) return 0;
    if (whenChatOpen && !isMobileViewport()) return 0;
    if (cfg.panelHeightExtraPx == null) return 0;
    return cfg.panelHeightExtraPx;
  }

  function computeOpenPanelHeightPx() {
    var eff = getEffectiveCfg();
    var win = eff.chatWindow || {};
    var topInset = win.topInsetPx != null ? win.topInsetPx : 16;
    var pos = win.position || {};
    var widgetBottom = pos.bottomPx != null ? pos.bottomPx : 24;
    var stackPx = getLauncherStackPx(true);
    var boost = getPanelHeightExtraPx(true);
    var viewportMax =
      (global.innerHeight || 800) -
      topInset -
      stackPx -
      widgetBottom -
      8 +
      boost;
    if (win.heightPx) {
      return Math.min(win.heightPx + boost, viewportMax);
    }
    var minH =
      (win.minHeightPx != null ? win.minHeightPx : 360) + boost;
    return Math.max(minH, viewportMax);
  }

  function hasLauncherStripTextAnywhere() {
    var root = global.QA_CHAT_UI_CONFIG || {};
    var d = (root.desk || {}).launcherStrip || {};
    var m = (root.mob || {}).launcherStrip || {};
    return !!(d.text || m.text);
  }

  function extractLeadingEmoji(text) {
    var s = String(text || '').trim();
    if (!s) return '';
    try {
      if (typeof Intl !== 'undefined' && Intl.Segmenter) {
        var parts = Array.from(
          new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(s),
          function (x) {
            return x.segment;
          }
        );
        if (parts.length && /\p{Extended_Pictographic}/u.test(parts[0])) {
          return parts[0];
        }
        return '';
      }
    } catch (e) {
      /* Intl not available */
    }
    var m = s.match(/^(\p{Extended_Pictographic})/u);
    return m ? m[1] : '';
  }

  function stripTextWithoutLeadingEmoji(text) {
    var emoji = extractLeadingEmoji(text);
    if (!emoji) return String(text || '');
    return String(text).slice(emoji.length).trimStart();
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

  /** Home = FRESH; landing pages: QA_CONFIG.welcomeEventName or URL + landingPages config */
  function resolveWelcomeEventName_() {
    var cfg = getWelcomeEventCfg();
    var override =
      global.QA_CONFIG && global.QA_CONFIG.welcomeEventName
        ? String(global.QA_CONFIG.welcomeEventName).trim()
        : '';
    if (!override) {
      var df = getRootCfg().dialogflow || {};
      var lp = df.landingPages || {};
      var path = String(
        (global.location && global.location.pathname) || ''
      ).toLowerCase();
      if (path.indexOf('green-valley') >= 0 && lp.greenValley) {
        override = String(lp.greenValley.welcomeEventName || '').trim();
      } else if (path.indexOf('lake-view') >= 0 && lp.lakeView) {
        override = String(lp.lakeView.welcomeEventName || '').trim();
      }
    }
    if (override) return override;
    return String(cfg.eventName || 'FRESH').trim();
  }

  function getEndChatEventCfg() {
    var df = getRootCfg().dialogflow || {};
    return df.endChatEvent || {};
  }

  function getAgentOrchestrationCfg() {
    var df = getRootCfg().dialogflow || {};
    var orch = Object.assign({}, df.agentOrchestration || {});
    var qaGlobal = global.QA_CONFIG && global.QA_CONFIG.agentOrchestration;
    if (qaGlobal && typeof qaGlobal === 'object') {
      Object.assign(orch, qaGlobal);
    }
    return orch;
  }

  function normalizeOrchText_(text) {
    return String(text || '').trim().toLowerCase();
  }

  function matchOrchTrigger_(text, triggers) {
    var needle = normalizeOrchText_(text);
    if (!needle || !Array.isArray(triggers)) return false;
    for (var i = 0; i < triggers.length; i++) {
      if (normalizeOrchText_(triggers[i]) === needle) return true;
    }
    return false;
  }

  function findChildByOpenTrigger_(text, orch) {
    if (!orch || orch.enabled === false || orch.role !== 'receptionist') return null;
    var children = orch.children || [];
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      if (matchOrchTrigger_(text, child.openTriggers || [])) return child;
    }
    return null;
  }

  function isReturnToReceptionistTrigger_(text, orch) {
    if (!orch || orch.enabled === false) return false;
    var triggers = orch.returnTriggers || [
      'main menu',
      'back',
      'menu',
      'receptionist',
      'back to menu',
      '← main menu',
    ];
    return matchOrchTrigger_(text, triggers);
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

  /**
   * autoScroll — turn slow strip scrolling on/off.
   * stopAutoScrollOnInteraction — when autoScroll is on, user tap/arrow/scrollbar
   * stops auto-scroll for that one gallery/carousel only (default true).
   */
  function getScrollStripOpts(kind) {
    var rc = (getRootCfg().dialogflow || {}).richContentChips || {};
    var shared = rc.scrollStrip || {};
    var cfg =
      kind === 'cardCarousel'
        ? rc.cardCarousel || {}
        : rc.galleryImage || {};
    var autoScrollEnabled =
      cfg.autoScroll !== false && shared.autoScroll !== false;
    var stopOnInteract = true;
    if (cfg.stopAutoScrollOnInteraction === false) {
      stopOnInteract = false;
    } else if (shared.stopAutoScrollOnInteraction === false) {
      stopOnInteract = false;
    }
    return {
      autoScroll: autoScrollEnabled,
      secondsPerItem:
        cfg.autoScrollSecondsPerItem != null
          ? Number(cfg.autoScrollSecondsPerItem) || 4
          : shared.autoScrollSecondsPerItem != null
            ? Number(shared.autoScrollSecondsPerItem) || 4
            : 4,
      stopAutoScrollOnInteraction: autoScrollEnabled && stopOnInteract,
    };
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
    this.qaMode = !!(options && options.qaMode);

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
    /** true after user sends a message / chip / dropdown (not just opening chat) */
    this.clientContext = {};
    this.recognition = null;
    this.root = null;
    this.els = {};
    this.liveAgentMode = false;
    this._liveAgentHumanActive = false;
    this._liveAgentWaiting = false;
    this._liveAgentBotCopilotActive = false;
    this.resetOrchestrationState();
    this.init();
  }

  QualityAssistantWidget.prototype.resetOrchestrationState = function () {
    var orch = getAgentOrchestrationCfg();
    var df = getRootCfg().dialogflow || {};
    var overridePid =
      global.QA_CONFIG && global.QA_CONFIG.dialogflowProjectId
        ? String(global.QA_CONFIG.dialogflowProjectId).trim()
        : '';
    this._orchMode =
      orch.enabled !== false && orch.role === 'receptionist' ? 'receptionist' : 'standalone';
    this._orchChildId = '';
    this._orchChildLabel = '';
    this._activeDialogflowProjectId = overridePid || String(df.projectId || '').trim();
  };

  QualityAssistantWidget.prototype.getDialogflowProjectId = function () {
    return this._activeDialogflowProjectId || '';
  };

  QualityAssistantWidget.prototype.isOrchestrationReceptionistHost = function () {
    var orch = getAgentOrchestrationCfg();
    return !!(
      orch.enabled !== false &&
      orch.role === 'receptionist' &&
      Array.isArray(orch.children) &&
      orch.children.length
    );
  };

  QualityAssistantWidget.prototype.withDialogflowRouting_ = function (body) {
    var payload = Object.assign({}, body || {});
    var pid = this.getDialogflowProjectId();
    if (pid) payload.dialogflowProjectId = pid;
    if (this._orchMode) payload.orchestrationMode = this._orchMode;
    if (this._orchChildId) payload.orchestrationChildId = this._orchChildId;
    return payload;
  };

  QualityAssistantWidget.prototype.switchToChildAgent = function (child) {
    var orch = getAgentOrchestrationCfg();
    var welcome = String(
      child.welcomeEvent || orch.childWelcomeEvent || 'FRESH'
    ).trim();
    this._orchMode = 'child';
    this._orchChildId = child.id || '';
    this._orchChildLabel = child.label || child.id || '';
    this._activeDialogflowProjectId = String(child.projectId || '').trim();
    this.sessionId = this.newSessionId();
    this._welcomeEventSent = false;
    this._welcomeEventInFlight = false;
    return this.postToDialogflow(
      this.withDialogflowRouting_({
        event: welcome,
        sessionId: this.sessionId,
        languageCode: this.getDialogflowLang(),
      })
    );
  };

  QualityAssistantWidget.prototype.switchToReceptionist = function () {
    var orch = getAgentOrchestrationCfg();
    var df = getRootCfg().dialogflow || {};
    var welcome = String(orch.returnWelcomeEvent || 'FRESH').trim();
    this._orchMode = 'receptionist';
    this._orchChildId = '';
    this._orchChildLabel = '';
    this._activeDialogflowProjectId = String(df.projectId || '').trim();
    this.sessionId = this.newSessionId();
    this._welcomeEventSent = false;
    this._welcomeEventInFlight = false;
    return this.postToDialogflow(
      this.withDialogflowRouting_({
        event: welcome,
        sessionId: this.sessionId,
        languageCode: this.getDialogflowLang(),
      })
    );
  };

  QualityAssistantWidget.prototype.isHumanChatActive = function () {
    if (this._liveAgentBotCopilotActive) return false;
    return !!this._liveAgentHumanActive;
  };

  QualityAssistantWidget.prototype.newSessionId = function () {
    var prefix = this.qaMode ? 'qa-test-' : 'qa-';
    return prefix + Date.now() + '-' + Math.random().toString(36).slice(2, 11);
  };

  QualityAssistantWidget.prototype.qaApiHeaders = function (extra) {
    var headers = Object.assign({ 'Content-Type': 'application/json' }, extra || {});
    if (this.qaMode) headers['X-QA-Mode'] = '1';
    return headers;
  };

  QualityAssistantWidget.prototype.withQaBody = function (body) {
    var payload = Object.assign({}, body || {});
    if (this.qaMode) payload.qaMode = true;
    return payload;
  };

  QualityAssistantWidget.prototype.init = function () {
    if (!isChatbotEnabledAnywhere()) return;

    this.root = document.createElement('div');
    this.root.className = 'qa-widget';
    this.root.innerHTML = this.template();
    document.body.appendChild(this.root);
    this.updateChatbotVisibility();
    this.applyTheme();
    this.applyLayout();
    this.cacheElements();
    this.updateLauncherStripVisibility();
    this.applyFeatureToggles();
    this.bindEvents();
    this.bindViewportRestartToggle();
    this.fetchConfig();
    this.scheduleStripHandPop();
    this.maybeAutoOpen();
    this._bootLiveAgentScript();
  };

  QualityAssistantWidget.prototype._bootLiveAgentScript = function () {
    var cfg = getRootCfg();
    var la = (cfg.common && cfg.common.liveAgent) || cfg.liveAgent || {};
    if (la.enabled === false || !this.apiBase) {
      return;
    }
    var self = this;
    if (typeof this.startLiveAgentMode === 'function') {
      setTimeout(function () {
        if (self._liveAgentResumeIfNeeded) {
          self._liveAgentResumeIfNeeded();
        }
      }, 400);
      return;
    }
    if (global.__qaLiveAgentScriptDone) {
      setTimeout(function () {
        if (typeof global.QA_LIVE_AGENT_PATCH === 'function') {
          global.QA_LIVE_AGENT_PATCH();
        }
        if (self._liveAgentResumeIfNeeded) {
          self._liveAgentResumeIfNeeded();
        }
      }, 100);
      return;
    }
    if (global.__qaLiveAgentScriptLoading) {
      return;
    }
    global.__qaLiveAgentScriptLoading = true;
    var base = String(this.apiBase).replace(/\/$/, '');
    var s = document.createElement('script');
    s.src = base + '/widget/live-agent-client.js?v=20260603-typing-handoff';
    s.onload = function () {
      global.__qaLiveAgentScriptDone = true;
      global.__qaLiveAgentScriptLoading = false;
      if (typeof global.QA_LIVE_AGENT_PATCH === 'function') {
        global.QA_LIVE_AGENT_PATCH();
      }
      if (self._liveAgentResumeIfNeeded) {
        self._liveAgentResumeIfNeeded();
      }
    };
    s.onerror = function () {
      global.__qaLiveAgentScriptLoading = false;
    };
    document.head.appendChild(s);
  };

  QualityAssistantWidget.prototype.updateRestartVisibility = function () {
    if (!this.els || !this.els.restart) return;
    this.els.restart.style.display = getRestartCfg().enabled ? '' : 'none';
  };

  QualityAssistantWidget.prototype.updateChatbotVisibility = function () {
    if (!this.root) return;
    this.root.style.display = isChatbotEnabledForViewport() ? '' : 'none';
  };

  QualityAssistantWidget.prototype.updateLauncherStripVisibility = function () {
    var wrap =
      this.root && this.root.querySelector('.qa-launcher-strip-wrap');
    var strip = this.root && this.root.querySelector('.qa-launcher-strip');
    var host = wrap || strip;
    if (!host) return;
    var stripCfg = getLauncherStripCfg();
    var active = stripCfg.enabled !== false && stripCfg.text;
    if (!active) {
      host.style.display = 'none';
      return;
    }
    host.style.display = '';
    var fullText = String(stripCfg.text);
    var waveEmoji = extractLeadingEmoji(fullText);
    var waveCfg = stripCfg.wavePopup || {};
    var waveOn = waveCfg.enabled !== false && waveEmoji;
    var waveEl = strip && strip.querySelector('.qa-launcher-strip__wave');
    var textEl = strip && strip.querySelector('.qa-launcher-strip__text');
    if (textEl) {
      textEl.textContent = waveOn ? stripTextWithoutLeadingEmoji(fullText) : fullText;
    }
    if (waveEl) waveEl.textContent = waveEmoji;
    host.classList.toggle('qa-launcher-strip--hidden', !!this.isOpen);
  };

  QualityAssistantWidget.prototype.scheduleStripHandPop = function () {
    var self = this;
    if (self._stripHandPopTimer) {
      clearTimeout(self._stripHandPopTimer);
      self._stripHandPopTimer = null;
    }
    var stripCfg = getLauncherStripCfg();
    var waveCfg = stripCfg.wavePopup || {};
    if (waveCfg.enabled === false || !stripCfg.text) return;
    var delay = Math.max(0, parseInt(waveCfg.delayMs, 10) || 0);
    self._stripHandPopTimer = setTimeout(function () {
      self._stripHandPopTimer = null;
      self.playStripHandPop();
    }, delay);
  };

  QualityAssistantWidget.prototype.playStripHandPop = function () {
    if (this._stripHandPopPlayed) return;
    var stripCfg = getLauncherStripCfg();
    if (stripCfg.enabled === false || !stripCfg.text) return;
    var waveCfg = stripCfg.wavePopup || {};
    if (waveCfg.enabled === false) return;
    var wave = this.root && this.root.querySelector('.qa-launcher-strip__wave');
    if (!wave) return;
    this._stripHandPopPlayed = true;
    var scale = Math.max(1.5, parseFloat(waveCfg.scale) || 3);
    var ms = Math.max(200, parseInt(waveCfg.durationMs, 10) || 1000);
    wave.style.setProperty('--qa-hand-pop-scale', String(scale));
    wave.style.setProperty('--qa-hand-pop-duration', ms / 1000 + 's');
    wave.classList.remove('qa-launcher-strip__wave--pop');
    void wave.offsetWidth;
    wave.classList.add('qa-launcher-strip__wave--pop');
    setTimeout(function () {
      wave.classList.remove('qa-launcher-strip__wave--pop');
    }, ms);
  };

  QualityAssistantWidget.prototype.applyChatSide = function () {
    if (!this.root) return;
    var side = getChatLayoutSide();
    this.root.classList.toggle('qa-widget--left', side === 'left');
  };

  QualityAssistantWidget.prototype.bindViewportRestartToggle = function () {
    var self = this;
    this.updateRestartVisibility();
    this.updateLauncherStripVisibility();
    this.updateChatbotVisibility();
    if (!global.matchMedia) return;
    var mq = global.matchMedia('(max-width: 768px)');
    var onChange = function () {
      self.updateChatbotVisibility();
      self.updateRestartVisibility();
      self.updateLauncherStripVisibility();
      self.applyChatSide();
      self.applyLayout();
      self.applyFeatureToggles();
      self.updateLauncherCloseBubble();
    };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
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
    this.applyChatSide();

    var panel = common.chatPanel && common.chatPanel.borderRadius;
    if (panel) {
      this.root.style.setProperty('--qa-panel-tl', panel.topLeft || '16px');
      this.root.style.setProperty('--qa-panel-tr', panel.topRight || '16px');
      this.root.style.setProperty('--qa-panel-bl', panel.bottomLeft || '16px');
      this.root.style.setProperty('--qa-panel-br', panel.bottomRight || '16px');
    }

    var hdrLayout = getHeaderLayoutCfg();
    if (hdrLayout.titleFontSizePx != null) {
      this.root.style.setProperty(
        '--qa-header-title-size',
        hdrLayout.titleFontSizePx + 'px'
      );
    }
    if (hdrLayout.subtitleFontSizePx != null) {
      this.root.style.setProperty(
        '--qa-header-subtitle-size',
        hdrLayout.subtitleFontSizePx + 'px'
      );
    }
    var iconPx = hdrLayout.iconSizePx != null ? hdrLayout.iconSizePx : 40;
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
    if (pb.offsetDownPx != null) {
      this.root.style.setProperty('--qa-powered-offset-down', pb.offsetDownPx + 'px');
    }
    if (pb.logoHeightPx != null) {
      this.root.style.setProperty('--qa-powered-logo-height', pb.logoHeightPx + 'px');
    }
    var rb = common.restartButton || {};
    var restartGap =
      rb.gapAfterLanguagePx != null
        ? rb.gapAfterLanguagePx
        : rb.offsetLeftPx;
    if (restartGap != null) {
      this.root.style.setProperty('--qa-restart-gap-after-lang', restartGap + 'px');
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

    var carouselCfg = (rc && rc.cardCarousel) || {};
    if (carouselCfg.cardWidthPx != null) {
      this.root.style.setProperty(
        '--qa-carousel-card-width',
        carouselCfg.cardWidthPx + 'px'
      );
    }
    if (carouselCfg.imageHeightPx != null) {
      this.root.style.setProperty(
        '--qa-carousel-img-height',
        carouselCfg.imageHeightPx + 'px'
      );
    }
    if (carouselCfg.objectFit) {
      this.root.style.setProperty('--qa-carousel-img-fit', carouselCfg.objectFit);
    }
    if (carouselCfg.background) {
      this.root.style.setProperty('--qa-carousel-img-bg', carouselCfg.background);
    }
  };

  QualityAssistantWidget.prototype.applyLayout = function () {
    var eff = getEffectiveCfg();
    var win = eff.chatWindow || {};
    var panel = this.root.querySelector('.qa-panel');
    var launcher = this.root.querySelector('.qa-launcher');
    if (!panel) return;

    var pos = win.position || {};
    var topInset = win.topInsetPx != null ? win.topInsetPx : 16;
    var widgetBottom = pos.bottomPx != null ? pos.bottomPx : 24;
    this.root.style.setProperty('--qa-panel-top-inset', topInset + 'px');
    this.root.style.setProperty('--qa-widget-bottom', widgetBottom + 'px');

    if (win.widthPx) {
      panel.style.width = win.widthPx + 'px';
      panel.style.maxWidth = win.widthPx + 'px';
    }
    if (win.heightPx) {
      this.root.style.setProperty('--qa-panel-height', win.heightPx + 'px');
    }
    var minH = win.minHeightPx != null ? win.minHeightPx : 360;
    minH += getPanelHeightExtraPx(false);
    this.root.style.setProperty('--qa-panel-min-height', minH + 'px');
    var isMob = isMobileViewport();
    if (isMob && win.horizontalInsetPx != null) {
      panel.style.width = 'calc(100vw - ' + win.horizontalInsetPx * 2 + 'px)';
      panel.style.maxWidth = 'calc(100vw - ' + win.horizontalInsetPx * 2 + 'px)';
    }

    var side = getChatLayoutSide();
    var inset =
      win.horizontalInsetPx != null ? win.horizontalInsetPx : 12;
    var anchorPx =
      side === 'left'
        ? pos.leftPx != null
          ? pos.leftPx
          : inset
        : pos.rightPx != null
          ? pos.rightPx
          : pos.leftPx != null
            ? pos.leftPx
            : inset;

    this.root.style.left = '';
    this.root.style.right = '';
    if (launcher) {
      launcher.style.left = '';
      launcher.style.right = '';
    }
    if (side === 'left') {
      this.root.style.left = anchorPx + 'px';
      this.root.style.right = 'auto';
      if (launcher) {
        launcher.style.left = '0';
        launcher.style.right = 'auto';
      }
    } else {
      this.root.style.right = anchorPx + 'px';
      this.root.style.left = 'auto';
      if (launcher) {
        launcher.style.right = '0';
        launcher.style.left = 'auto';
      }
    }
    this.applyChatSide();
    if (pos.bottomPx != null) {
      this.root.style.bottom = pos.bottomPx + 'px';
    }

    var launch = eff.launcher || {};
    var hdr = eff.header || {};
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
        var openState = launcher.querySelector('.qa-launcher__state--open');
        if (openState) {
          openState.innerHTML =
            '<img src="' +
            launcherImg.replace(/"/g, '') +
            '" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:inherit"/>';
        }
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
    var stripHost =
      this.root.querySelector('.qa-launcher-strip-wrap') ||
      this.root.querySelector('.qa-launcher-strip');
    var strip = stripHost;
    if (strip && stripCfg.position) {
      var sp = stripCfg.position;
      if (sp.bottomPx != null) {
        strip.style.bottom = sp.bottomPx + 'px';
      }
      strip.style.left = '';
      strip.style.right = '';
      var stripSide = getChatLayoutSide();
      var stripPx =
        stripSide === 'left'
          ? sp.leftPx != null
            ? sp.leftPx
            : inset
          : sp.rightPx != null
            ? sp.rightPx
            : sp.leftPx != null
              ? sp.leftPx
              : 10;
      if (stripSide === 'left') {
        strip.style.left = stripPx + 'px';
        strip.style.right = 'auto';
      } else {
        strip.style.right = stripPx + 'px';
        strip.style.left = 'auto';
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
    this.syncLauncherStack();
  };

  QualityAssistantWidget.prototype.isComposerUploadEnabled = function () {
    var cfg = (getEffectiveCfg().features || {}).composerUpload || {};
    return cfg.enabled !== false;
  };

  QualityAssistantWidget.prototype.buildComposerUploadHtml = function () {
    if (!this.isComposerUploadEnabled()) return '';
    var uploadCfg = (getEffectiveCfg().features || {}).composerUpload || {};
    var display = String(uploadCfg.display || 'rich').toLowerCase();
    var emoji = String(uploadCfg.emoji || '📎').trim() || '📎';
    var accept = uploadCfg.accept ? String(uploadCfg.accept) : '';
    var tilt = Number(uploadCfg.tiltDeg);
    if (!isFinite(tilt)) tilt = -18;
    var glyph =
      display === 'emoji'
        ? '<span class="qa-attach__emoji" aria-hidden="true">' +
          this.escape(emoji) +
          '</span>'
        : '<span class="qa-attach__icon-wrap" aria-hidden="true">' + ICONS.attach + '</span>';
    return (
      '<button type="button" class="qa-attach" aria-label="Upload document" title="Upload document" style="--qa-attach-tilt:' +
      tilt +
      'deg">' +
      '<span class="qa-attach__glyph">' +
      glyph +
      '</span></button>' +
      '<input type="file" class="qa-attach-input" hidden multiple' +
      (accept ? ' accept="' + this.escape(accept) + '"' : '') +
      ' />'
    );
  };

  QualityAssistantWidget.prototype.applyFeatureToggles = function () {
    var eff = getEffectiveCfg();
    var feats = eff.features || {};
    if (this.els.mic) {
      this.els.mic.style.display =
        feats.speechToText && feats.speechToText.enabled === false ? 'none' : '';
    }
    if (this.els.attach) {
      this.els.attach.style.display = this.isComposerUploadEnabled() ? '' : 'none';
    }
    this.updateRestartVisibility();
    if (
      feats.multiLanguage &&
      feats.multiLanguage.enabled === false &&
      this.els.lang
    ) {
      this.els.lang.style.display = 'none';
    }
    var pb = eff.poweredBy;
    var powered = this.root.querySelector('.qa-powered');
    if (powered) {
      powered.style.display = pb && pb.enabled === false ? 'none' : '';
    }
  };

  QualityAssistantWidget.prototype.maybeAutoOpen = function () {
    if (!isChatbotEnabledForViewport()) return;
    var ao = getViewportCfg().autoOpenChat;
    if (!ao || !ao.enabled) return;
    var self = this;
    setTimeout(function () {
      self.open();
    }, ao.delayMs || 0);
  };

  QualityAssistantWidget.prototype.template = function () {
    var eff = getEffectiveCfg();
    var header = eff.header || {};
    var feats = eff.features || {};
    var ml = feats.multiLanguage || {};
    var restart = getRestartCfg();
    var pb = eff.poweredBy || {};
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
    if (hasLauncherStripTextAnywhere()) {
      var stripText = stripCfg.text || '';
      var waveEmoji = extractLeadingEmoji(stripText);
      var waveCfg = stripCfg.wavePopup || {};
      var waveOn = waveCfg.enabled !== false && waveEmoji;
      var bodyText = waveOn ? stripTextWithoutLeadingEmoji(stripText) : stripText;
      stripHtml =
        '<div class="qa-launcher-strip-wrap">' +
        '<div class="qa-launcher-strip" role="note">' +
        (waveOn
          ? '<span class="qa-launcher-strip__wave" aria-hidden="true">' +
            this.escape(waveEmoji) +
            '</span>'
          : '') +
        '<span class="qa-launcher-strip__text">' +
        this.escape(bodyText) +
        '</span></div></div>';
    }

    return (
      stripHtml +
      '<div class="qa-launcher-wrap">' +
      '<span class="qa-launcher-ring-bg" aria-hidden="true"></span>' +
      '<button type="button" class="qa-launcher" aria-label="Open chat">' +
      '<span class="qa-launcher__state qa-launcher__state--open">' +
      (eff.launcher && eff.launcher.iconUrl ? '' : ICONS.chat) +
      '</span>' +
      '<span class="qa-launcher__state qa-launcher__state--close" hidden aria-hidden="true">' +
      ICONS.close +
      '</span>' +
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
      this.buildComposerUploadHtml() +
      '<button type="button" class="qa-mic" aria-label="Speech to text">' +
      ICONS.mic +
      '</button>' +
      '<button type="button" class="qa-send" aria-label="Send message">' +
      ICONS.send +
      '</button></div>' +
      '<div class="qa-toolbar">' +
      '<div class="qa-toolbar__start">' +
      (ml.enabled !== false
        ? '<select class="qa-lang" aria-label="Language">' + langOptions + '</select>'
        : '') +
      '<button type="button" class="qa-restart" style="display:none">' +
      ICONS.restart +
      ' ' +
      this.escape(restart.label) +
      '</button>' +
      '</div>' +
      (poweredHtml ? '<div class="qa-toolbar__end">' + poweredHtml + '</div>' : '') +
      '</div>' +
      '<p class="qa-error" hidden></p></footer></div>'
    );
  };

  QualityAssistantWidget.prototype.cacheElements = function () {
    this.els = {
      launcherWrap: this.root.querySelector('.qa-launcher-wrap'),
      launcher: this.root.querySelector('.qa-launcher'),
      panel: this.root.querySelector('.qa-panel'),
      panelClose: this.root.querySelector('.qa-header__close'),
      close: this.root.querySelector('.qa-launcher'),
      messages: this.root.querySelector('.qa-messages'),
      input: this.root.querySelector('.qa-input'),
      send: this.root.querySelector('.qa-send'),
      mic: this.root.querySelector('.qa-mic'),
      attach: this.root.querySelector('.qa-attach'),
      attachInput: this.root.querySelector('.qa-attach-input'),
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
      if (self.isOpen) self.close();
      else self.open();
    });
    if (this.els.panelClose) {
      this.els.panelClose.addEventListener('click', function () {
        self.close();
      });
    }
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
        self._phraseMapLang = null;
        self.ensurePhraseMap();
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
    if (this.els.attach && this.els.attachInput) {
      this.els.attach.addEventListener('click', function () {
        if (self._uploadInFlight) return;
        self.els.attachInput.click();
      });
      this.els.attachInput.addEventListener('change', function () {
        var files = self.els.attachInput.files;
        self.els.attachInput.value = '';
        self.handleComposerUploadPick(files);
      });
    }
  };

  function parseUaBrowser(ua) {
    ua = String(ua || '');
    if (/Edg\//i.test(ua)) return 'Edge';
    if (/Chrome\//i.test(ua) && !/Edg/i.test(ua)) return 'Chrome';
    if (/Firefox\//i.test(ua)) return 'Firefox';
    if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) return 'Safari';
    return '';
  }

  function parseUaOs(ua) {
    ua = String(ua || '');
    if (/Windows/i.test(ua)) return 'Windows';
    if (/Mac OS X|Macintosh/i.test(ua)) return 'macOS';
    if (/Android/i.test(ua)) return 'Android';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
    if (/Linux/i.test(ua)) return 'Linux';
    return '';
  }

  QualityAssistantWidget.prototype.buildSessionContextPayload = function () {
    var loc = global.location || {};
    var ua = (global.navigator && global.navigator.userAgent) || '';
    var params = new URLSearchParams(loc.search || '');
    var ctx = Object.assign({}, this.clientContext || {});
    return Object.assign(ctx, {
      sessionId: this.sessionId,
      userEngaged: !!this._userHasInteracted,
      sourceUrl: loc.href || '',
      device: /Mobi|Android|iPhone|iPad/i.test(ua) ? 'Mobile' : 'Desktop',
      browser: parseUaBrowser(ua),
      os: parseUaOs(ua),
      channel: ctx.channel || 'Web',
      utm_campaign: params.get('utm_campaign') || ctx.utm_campaign || '',
      utm_content: params.get('utm_content') || ctx.utm_content || '',
      utm_medium: params.get('utm_medium') || ctx.utm_medium || '',
      utm_source: params.get('utm_source') || ctx.utm_source || '',
      utm_term: params.get('utm_term') || ctx.utm_term || '',
    });
  };

  QualityAssistantWidget.prototype.pushSessionContext = function () {
    if (!this.apiBase || !this.sessionId || this.qaMode) return;
    var payload = this.buildSessionContextPayload();
    fetch(this.apiBase + '/api/session-context', {
      method: 'POST',
      headers: this.qaApiHeaders(),
      body: JSON.stringify(this.withQaBody(payload)),
    }).catch(function () {});
  };

  QualityAssistantWidget.prototype.fetchConfig = function () {
    var self = this;
    if (!this.apiBase) return;
    this.pushSessionContext();
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
    this.ensurePhraseMap();
  };

  function getMultiLanguageCfg() {
    return (getRootCfg().features || {}).multiLanguage || {};
  }

  function getTranslationOverrides(lang) {
    var ml = getMultiLanguageCfg();
    var map = ml.translationOverridesByLanguage || {};
    return map[lang] || null;
  }

  function applyTranslationOverride(text, lang) {
    var t = String(text == null ? '' : text).trim();
    if (!t || lang === 'en' || !lang) return text;
    var overrides = getTranslationOverrides(lang);
    if (overrides && overrides[t] != null) return String(overrides[t]);
    return text;
  }

  function usePhraseTranslationFile() {
    var ml = getMultiLanguageCfg();
    return ml.usePhraseTranslationFile === true;
  }

  function clientPhraseLine(text, map) {
    if (!map || text == null) return text;
    var k = String(text)
      .trim()
      .replace(/\u2026/g, '...')
      .replace(/\s+/g, ' ');
    if (!k) return text;
    if (map[k] != null) return String(map[k]);
    var lower = k.toLowerCase();
    if (map[lower] != null) return String(map[lower]);
    return text;
  }

  QualityAssistantWidget.prototype.ensurePhraseMap = function () {
    var self = this;
    var lang = this.language || 'en';
    if (!usePhraseTranslationFile() || lang === 'en' || !this.apiBase) {
      this._phraseMap = null;
      this._phraseMapLang = null;
      return Promise.resolve();
    }
    if (this._phraseMapLang === lang && this._phraseMap) {
      return Promise.resolve();
    }
    return fetch(
      this.apiBase +
        '/api/phrase-translations?lang=' +
        encodeURIComponent(lang)
    )
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        self._phraseMap = (data && data.map) || {};
        self._phraseMapLang = lang;
      })
      .catch(function () {
        self._phraseMap = null;
        self._phraseMapLang = null;
      });
  };

  QualityAssistantWidget.prototype.applyClientPhrasePayload = function (data) {
    if (!data || !this._phraseMap || this.language === 'en') return data;
    var map = this._phraseMap;
    var t = function (s) {
      return clientPhraseLine(s, map);
    };

    if (data.reply) data.reply = String(data.reply).split('\n').map(t).join('\n');
    if (data.chipHeading) data.chipHeading = t(data.chipHeading);

    (data.chips || []).forEach(function (c) {
      var send = c.sendMessage || c.message || c.label || '';
      c.sendMessage = send;
      c.message = send;
      c.label = t(c.label || c.message || '');
    });

    (data.dropdowns || []).forEach(function (d) {
      if (d.message) d.message = t(d.message);
      if (d.placeholder) d.placeholder = t(d.placeholder);
      (d.options || []).forEach(function (opt) {
        opt.label = t(opt.label || opt.value || '');
      });
    });

    (data.galleries || []).forEach(function (g) {
      if (g.message) g.message = t(g.message);
      (g.images || []).forEach(function (img) {
        if (img.name) img.name = t(img.name);
        if (img.title) img.title = t(img.title);
      });
    });

    (data.cardCarousels || []).forEach(function (car) {
      if (car.message) car.message = t(car.message);
      (car.cards || []).forEach(function (card) {
        if (card.title) card.title = t(card.title);
        if (card.subtitle) card.subtitle = t(card.subtitle);
        if (card.ctaLabel) card.ctaLabel = t(card.ctaLabel);
        (card.buttons || []).forEach(function (btn) {
          var send = btn.message || btn.label || '';
          btn.message = send;
          btn.label = t(btn.label || '');
        });
      });
    });

    (data.infoCards || []).forEach(function (card) {
      if (card.title) card.title = t(card.title);
      if (card.subtitle) card.subtitle = t(card.subtitle);
      if (card.body) card.body = t(card.body);
      (card.buttons || []).forEach(function (btn) {
        var send = btn.message || btn.label || '';
        btn.message = send;
        btn.label = t(btn.label || '');
      });
    });

    (data.downloads || []).forEach(function (d) {
      if (d.label) d.label = t(d.label);
    });

    (data.replyParts || []).forEach(function (p) {
      if (p.text) p.text = t(p.text);
    });

    return data;
  };

  QualityAssistantWidget.prototype.shouldAutoTranslateReplies = function () {
    var ml = getMultiLanguageCfg();
    if (ml.usePhraseTranslationFile === true) return false;
    if (ml.autoTranslateBotReplies !== true) return false;
    var ui = this.language || 'en';
    return ui !== 'en';
  };

  QualityAssistantWidget.prototype.maybeTranslateBotPayload = function (data) {
    var self = this;
    if (
      !data ||
      data.localizedFromFile ||
      data.localizedFromPhrases ||
      !this.shouldAutoTranslateReplies() ||
      !this.apiBase
    ) {
      return Promise.resolve(data);
    }
    var ml = getMultiLanguageCfg();
    var lang = this.language;
    var source =
      String(
        ml.translationSourceLanguage ||
          ml.alwaysUseDialogflowLanguage ||
          ml.intentLanguage ||
          'en'
      ).trim() || 'en';
    var jobs = [];

    function queue(text, applyFn) {
      var raw = String(text == null ? '' : text);
      if (!raw.trim()) return;
      var overridden = applyTranslationOverride(raw, lang);
      if (overridden !== raw) {
        applyFn(overridden);
        return;
      }
      jobs.push({ text: raw.trim(), apply: applyFn });
    }

    queue(data.reply, function (t) {
      data.reply = t;
    });
    (data.replyParts || []).forEach(function (p, i) {
      if (p.type === 'text' && p.text) {
        queue(p.text, function (t) {
          data.replyParts[i].text = t;
        });
      }
      if (p.type === 'link' && p.text) {
        queue(p.text, function (t) {
          data.replyParts[i].text = t;
        });
      }
    });
    queue(data.chipHeading, function (t) {
      data.chipHeading = t;
    });
    (data.chips || []).forEach(function (c, i) {
      queue(c.label, function (t) {
        data.chips[i].label = t;
      });
    });
    (data.dropdowns || []).forEach(function (d, i) {
      queue(d.message, function (t) {
        data.dropdowns[i].message = t;
      });
      queue(d.placeholder, function (t) {
        data.dropdowns[i].placeholder = t;
      });
      (d.options || []).forEach(function (opt, j) {
        queue(opt.label, function (t) {
          data.dropdowns[i].options[j].label = t;
        });
      });
    });
    (data.galleries || []).forEach(function (g, i) {
      queue(g.message, function (t) {
        data.galleries[i].message = t;
      });
    });
    (data.cardCarousels || []).forEach(function (car, ci) {
      queue(car.message, function (t) {
        data.cardCarousels[ci].message = t;
      });
      (car.cards || []).forEach(function (card, ki) {
        queue(card.title, function (t) {
          data.cardCarousels[ci].cards[ki].title = t;
        });
        queue(card.subtitle, function (t) {
          data.cardCarousels[ci].cards[ki].subtitle = t;
        });
        queue(card.ctaLabel, function (t) {
          data.cardCarousels[ci].cards[ki].ctaLabel = t;
        });
        (card.buttons || []).forEach(function (btn, bi) {
          queue(btn.label, function (t) {
            data.cardCarousels[ci].cards[ki].buttons[bi].label = t;
          });
        });
      });
    });

    if (!jobs.length) return Promise.resolve(data);

    var texts = jobs.map(function (j) {
      return j.text;
    });

    return fetch(self.apiBase + '/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        texts: texts,
        targetLanguageCode: lang,
        sourceLanguageCode: source,
      }),
    })
      .then(function (res) {
        return res.json().then(function (body) {
          return { ok: res.ok, body: body };
        });
      })
      .then(function (result) {
        if (!result.ok || !result.body || !Array.isArray(result.body.translations)) {
          return data;
        }
        result.body.translations.forEach(function (translated, idx) {
          if (jobs[idx]) jobs[idx].apply(String(translated));
        });
        return data;
      })
      .catch(function () {
        return data;
      });
  };

  QualityAssistantWidget.prototype.getDialogflowLang = function () {
    var ml = (getRootCfg().features || {}).multiLanguage || {};
    var fixed = String(
      ml.alwaysUseDialogflowLanguage || ml.intentLanguage || ''
    ).trim();
    if (fixed) return fixed;
    return this.langMap[this.language]
      ? this.langMap[this.language].df
      : 'en';
  };

  QualityAssistantWidget.prototype.applyDialogflowResult = function (result) {
    var self = this;
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

    var data = result.data || {};
    if (data.dialogflowProjectId) {
      this._activeDialogflowProjectId = String(data.dialogflowProjectId).trim();
    }
    if (data.orchestrationMode) this._orchMode = data.orchestrationMode;
    if (data.orchestrationChildId != null) {
      this._orchChildId = String(data.orchestrationChildId || '');
    }
    if (data.sessionParameters) {
      this.mergeSessionParameters(data.sessionParameters);
    }
    if (data.humanActive || data.agentConnected) {
      this._liveAgentHumanActive = true;
      this._liveAgentWaiting = false;
    }
    if (data.liveAgent) {
      if (data.humanActive || data.agentConnected) {
        this._liveAgentHumanActive = true;
        this._liveAgentWaiting = false;
      } else {
        this._liveAgentHumanActive = false;
        this._liveAgentWaiting = true;
      }
      if (typeof this.startLiveAgentMode === 'function') {
        this.startLiveAgentMode(data);
      }
      return;
    }
    if (this.isHumanChatActive()) {
      return;
    }

    this.ensurePhraseMap()
      .then(function () {
        if (!result.data.localizedFromPhrases) {
          self.applyClientPhrasePayload(result.data);
        }
        return self.maybeTranslateBotPayload(result.data);
      })
      .then(function (payload) {
      var richOn = isRichContentEnabled();
      var chips = richOn && payload.chips ? payload.chips : [];
      var infoCards = richOn && payload.infoCards ? payload.infoCards : [];
      var downloads = richOn && payload.downloads ? payload.downloads : [];
      var dropdowns = payload.dropdowns || [];
      var galleries = payload.galleries || [];
      var cardCarousels =
        richOn && payload.cardCarousels ? payload.cardCarousels : [];
      var forms = richOn && payload.forms ? payload.forms : [];
      forms = self.resolveFormRequestsForDisplay(forms);
      var reply = (payload.reply || '').trim();
      var replyParts = payload.replyParts || [];
      var chipHeading = (payload.chipHeading || '').trim();
      var hasContent =
        reply ||
        replyParts.length ||
        chips.length ||
        chipHeading ||
        infoCards.length ||
        downloads.length ||
        dropdowns.length ||
        galleries.length ||
        cardCarousels.length ||
        forms.length;
      if (!hasContent) {
        reply = 'No response.';
        hasContent = true;
      }
      if (hasContent) {
        self.appendMessage('bot', reply, {
          replyParts: replyParts,
          replyHtml: payload.replyHtml || '',
          chips: chips,
          chipHeading: chipHeading,
          infoCards: infoCards,
          downloads: downloads,
          dropdowns: dropdowns,
          galleries: galleries,
          cardCarousels: cardCarousels,
          forms: forms,
          intentIsFallback: !!payload.intentIsFallback,
          intent: payload.intent || '',
        });
      }
    });
  };

  QualityAssistantWidget.prototype.postToDialogflow = function (body, opts) {
    opts = opts || {};
    var self = this;
    if (this.isHumanChatActive()) {
      return Promise.resolve();
    }
    if (!this.apiBase) {
      return Promise.resolve();
    }
    body.uiLanguageCode = body.uiLanguageCode || this.language || 'en';
    if (!body.languageCode) {
      body.languageCode = this.getDialogflowLang();
    }
    if (opts.skipIfSending && this.isSending) {
      return Promise.resolve();
    }
    if (!opts.silent && this.isSending && !opts.allowWhileSending) {
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
      headers: this.qaApiHeaders(),
      body: JSON.stringify(this.withQaBody(this.withDialogflowRouting_(body))),
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
    if (this.isHumanChatActive()) return;
    var cfg = getWelcomeEventCfg();
    if (cfg.enabled === false) return;
    if (this._welcomeEventSent || this._welcomeEventInFlight || this.isSending) {
      return;
    }
    var name = resolveWelcomeEventName_();
    if (!name) return;
    var self = this;
    this._welcomeEventInFlight = true;
    this.postToDialogflow(
      this.withDialogflowRouting_({
        event: name,
        sessionId: this.sessionId,
        languageCode: this.getDialogflowLang(),
      })
    ).finally(function () {
      self._welcomeEventInFlight = false;
      self._welcomeEventSent = true;
    });
  };

  QualityAssistantWidget.prototype.triggerEndChatEvent = function (opts) {
    opts = opts || {};
    if (this.isHumanChatActive()) return Promise.resolve();
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

  QualityAssistantWidget.prototype.markUserInteracted = function () {
    this._userHasInteracted = true;
  };

  QualityAssistantWidget.prototype.resetIdleTimer = function () {
    var cfg = getEndChatEventCfg();
    if (cfg.enabled === false || cfg.triggerOnIdle === false) return;
    if (!this.isOpen) return;
    if (cfg.requireUserInteraction !== false && !this._userHasInteracted) {
      this.clearIdleTimer();
      return;
    }
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
    if (cfg.requireUserInteraction !== false && !this._userHasInteracted) {
      return;
    }
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
    this.root.classList.remove('qa-widget--chat-open');
    this.els.panel.classList.remove('qa-panel--open');
    this.updateLauncherCloseBubble();
    this.updateLauncherStripVisibility();
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

  QualityAssistantWidget.prototype.setLauncherCloseMode = function (isClose) {
    var btn = this.els.launcher;
    if (!btn) return;
    var openEl = btn.querySelector('.qa-launcher__state--open');
    var closeEl = btn.querySelector('.qa-launcher__state--close');
    if (openEl) {
      openEl.hidden = !!isClose;
      openEl.setAttribute('aria-hidden', isClose ? 'true' : 'false');
    }
    if (closeEl) {
      closeEl.hidden = !isClose;
      closeEl.setAttribute('aria-hidden', isClose ? 'false' : 'true');
    }
    btn.setAttribute('aria-label', isClose ? 'Close chat' : 'Open chat');
  };

  QualityAssistantWidget.prototype.syncLauncherStack = function () {
    if (!this.root) return;
    var stackPx = getLauncherStackPx(!!this.isOpen);
    this.root.style.setProperty('--qa-launcher-stack', stackPx + 'px');
    var noCloseBubble = !!this.isOpen && !isLauncherCloseBubbleEnabled();
    this.root.classList.toggle('qa-widget--no-close-bubble', noCloseBubble);
    var boostPx = noCloseBubble ? getPanelHeightExtraPx(true) : 0;
    this.root.style.setProperty('--qa-panel-height-boost', boostPx + 'px');

    var panel = this.els.panel || this.root.querySelector('.qa-panel');
    if (!panel) return;
    if (this.isOpen && boostPx > 0) {
      var openH = computeOpenPanelHeightPx();
      panel.style.height = openH + 'px';
      panel.style.maxHeight = openH + 'px';
    } else {
      panel.style.height = '';
      panel.style.maxHeight = '';
    }
  };

  QualityAssistantWidget.prototype.updateLauncherCloseBubble = function () {
    var wrap = this.els.launcherWrap;
    if (!wrap) return;
    var showCloseBubble = isLauncherCloseBubbleEnabled();

    wrap.classList.remove('qa-launcher--hidden');

    if (!this.isOpen) {
      this.setLauncherCloseMode(false);
      this.syncLauncherStack();
      return;
    }

    if (!showCloseBubble) {
      wrap.classList.add('qa-launcher--hidden');
      this.syncLauncherStack();
      return;
    }

    this.setLauncherCloseMode(true);
    this.syncLauncherStack();
  };

  QualityAssistantWidget.prototype.open = function () {
    this.isOpen = true;
    this.root.classList.add('qa-widget--chat-open');
    this.els.panel.classList.add('qa-panel--open');
    this.updateLauncherCloseBubble();
    this.updateLauncherStripVisibility();
    this.els.input.focus();
    this.maybeTriggerWelcomeEvent();
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
      self.resetOrchestrationState();
      self._welcomeEventSent = false;
      self._welcomeEventInFlight = false;
      self._endChatEventSent = false;
      self._endChatEventInFlight = false;
      self._userHasInteracted = false;
      self.clientContext = {};
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

  QualityAssistantWidget.prototype.agentHumanAvatarHtml = function () {
    var ap = getRootCfg().agentPersona || {};
    if (ap.mode === 'image' && ap.imageUrl) {
      return (
        '<img src="' +
        this.escape(ap.imageUrl) +
        '" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover"/>'
      );
    }
    return ICONS.agentHuman;
  };

  QualityAssistantWidget.prototype.buildPersonaRow = function (role, options) {
    options = options || {};
    var bp = getRootCfg().botPersona || {};
    var up = getRootCfg().userPersona || {};
    var p = role === 'bot' ? bp : up;
    var name =
      options.personaLabel ||
      p.label ||
      (role === 'bot' ? 'Quality' : 'You');
    var timeStr = formatPersonaTime(p);

    var row = document.createElement('div');
    row.className = 'qa-msg__persona-row';

    var avatar = document.createElement('div');
    avatar.className = 'qa-msg__avatar qa-msg__avatar--' + role;
    if (options.liveAgentHuman) {
      avatar.classList.add('qa-msg__avatar--agent-human');
    } else if (role === 'bot' && bp.mode === 'image' && bp.imageUrl) {
      avatar.classList.add('qa-msg__avatar--image');
    }
    if (role === 'user') {
      avatar.classList.add('qa-msg__avatar--sm');
    }
    avatar.setAttribute('aria-hidden', 'true');
    avatar.innerHTML = options.liveAgentHuman
      ? this.agentHumanAvatarHtml()
      : role === 'bot'
        ? this.botAvatarHtml()
        : this.userAvatarHtml();

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

  QualityAssistantWidget.prototype.wrapScrollTrack = function (track, options) {
    options = options || {};
    var shell = document.createElement('div');
    shell.className = 'qa-scroll-strip';

    var viewport = document.createElement('div');
    viewport.className = 'qa-scroll-strip__viewport';
    viewport.appendChild(track);

    var prev = document.createElement('button');
    prev.type = 'button';
    prev.className = 'qa-scroll-strip__nav qa-scroll-strip__prev';
    prev.setAttribute('aria-label', 'Previous');
    prev.innerHTML = '&#8249;';

    var next = document.createElement('button');
    next.type = 'button';
    next.className = 'qa-scroll-strip__nav qa-scroll-strip__next';
    next.setAttribute('aria-label', 'Next');
    next.innerHTML = '&#8250;';

    shell.appendChild(viewport);
    shell.appendChild(prev);
    shell.appendChild(next);

    var autoScrollActive = options.autoScroll !== false;
    var stopOnInteraction = options.stopAutoScrollOnInteraction === true;
    var autoScrollStopped = false;

    function stopAutoScrollPermanent() {
      if (!autoScrollActive || autoScrollStopped) return;
      autoScrollStopped = true;
      shell.classList.remove('qa-scroll-strip--auto');
      shell.setAttribute('data-auto-scroll', 'stopped');
    }

    shell.stopAutoScrollPermanent = stopAutoScrollPermanent;

    function onUserInteraction() {
      if (stopOnInteraction) stopAutoScrollPermanent();
    }

    function scrollStep(delta) {
      onUserInteraction();
      var first = track.firstElementChild;
      var gap = 10;
      var step = first
        ? first.getBoundingClientRect().width + gap
        : Math.max(100, viewport.clientWidth * 0.8);
      viewport.scrollBy({ left: delta * step, behavior: 'smooth' });
    }

    prev.addEventListener('click', function () {
      scrollStep(-1);
    });
    next.addEventListener('click', function () {
      scrollStep(1);
    });

    if (stopOnInteraction) {
      track.addEventListener('click', onUserInteraction);
      viewport.addEventListener('pointerdown', onUserInteraction);
      viewport.addEventListener(
        'wheel',
        function (e) {
          if (e && e.isTrusted !== false) onUserInteraction();
        },
        { passive: true }
      );
      viewport.addEventListener('touchstart', onUserInteraction, { passive: true });
    }

    function updateNav() {
      var maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
      var show = maxScroll > 4;
      prev.hidden = !show;
      next.hidden = !show;
      prev.disabled = viewport.scrollLeft <= 2;
      next.disabled = viewport.scrollLeft >= maxScroll - 2;
    }

    viewport.addEventListener('scroll', updateNav, { passive: true });
    if (typeof ResizeObserver !== 'undefined') {
      var ro = new ResizeObserver(updateNav);
      ro.observe(viewport);
      ro.observe(track);
    }
    setTimeout(updateNav, 0);
    setTimeout(updateNav, 400);

    if (autoScrollActive) {
      shell.setAttribute('data-auto-scroll', 'on');
      var secondsPerItem =
        options.secondsPerItem != null ? Number(options.secondsPerItem) : 4;
      if (!secondsPerItem || secondsPerItem < 0.5) secondsPerItem = 4;

      var respectReducedMotion = options.respectReducedMotion === true;
      var reduceMotion =
        respectReducedMotion &&
        global.matchMedia &&
        global.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (!reduceMotion) {
        shell.classList.add('qa-scroll-strip--auto');
        var autoLastTime = 0;

        function getMaxScroll() {
          return Math.max(
            0,
            track.scrollWidth - viewport.clientWidth,
            viewport.scrollWidth - viewport.clientWidth
          );
        }

        function itemStepPx() {
          var first = track.firstElementChild;
          if (!first) return 200;
          var w = first.offsetWidth || first.getBoundingClientRect().width;
          return (w > 0 ? w : 200) + 10;
        }

        function autoScrollTick(now) {
          global.requestAnimationFrame(autoScrollTick);
          if (autoScrollStopped) return;
          var maxScroll = getMaxScroll();
          if (maxScroll <= 4) {
            autoLastTime = 0;
            return;
          }
          if (!autoLastTime) {
            autoLastTime = now;
            return;
          }
          var dt = Math.min(now - autoLastTime, 48);
          autoLastTime = now;
          var step = itemStepPx();
          var pxPerMs = step / (secondsPerItem * 1000);
          viewport.scrollLeft += pxPerMs * dt;
          if (viewport.scrollLeft >= maxScroll - 1) {
            viewport.scrollLeft = 0;
          }
          updateNav();
        }

        global.requestAnimationFrame(autoScrollTick);
        setTimeout(updateNav, 100);
        setTimeout(updateNav, 800);
      }
    }

    return shell;
  };

  QualityAssistantWidget.prototype.buildCardCarouselEl = function (carousel) {
    var wrap = document.createElement('div');
    wrap.className = 'qa-card-carousel';
    var track = document.createElement('div');
    track.className = 'qa-card-carousel__track';
    track.setAttribute('role', 'list');
    var self = this;

    var lightboxImages = (carousel.cards || [])
      .filter(function (c) {
        return c && c.imageUrl;
      })
      .map(function (c) {
        var name = [c.title, c.subtitle].filter(Boolean).join(' — ');
        return { url: c.imageUrl, name: name || '' };
      });
    var lightboxIndex = 0;

    (carousel.cards || []).forEach(function (card) {
      var article = document.createElement('article');
      article.className = 'qa-card-carousel__card';
      article.setAttribute('role', 'listitem');
      if (card.id) article.setAttribute('data-card-id', card.id);

      if (card.imageUrl) {
        var currentLbIndex = lightboxIndex;
        lightboxIndex += 1;
        var mediaBtn = document.createElement('button');
        mediaBtn.type = 'button';
        mediaBtn.className =
          'qa-card-carousel__media qa-card-carousel__media-btn';
        mediaBtn.setAttribute(
          'aria-label',
          'View full image' + (card.title ? ': ' + card.title : '')
        );
        mediaBtn.addEventListener('click', function () {
          var strip = mediaBtn.closest('.qa-scroll-strip');
          if (strip && strip.stopAutoScrollPermanent) {
            strip.stopAutoScrollPermanent();
          }
          self.openGalleryLightbox(lightboxImages, currentLbIndex);
        });
        var img = document.createElement('img');
        img.className = 'qa-card-carousel__img';
        img.src = card.imageUrl;
        img.alt = card.title || '';
        img.loading = 'lazy';
        img.draggable = false;
        img.onerror = function () {
          mediaBtn.style.display = 'none';
        };
        mediaBtn.appendChild(img);
        article.appendChild(mediaBtn);
      }

      if (card.title) {
        var titleEl = document.createElement('div');
        titleEl.className = 'qa-card-carousel__title';
        titleEl.textContent = card.title;
        article.appendChild(titleEl);
      }

      if (card.subtitle) {
        var subEl = document.createElement('div');
        subEl.className = 'qa-card-carousel__subtitle';
        subEl.textContent = card.subtitle;
        article.appendChild(subEl);
      }

      var buttons = card.buttons || [];
      if (!buttons.length && card.ctaLabel) {
        buttons = [
          {
            label: card.ctaLabel,
            message: card.ctaMessage || card.ctaLabel,
            href: '',
          },
        ];
      }
      if (buttons.length) {
        var actions = document.createElement('div');
        actions.className = 'qa-card-carousel__actions';
        buttons.forEach(function (btn) {
          var label = String(btn.label || '').trim();
          if (!label) return;
          var message = String(btn.message || label).trim();
          if (btn.href && /^https?:\/\//i.test(btn.href)) {
            var link = document.createElement('a');
            link.className = 'qa-chip qa-chip--bot qa-card-carousel__cta';
            link.href = btn.href;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = label;
            actions.appendChild(link);
            return;
          }
          var chip = document.createElement('button');
          chip.type = 'button';
          chip.className = 'qa-chip qa-chip--bot qa-card-carousel__cta';
          chip.setAttribute('data-message', message);
          chip.textContent = label;
          actions.appendChild(chip);
        });
        if (actions.childNodes.length) article.appendChild(actions);
      }

      track.appendChild(article);
    });

    if (track.childNodes.length) {
      wrap.appendChild(this.wrapScrollTrack(track, getScrollStripOpts('cardCarousel')));
    }
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
        var strip = item.closest('.qa-scroll-strip');
        if (strip && strip.stopAutoScrollPermanent) {
          strip.stopAutoScrollPermanent();
        }
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
    if (track.childNodes.length) {
      wrap.appendChild(this.wrapScrollTrack(track, getScrollStripOpts('gallery')));
    }
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
      var message = opt.value || opt.sendValue || opt.label || '';
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

    var selectPrompt =
      dropdown.message || dropdown.placeholder || 'Choose…';
    var showLabel =
      dropdown.message &&
      !opts.hideLabel &&
      String(dropdown.message).trim() !== String(selectPrompt).trim();

    if (showLabel) {
      var label = document.createElement('label');
      label.className = 'qa-inline-select__label';
      label.setAttribute('for', selectId);
      label.textContent = dropdown.message;
      wrap.appendChild(label);
    }

    var select = document.createElement('select');
    select.id = selectId;
    select.className = 'qa-inline-select__control';
    select.setAttribute(
      'aria-label',
      dropdown.message || selectPrompt || 'Select an option'
    );

    var placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = selectPrompt;
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

  QualityAssistantWidget.prototype.removeFormCard = function (formEl) {
    if (!formEl) return;
    formEl.classList.add('qa-form--closed');
    var row = formEl.closest('.qa-msg');
    var body = formEl.closest('.qa-msg__body');
    formEl.remove();

    /* Keep agent text/chips in the same turn — only drop the whole row if nothing remains */
    if (!body || !row) return;
    var hasContent = false;
    Array.prototype.forEach.call(body.children, function (child) {
      if (!child.classList.contains('qa-msg__persona-row')) {
        hasContent = true;
      }
    });
    if (!hasContent) row.remove();
  };

  QualityAssistantWidget.prototype.runFormDialogflowAction = function (action, opts) {
    opts = opts || {};
    if (this.isHumanChatActive()) return Promise.resolve();
    if (!action) return Promise.resolve();
    this._userHasInteracted = true;
    this.markUserInteracted();
    var body = {
      sessionId: this.sessionId,
      languageCode: this.getDialogflowLang(),
    };
    if (action.type === 'event' && action.event) {
      body.event = action.event;
    } else if (action.message) {
      body.message = action.message;
    } else {
      return Promise.resolve();
    }
    return this.postToDialogflow(
      body,
      Object.assign(
        {
          allowWhileSending: true,
          applyResponse: opts.applyResponse !== false,
          showTyping: opts.showTyping !== false,
        },
        opts
      )
    );
  };

  QualityAssistantWidget.prototype.handleOtpResend = function (payload) {
    var self = this;
    payload = payload || {};
    var values = payload.values || {};
    var def = payload.def || {};
    var req = payload.request || {};
    var statusEl = payload.statusEl;

    this.clientContext = Object.assign({}, this.clientContext || {}, {
      mobile: values.mobile || this.clientContext.mobile,
      dial_code: values.dial_code || this.clientContext.dial_code,
    });

    var dataMsg =
      global.QAChatForm && global.QAChatForm.formatOtpResend
        ? global.QAChatForm.formatOtpResend(values, def)
        : 'resend_otp';

    var onResend =
      global.QAChatForm && global.QAChatForm.resolveFormAction
        ? global.QAChatForm.resolveFormAction(
            req.onResend || def.resendOtpAction || 'query:resend_otp'
          )
        : null;

    return this.postToDialogflow(
      { message: dataMsg, sessionId: this.sessionId, languageCode: this.getDialogflowLang() },
      { applyResponse: !onResend, showTyping: !onResend, allowWhileSending: true }
    )
      .then(function () {
        if (!onResend) return;
        return self.runFormDialogflowAction(onResend, {
          allowWhileSending: true,
          applyResponse: true,
          showTyping: true,
        });
      })
      .then(function () {
        if (statusEl) statusEl.hidden = true;
      })
      .catch(function () {
        if (statusEl) {
          statusEl.hidden = false;
          statusEl.textContent = 'Could not resend OTP. Try again.';
        }
      });
  };

  QualityAssistantWidget.prototype.buildRichMetaFromMessageOptions = function (
    options
  ) {
    options = options || {};
    var rich = {};
    var has = false;
    if (options.chips && options.chips.length) {
      rich.chips = options.chips;
      has = true;
    }
    if (options.chipHeading && String(options.chipHeading).trim()) {
      rich.chipHeading = String(options.chipHeading).trim();
      has = true;
    }
    if (options.infoCards && options.infoCards.length) {
      rich.infoCards = options.infoCards;
      has = true;
    }
    if (options.downloads && options.downloads.length) {
      rich.downloads = options.downloads;
      has = true;
    }
    if (options.dropdowns && options.dropdowns.length) {
      var d0 = options.dropdowns[0];
      rich.action = 'dfchat_inline_select';
      rich.options = d0 && d0.options ? d0.options : [];
      rich.placeholder = (d0 && d0.message) || '';
      has = true;
    }
    if (options.galleries && options.galleries.length) {
      var g0 = options.galleries[0];
      rich.action = 'open_gallery';
      rich.urls = g0 && g0.urls ? g0.urls : [];
      rich.message = (g0 && g0.message) || '';
      has = true;
    }
    if (options.cardCarousels && options.cardCarousels.length) {
      var c0 = options.cardCarousels[0];
      rich.action = 'open_card_carousel';
      rich.cards = c0 && c0.cards ? c0.cards : [];
      rich.message = (c0 && c0.message) || '';
      has = true;
    }
    if (options.forms && options.forms.length) {
      var f0 = options.forms[0];
      rich.action = 'open_form';
      rich.form_id = (f0 && (f0.formId || f0.form_id)) || '';
      rich.message = (f0 && f0.message) || '';
      has = true;
    }
    return has ? { rich: rich } : undefined;
  };

  QualityAssistantWidget.prototype.messageHasVisibleContent = function (
    role,
    text,
    options
  ) {
    options = options || {};
    var textStr = text == null ? '' : String(text).trim();
    var replyParts = options.replyParts || [];
    var dropdowns = options.dropdowns || [];
    var galleries = options.galleries || [];
    var cardCarousels = options.cardCarousels || [];
    var forms = options.forms || [];
    var chips = options.chips || [];
    var chipHeading = (options.chipHeading || '').trim();
    var infoCards = options.infoCards || [];
    var downloads = options.downloads || [];
    var skipBubbleForDropdown =
      role === 'bot' &&
      textStr &&
      (dropdowns.some(function (d) {
        return String(d.message || '').trim() === textStr;
      }) ||
        galleries.some(function (g) {
          return String(g.message || '').trim() === textStr;
        }) ||
        cardCarousels.some(function (c) {
          return String(c.message || '').trim() === textStr;
        }) ||
        forms.some(function (f) {
          return String(f.message || '').trim() === textStr;
        }));

    if ((textStr || replyParts.length) && !skipBubbleForDropdown) return true;
    if (role === 'bot' && chipHeading) return true;
    if (role === 'bot' && chips.length) return true;
    if (role === 'bot' && infoCards.length) return true;
    if (role === 'bot' && downloads.length) return true;
    if (role === 'bot' && galleries.length) return true;
    if (role === 'bot' && cardCarousels.length) return true;
    if (role === 'bot' && dropdowns.length) return true;
    if (role === 'bot' && forms.length) return true;
    return false;
  };

  QualityAssistantWidget.prototype.transcriptTextFromMessage = function (
    role,
    text,
    options
  ) {
    options = options || {};
    var textStr = text == null ? '' : String(text).trim();
    var replyParts = options.replyParts || [];
    var dropdowns = options.dropdowns || [];
    var galleries = options.galleries || [];
    var cardCarousels = options.cardCarousels || [];
    var forms = options.forms || [];
    var chipHeading = (options.chipHeading || '').trim();
    var skipBubbleForDropdown =
      role === 'bot' &&
      textStr &&
      (dropdowns.some(function (d) {
        return String(d.message || '').trim() === textStr;
      }) ||
        galleries.some(function (g) {
          return String(g.message || '').trim() === textStr;
        }) ||
        cardCarousels.some(function (c) {
          return String(c.message || '').trim() === textStr;
        }) ||
        forms.some(function (f) {
          return String(f.message || '').trim() === textStr;
        }));

    if ((textStr || replyParts.length) && !skipBubbleForDropdown) {
      if (replyParts.length) {
        var joined = replyParts
          .map(function (p) {
            return p && p.text != null ? String(p.text).trim() : '';
          })
          .filter(Boolean)
          .join('\n');
        if (joined) return joined;
      }
      return textStr;
    }
    if (role === 'bot' && chipHeading) return chipHeading;
    if (role === 'bot' && forms.length) {
      var fm = forms[0] && forms[0].message;
      if (fm && String(fm).trim()) return String(fm).trim();
    }
    if (role === 'bot' && galleries.length) {
      var gm = galleries[0] && galleries[0].message;
      if (gm && String(gm).trim()) return String(gm).trim();
    }
    if (role === 'bot' && cardCarousels.length) {
      var cm = cardCarousels[0] && cardCarousels[0].message;
      if (cm && String(cm).trim()) return String(cm).trim();
    }
    if (role === 'bot' && dropdowns.length) {
      var dm = dropdowns[0] && dropdowns[0].message;
      if (dm && String(dm).trim()) return String(dm).trim();
    }
    return '';
  };

  QualityAssistantWidget.prototype.syncTranscriptFromMessage = function (
    role,
    text,
    options
  ) {
    options = options || {};
    if (options.skipTranscriptLog) return Promise.resolve();
    if (!this.messageHasVisibleContent(role, text, options)) {
      return Promise.resolve();
    }
    var line = this.transcriptTextFromMessage(role, text, options);
    var meta;
    if (role === 'bot') {
      meta = this.buildRichMetaFromMessageOptions(options) || {};
      if (options.intentIsFallback) {
        meta.intentIsFallback = true;
        meta.fallback = 'yes';
      }
      if (options.intent) meta.intent = String(options.intent);
      if (!Object.keys(meta).length) meta = undefined;
    }
    if (!line && !meta) return Promise.resolve();
    return this.appendTranscriptTurn(
      role,
      line || '(Rich content)',
      meta
    );
  };

  QualityAssistantWidget.prototype.appendTranscriptTurn = function (role, text, meta) {
    if (!this.apiBase || !this.sessionId || this.qaMode) return Promise.resolve();
    var t = text == null ? '' : String(text).trim();
    if (!t) return Promise.resolve();
    var body = {
      sessionId: this.sessionId,
      role: role || 'user',
      text: t,
    };
    if (meta && typeof meta === 'object') body.meta = meta;
    return fetch(this.apiBase + '/api/transcript/append', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(function () {
      return null;
    });
  };

  QualityAssistantWidget.prototype.handleFormClose = function (payload) {
    payload = payload || {};
    this.removeFormCard(payload.formEl);
    var formId = payload.formId ? String(payload.formId).trim() : '';
    if (formId) {
      this.appendTranscriptTurn('user', '__form_closed:' + formId);
    }
    var req = payload.request || {};
    var action =
      global.QAChatForm && global.QAChatForm.resolveFormAction
        ? global.QAChatForm.resolveFormAction(req.onCancel)
        : null;
    if (action) {
      this._userHasInteracted = true;
      this.runFormDialogflowAction(action);
    }
  };

  QualityAssistantWidget.prototype.getComposerUploadCfg = function () {
    return (getEffectiveCfg().features || {}).composerUpload || {};
  };

  QualityAssistantWidget.prototype.composerUploadLabel = function (map, fallback) {
    var cfg = this.getComposerUploadCfg();
    var m = (cfg && map) || {};
    return (
      m[this.language] ||
      m.en ||
      fallback ||
      ''
    );
  };

  QualityAssistantWidget.prototype.setComposerUploadBusy = function (busy) {
    if (this.els.attach) {
      this.els.attach.disabled = !!busy;
      this.els.attach.classList.toggle('qa-attach--busy', !!busy);
    }
  };

  QualityAssistantWidget.prototype.uploadDocumentNames = function (up, fallbackNames) {
    up = up || {};
    return (
      up.document_names ||
      (up.uploads || [])
        .map(function (u) {
          return u.original_name;
        })
        .filter(Boolean)
        .join(', ') ||
      String(fallbackNames || '').trim()
    );
  };

  QualityAssistantWidget.prototype.shouldShowUploadSuccessAck = function (up) {
    var cfg = this.getComposerUploadCfg();
    if (this.qaMode && up && up.simulated) return true;
    return cfg.showSuccessAck === true;
  };

  QualityAssistantWidget.prototype.shouldShowUploadingStatus = function () {
    var cfg = this.getComposerUploadCfg();
    return cfg.showUploadingStatus === true;
  };

  QualityAssistantWidget.prototype.buildUploadAckMessage = function (up, fallbackNames) {
    var cfg = this.getComposerUploadCfg();
    var names = this.uploadDocumentNames(up, fallbackNames);
    if (this.qaMode && up && up.simulated) {
      return this.composerUploadLabel(
        cfg.qaPreviewByLanguage,
        'QA test mode: upload preview only — file was not saved.'
      );
    }
    if (up && up.duplicate_skipped) {
      var dupTpl = this.composerUploadLabel(
        cfg.duplicateByLanguage,
        '✅ We already received your document(s): {files}'
      );
      return dupTpl.replace('{files}', names);
    }
    var tpl = this.composerUploadLabel(
      cfg.successByLanguage || cfg.confirmByLanguage,
      '✅ Upload successful! We received your document(s): {files}'
    );
    return tpl.replace('{files}', names);
  };

  QualityAssistantWidget.prototype.updateBotMessageText = function (row, text, kind) {
    if (!row) return;
    var bubble = row.querySelector('.qa-msg__bubble');
    if (!bubble) return;
    bubble.classList.remove('qa-msg__bubble--multiline');
    this.fillMessageBubble(bubble, String(text || ''), []);
    row.classList.remove('qa-msg--upload-success', 'qa-msg--upload-failed', 'qa-msg--upload-pending');
    if (kind === 'success') row.classList.add('qa-msg--upload-success');
    else if (kind === 'failed') row.classList.add('qa-msg--upload-failed');
    else if (kind === 'pending') row.classList.add('qa-msg--upload-pending');
    if (this.els.messages) {
      this.els.messages.scrollTop = this.els.messages.scrollHeight;
    }
  };

  QualityAssistantWidget.prototype.showUploadAcknowledgement = function (up, fallbackNames, statusRow) {
    if (!this.shouldShowUploadSuccessAck(up)) return;
    var msg = this.buildUploadAckMessage(up, fallbackNames);
    if (statusRow) {
      var kind = up && up.ok ? 'success' : 'failed';
      if (this.qaMode && up && up.simulated) kind = 'failed';
      this.updateBotMessageText(statusRow, msg, kind);
      return;
    }
    this.appendMessage('bot', msg, {
      messageKind: up && up.ok && !(this.qaMode && up.simulated) ? 'upload-success' : '',
    });
  };

  QualityAssistantWidget.prototype.handleComposerUploadPick = function (fileList) {
    var files = [];
    if (fileList && fileList.length) {
      for (var i = 0; i < fileList.length; i += 1) {
        if (fileList[i]) files.push(fileList[i]);
      }
    }
    if (!files.length) return;
    if (!this.apiBase) {
      this.appendMessage(
        'bot',
        'Chat server URL missing — reload the page and try again.'
      );
      return;
    }

    var self = this;
    var cfg = this.getComposerUploadCfg();
    var emoji = String(cfg.emoji || '📎').trim() || '📎';
    var names = files
      .map(function (f) {
        return f.name;
      })
      .filter(Boolean)
      .join(', ');

    this._userHasInteracted = true;
    this.noteUserActivity();
    this.setComposerUploadBusy(true);
    this.appendMessage('user', emoji + (names ? ' ' + names : ''));
    var statusRow = null;
    if (self.shouldShowUploadingStatus()) {
      var uploadingMsg = self.composerUploadLabel(
        cfg.uploadingByLanguage,
        'Uploading your document(s)…'
      );
      statusRow = self.appendMessage('bot', uploadingMsg, {
        skipTranscriptLog: true,
      });
      self.updateBotMessageText(statusRow, uploadingMsg, 'pending');
    }

    this.uploadFormDocuments(files, {}, { tag: 'composer' })
      .then(function (up) {
        if (statusRow && statusRow.parentNode) {
          statusRow.parentNode.removeChild(statusRow);
          statusRow = null;
        }
        if (up && up.ok) {
          var docNames = self.uploadDocumentNames(up, names);
          if (self.shouldShowUploadSuccessAck(up)) {
            self.appendMessage('bot', self.buildUploadAckMessage(up, names), {
              messageKind: 'upload-success',
              skipTranscriptLog: true,
            });
          }
          if (!self.qaMode) {
            self.appendTranscriptTurn('user', emoji + (docNames ? ' ' + docNames : ''));
            self.pushSessionContext();
          }
          return;
        }
        var failMsg = self.composerUploadLabel(
          cfg.failedByLanguage,
          (up && up.message) || 'Could not upload. Please try again.'
        );
        self.appendMessage('bot', 'Could not upload: ' + failMsg, {
          skipTranscriptLog: true,
        });
      })
      .catch(function (err) {
        if (statusRow && statusRow.parentNode) {
          statusRow.parentNode.removeChild(statusRow);
          statusRow = null;
        }
        self.appendMessage(
          'bot',
          self.composerUploadLabel(
            cfg.failedByLanguage,
            'Could not upload. Please try again.'
          ),
          { skipTranscriptLog: true }
        );
      })
      .finally(function () {
        self.setComposerUploadBusy(false);
      });
  };

  QualityAssistantWidget.prototype.uploadFormDocuments = function (files, values, request) {
    if (!this.apiBase) {
      return Promise.resolve({
        ok: false,
        message: 'Chat server URL missing — reload the page.',
      });
    }
    if (!files || !files.length) {
      return Promise.resolve({ ok: false, message: 'No files selected' });
    }
    if (this._uploadInFlight) {
      return this._uploadInFlight;
    }
    var ctx = this.clientContext || {};
    var vals = values || {};
    var fd = new FormData();
    fd.append('sessionId', this.sessionId);
    var uploadTag =
      (request && request.tag) ||
      (vals && vals.tag) ||
      this.pendingUploadTag ||
      '';
    uploadTag = String(uploadTag || '').trim();
    if (uploadTag) fd.append('tag', uploadTag);
    fd.append('channel', this.qaMode ? 'QA' : 'Web');
    var mobile = vals.mobile != null ? String(vals.mobile).trim() : String(ctx.mobile || '').trim();
    var dial = vals.dial_code != null ? String(vals.dial_code).trim() : String(ctx.dial_code || '').trim();
    if (mobile) fd.append('mobile', mobile);
    if (dial) fd.append('dial_code', dial);
    var customerName =
      vals.name != null ? String(vals.name).trim() : String(ctx.name || '').trim();
    var customerEmail =
      vals.email != null ? String(vals.email).trim() : String(ctx.email || '').trim();
    if (customerName) fd.append('name', customerName);
    if (customerEmail) fd.append('email', customerEmail);
    for (var i = 0; i < files.length; i += 1) {
      fd.append('files', files[i], files[i].name);
    }
    var self = this;
    var uploadHeaders = {};
    if (this.qaMode) uploadHeaders['X-QA-Mode'] = '1';
    this._uploadInFlight = fetch(this.apiBase + '/api/upload/documents', {
      method: 'POST',
      headers: uploadHeaders,
      body: fd,
    })
      .then(function (r) {
        return r.text().then(function (text) {
          var data = {};
          try {
            data = text ? JSON.parse(text) : {};
          } catch (parseErr) {
            data = {
              error: 'invalid_response',
              message: String(text || '').slice(0, 240) || 'Server returned non-JSON.',
            };
          }
          return { status: r.status, data: data };
        });
      })
      .then(function (res) {
        if (res.status >= 200 && res.status < 300 && res.data && res.data.ok) {
          return res.data;
        }
        var data = res.data || {};
        var msg =
          data.message ||
          data.error ||
          (data.error === 'gcs_not_configured'
            ? 'File storage is not configured on the server (GCS_BUCKET_NAME).'
            : '') ||
          (res.status === 400 ? 'Upload request was invalid (missing session or files).' : '') ||
          (res.status === 503 ? 'Upload storage is not ready on the server.' : '') ||
          'Upload failed';
        if (res.status) msg = 'HTTP ' + res.status + ': ' + msg;
        return { ok: false, message: msg, status: res.status, data: data };
      })
      .catch(function () {
        return { ok: false, message: 'Upload failed' };
      })
      .finally(function () {
        self._uploadInFlight = null;
      });
    return this._uploadInFlight;
  };

  QualityAssistantWidget.prototype.handleFormSubmit = function (payload) {
    var self = this;
    payload = payload || {};
    this.clientContext = Object.assign({}, this.clientContext || {}, payload.values || {});
    this.pushSessionContext();
    this._userHasInteracted = true;

    var ack = payload.summaryText || '';
    var req = payload.request || {};
    var onSubmit =
      global.QAChatForm && global.QAChatForm.resolveFormAction
        ? global.QAChatForm.resolveFormAction(req.onSubmit)
        : null;

    /* Remove form before ack or any Dialogflow reply so agent text never stacks on the card */
    this.removeFormCard(payload.formEl);

    var runAfterFormGone = function () {
      var userLabel =
        global.QAChatForm && global.QAChatForm.formSubmittedTranscriptLabel
          ? global.QAChatForm.formSubmittedTranscriptLabel(
              payload.formId,
              payload.def
            )
          : '';

      /* Transcript order: user submit line before bot thank-you */
      var chainPromise = userLabel
        ? self.appendTranscriptTurn('user', userLabel)
        : Promise.resolve();

      chainPromise = chainPromise.then(function () {
        if (ack) {
          self.appendMessage('bot', ack);
        }

        /* Form data to Dialogflow is silent when we show our own ack */
        return self.postToDialogflow(
          {
            message: payload.dialogflowText,
            sessionId: self.sessionId,
            languageCode: self.getDialogflowLang(),
            skipTranscriptUser: true,
          },
          { applyResponse: false, showTyping: false, allowWhileSending: true }
        );
      });

      if (onSubmit) {
        chainPromise = chainPromise.then(function () {
          return self.runFormDialogflowAction(onSubmit);
        });
      } else if (
        payload.nextFormId &&
        global.QAChatForm &&
        global.QAChatForm.isFormsEnabled()
      ) {
        chainPromise = chainPromise.then(function () {
          var chainTag = String(req.tag || self.pendingUploadTag || '').trim();
          if (chainTag) self.pendingUploadTag = chainTag;
          var nextFormReq =
            global.QAChatForm && global.QAChatForm.buildChainedFormRequest
              ? global.QAChatForm.buildChainedFormRequest(
                  payload.nextFormId,
                  payload.def,
                  req,
                  self.clientContext
                )
              : {
                  formId: payload.nextFormId,
                  prefill: self.clientContext,
                };
          if (!nextFormReq) return;
          if (chainTag && !nextFormReq.tag) nextFormReq.tag = chainTag;
          var displayForms = self.resolveFormRequestsForDisplay([nextFormReq]);
          if (!displayForms.length) return;
          self.appendMessage('bot', '', { forms: displayForms });
        });
      }

      return chainPromise;
    };

    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(runAfterFormGone);
    } else {
      setTimeout(runAfterFormGone, 0);
    }
  };

  QualityAssistantWidget.prototype.mergeSessionParameters = function (sessionParameters) {
    var params =
      sessionParameters && typeof sessionParameters === 'object'
        ? sessionParameters
        : {};
    if (!Object.keys(params).length) return;
    var patch = Object.assign({}, params);
    if (!patch.mobile && patch.phone) patch.mobile = patch.phone;
    if (!patch.appointmentdate && patch.appointment_date) {
      patch.appointmentdate = patch.appointment_date;
    }
    if (!patch.appointmenttime && patch.appointment_time) {
      patch.appointmenttime = patch.appointment_time;
    }
    this.clientContext = Object.assign({}, this.clientContext || {}, patch);
  };

  QualityAssistantWidget.prototype.handleSkippedForm = function (request) {
    var prefill = (request && request.prefill) || {};
    this.clientContext = Object.assign({}, this.clientContext || {}, prefill);
    this.pushSessionContext();
    var action =
      global.QAChatForm && global.QAChatForm.resolveFormAction
        ? global.QAChatForm.resolveFormAction((request || {}).onSubmit)
        : null;
    if (action) {
      this._userHasInteracted = true;
      this.runFormDialogflowAction(action);
    }
  };

  QualityAssistantWidget.prototype.handleSkippedContactForm = function (request) {
    this.handleSkippedForm(request);
  };

  QualityAssistantWidget.prototype.resolveFormRequestsForDisplay = function (forms) {
    var self = this;
    var skipFn =
      global.QAChatForm &&
      (global.QAChatForm.resolveFormSkips || global.QAChatForm.resolveContactSkip);
    if (!skipFn) return Array.isArray(forms) ? forms : [];
    var out = [];
    (Array.isArray(forms) ? forms : []).forEach(function (req) {
      var resolved = skipFn(req, self);
      if (!resolved) return;
      if (resolved._skipContactOnly || resolved._skipAppointmentOnly) {
        self.handleSkippedForm(resolved.request);
        return;
      }
      out.push(resolved);
    });
    return out;
  };

  QualityAssistantWidget.prototype.buildFormEl = function (formRequest) {
    if (!global.QAChatForm || !global.QAChatForm.isFormsEnabled()) return null;
    var skipFn =
      global.QAChatForm.resolveFormSkips || global.QAChatForm.resolveContactSkip;
    var resolved = skipFn ? skipFn(formRequest, this) : formRequest;
    if (resolved && (resolved._skipContactOnly || resolved._skipAppointmentOnly)) {
      this.handleSkippedForm(resolved.request);
      return null;
    }
    return global.QAChatForm.buildFormEl(resolved, this);
  };

  QualityAssistantWidget.prototype.appendFormattedBubbleContent = function (
    bubble,
    text,
    replyHtml
  ) {
    if (replyHtml && String(replyHtml).trim()) {
      bubble.classList.add('qa-msg__bubble--formatted');
      bubble.innerHTML = String(replyHtml);
      return true;
    }
    var ms = global.QAMessageSyntax;
    var textStr = text == null ? '' : String(text);
    if (!textStr.trim()) return false;
    if (!ms || typeof ms.renderHtml !== 'function' || !ms.hasMessageSyntax(textStr)) {
      return false;
    }
    bubble.classList.add('qa-msg__bubble--formatted');
    bubble.innerHTML = ms.renderHtml(textStr);
    return true;
  };

  QualityAssistantWidget.prototype.fillMessageBubble = function (bubble, text, replyParts, replyHtml) {
    bubble.textContent = '';
    bubble.classList.remove('qa-msg__bubble--formatted', 'qa-msg__bubble--multiline');
    if (replyHtml && String(replyHtml).trim()) {
      this.appendFormattedBubbleContent(bubble, text, replyHtml);
      return;
    }
    var parts = replyParts && replyParts.length ? replyParts : null;
    if (!parts) {
      var textStr = text == null ? '' : String(text).trim();
      if (!textStr) return;
      if (this.appendFormattedBubbleContent(bubble, textStr, replyHtml)) return;
      if (textStr.indexOf('\n') >= 0) {
        bubble.classList.add('qa-msg__bubble--multiline');
        textStr.split('\n').forEach(function (line, i) {
          if (i > 0) bubble.appendChild(document.createElement('br'));
          bubble.appendChild(document.createTextNode(line));
        });
      } else {
        bubble.textContent = textStr;
      }
      return;
    }
    var self = this;
    var ms = global.QAMessageSyntax;
    var usedFormatted = false;
    parts.forEach(function (part) {
      if (part.type === 'link' && part.href && /^https?:\/\//i.test(part.href)) {
        var a = document.createElement('a');
        a.className = 'qa-msg__link';
        a.href = part.href;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        if (
          ms &&
          typeof ms.renderHtml === 'function' &&
          ms.hasMessageSyntax(part.text || '')
        ) {
          a.innerHTML = ms.renderHtml(part.text || '');
        } else {
          a.textContent = part.text || part.href;
        }
        bubble.appendChild(a);
        return;
      }
      var chunk = part.text != null ? String(part.text) : '';
      if (!chunk) return;
      if (
        ms &&
        typeof ms.renderHtml === 'function' &&
        ms.hasMessageSyntax(chunk)
      ) {
        usedFormatted = true;
        var wrap = document.createElement('span');
        wrap.innerHTML = ms.renderHtml(chunk);
        while (wrap.firstChild) bubble.appendChild(wrap.firstChild);
        return;
      }
      bubble.appendChild(document.createTextNode(chunk));
    });
    if (usedFormatted) bubble.classList.add('qa-msg__bubble--formatted');
    if (!bubble.childNodes.length && text) {
      if (!this.appendFormattedBubbleContent(bubble, String(text).trim(), replyHtml)) {
        bubble.textContent = String(text).trim();
      }
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
    if (
      options.messageKind === 'agent-connected' ||
      options.messageKind === 'agent-rejoined' ||
      options.messageKind === 'agent-disconnected'
    ) {
      row.classList.add('qa-msg--agent-connected');
    }
    if (options.messageKind === 'upload-success') {
      row.classList.add('qa-msg--upload-success');
    }
    var body = document.createElement('div');
    body.className = 'qa-msg__body';
    body.appendChild(this.buildPersonaRow(role, options));
    var textStr = text == null ? '' : String(text).trim();
    var replyParts = options.replyParts || [];
    var replyHtml = options.replyHtml || '';
    var dropdowns = options.dropdowns || [];
    var galleries = options.galleries || [];
    var cardCarousels = options.cardCarousels || [];
    var forms = options.forms || [];
    var skipBubbleForDropdown =
      role === 'bot' &&
      textStr &&
      (dropdowns.some(function (d) {
        return String(d.message || '').trim() === textStr;
      }) ||
        galleries.some(function (g) {
          return String(g.message || '').trim() === textStr;
        }) ||
        cardCarousels.some(function (c) {
          return String(c.message || '').trim() === textStr;
        }) ||
        forms.some(function (f) {
          return String(f.message || '').trim() === textStr;
        }));
    if ((textStr || replyParts.length) && !skipBubbleForDropdown) {
      var bubble = document.createElement('div');
      bubble.className = 'qa-msg__bubble';
      this.fillMessageBubble(bubble, textStr, replyParts, replyHtml);
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
        var message = c.sendMessage || c.message || c.label || '';
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
    if (role === 'bot' && cardCarousels.length) {
      var selfCarousel = this;
      cardCarousels.forEach(function (carousel) {
        body.appendChild(selfCarousel.buildCardCarouselEl(carousel));
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
    if (role === 'bot' && forms.length) {
      var selfForm = this;
      forms.forEach(function (formReq) {
        var el = selfForm.buildFormEl(formReq);
        if (el) body.appendChild(el);
      });
    }
    row.appendChild(body);
    this.els.messages.appendChild(row);
    this.els.messages.scrollTop = this.els.messages.scrollHeight;
    this.syncTranscriptFromMessage(role, text, options);
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
    if (this.isHumanChatActive()) {
      if (typeof this._liveAgentSendUser === 'function') {
        if (!this.liveAgentMode && typeof this.startLiveAgentMode === 'function') {
          this.startLiveAgentMode({});
        }
        this._liveAgentSendUser(text);
        return;
      }
    }

    var orch = getAgentOrchestrationCfg();
    if (this.isOrchestrationReceptionistHost()) {
      if (this._orchMode === 'receptionist') {
        var child = findChildByOpenTrigger_(text, orch);
        if (child) {
          this.markUserInteracted();
          this.noteUserActivity();
          this.appendMessage('user', text);
          this.switchToChildAgent(child);
          return;
        }
      } else if (
        this._orchMode === 'child' &&
        isReturnToReceptionistTrigger_(text, orch)
      ) {
        this.markUserInteracted();
        this.noteUserActivity();
        this.appendMessage('user', text);
        this.switchToReceptionist();
        return;
      }
    }

    this.markUserInteracted();
    this.noteUserActivity();
    this.appendMessage('user', text);
    this.postToDialogflow(
      this.withDialogflowRouting_({
        message: text,
        sessionId: this.sessionId,
        languageCode: this.getDialogflowLang(),
      })
    );
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
