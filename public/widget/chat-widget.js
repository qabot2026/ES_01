(function (global) {
  'use strict';

  var LANG_MAP = {
    en: { label: 'English', speech: 'en-IN', df: 'en' },
    hi: { label: 'Hindi', speech: 'hi-IN', df: 'hi' },
    mr: { label: 'Marathi', speech: 'mr-IN', df: 'mr' },
  };

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

  function QualityAssistantWidget(options) {
    this.apiBase = (options && options.apiBase) || '';
    this.title = (options && options.title) || 'QualityAssistant';
    this.subtitle = (options && options.subtitle) || 'Your quality & compliance guide';
    this.sessionId = this.newSessionId();
    this.language = 'en';
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
    var self = this;
    this.root = document.createElement('div');
    this.root.className = 'qa-widget';
    this.root.innerHTML = this.template();
    document.body.appendChild(this.root);
    this.cacheElements();
    this.bindEvents();
    this.fetchConfig();
  };

  QualityAssistantWidget.prototype.template = function () {
    var langOptions = Object.keys(LANG_MAP)
      .map(function (code) {
        return '<option value="' + code + '">' + LANG_MAP[code].label + '</option>';
      })
      .join('');

    return (
      '<button type="button" class="qa-launcher" aria-label="Open chat">' +
      ICONS.chat +
      '</button>' +
      '<div class="qa-panel" role="dialog" aria-label="QualityAssistant chat">' +
      '<header class="qa-header">' +
      '<div class="qa-header__icon" aria-hidden="true">' +
      ICONS.header +
      '</div>' +
      '<div class="qa-header__text">' +
      '<h2 class="qa-header__title">' +
      this.escape(this.title) +
      '</h2>' +
      '<p class="qa-header__subtitle">' +
      this.escape(this.subtitle) +
      '</p>' +
      '</div>' +
      '<button type="button" class="qa-header__close" aria-label="Close chat">' +
      ICONS.close +
      '</button>' +
      '</header>' +
      '<div class="qa-messages" role="log" aria-live="polite">' +
      '<div class="qa-welcome">' +
      '<strong>Welcome to ' +
      this.escape(this.title) +
      '</strong>' +
      'Ask about quality standards, procedures, or compliance.' +
      '</div>' +
      '</div>' +
      '<footer class="qa-footer">' +
      '<div class="qa-input-row">' +
      '<textarea class="qa-input" rows="1" placeholder="Type your message…" aria-label="Message"></textarea>' +
      '<button type="button" class="qa-mic" aria-label="Speech to text">' +
      ICONS.mic +
      '</button>' +
      '<button type="button" class="qa-send" aria-label="Send message">' +
      ICONS.send +
      '</button>' +
      '</div>' +
      '<div class="qa-toolbar">' +
      '<select class="qa-lang" aria-label="Language">' +
      langOptions +
      '</select>' +
      '<button type="button" class="qa-restart">' +
      ICONS.restart +
      ' Restart</button>' +
      '</div>' +
      '<div class="qa-powered">' +
      '<span>Powered by</span>' +
      '<img class="qa-powered__logo" src="' +
      this.apiBase +
      '/widget/logo-powered.svg" alt="QualityAssistant" width="90" height="18" onerror="this.style.display=\'none\'"/>' +
      '<strong>QualityAssistant</strong>' +
      '</div>' +
      '<p class="qa-error" hidden></p>' +
      '</footer>' +
      '</div>'
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
  };

  QualityAssistantWidget.prototype.bindEvents = function () {
    var self = this;
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
      self.els.input.style.height = Math.min(self.els.input.scrollHeight, 100) + 'px';
    });
    this.els.lang.addEventListener('change', function () {
      self.language = self.els.lang.value;
    });
    this.els.restart.addEventListener('click', function () {
      self.restart();
    });
    this.els.mic.addEventListener('click', function () {
      self.toggleSpeech();
    });
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
          self.root.querySelector('.qa-header__title').textContent = cfg.title;
        }
        if (cfg.subtitle) {
          self.subtitle = cfg.subtitle;
          self.root.querySelector('.qa-header__subtitle').textContent = cfg.subtitle;
        }
        if (!cfg.dialogflowReady) {
          self.showError(
            'Server credentials missing. Add credentials.json for full chat API.'
          );
        }
      })
      .catch(function () {});
  };

  QualityAssistantWidget.prototype.open = function () {
    this.isOpen = true;
    this.els.panel.classList.add('qa-panel--open');
    this.els.launcher.classList.add('qa-launcher--hidden');
    this.els.input.focus();
  };

  QualityAssistantWidget.prototype.close = function () {
    this.isOpen = false;
    this.els.panel.classList.remove('qa-panel--open');
    this.els.launcher.classList.remove('qa-launcher--hidden');
    this.stopSpeech();
  };

  QualityAssistantWidget.prototype.restart = function () {
    this.sessionId = this.newSessionId();
    this.els.messages.innerHTML =
      '<div class="qa-welcome"><strong>Conversation restarted</strong>How can I help you today?</div>';
    this.els.welcome = this.root.querySelector('.qa-welcome');
    this.hideError();
    this.els.input.focus();
  };

  QualityAssistantWidget.prototype.appendMessage = function (role, text) {
    if (this.els.welcome) {
      this.els.welcome.remove();
      this.els.welcome = null;
    }
    var row = document.createElement('div');
    row.className = 'qa-msg qa-msg--' + role;
    var avatar = document.createElement('div');
    avatar.className = 'qa-msg__avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.innerHTML = role === 'bot' ? ICONS.bot : ICONS.user;
    var bubble = document.createElement('div');
    bubble.className = 'qa-msg__bubble';
    bubble.textContent = text;
    row.appendChild(avatar);
    row.appendChild(bubble);
    this.els.messages.appendChild(row);
    this.els.messages.scrollTop = this.els.messages.scrollHeight;
    return row;
  };

  QualityAssistantWidget.prototype.showTyping = function () {
    var row = document.createElement('div');
    row.className = 'qa-msg qa-msg--bot qa-msg--typing-indicator';
    row.innerHTML =
      '<div class="qa-msg__avatar" aria-hidden="true">' +
      ICONS.bot +
      '</div><div class="qa-msg__bubble qa-msg__typing"><span></span><span></span><span></span></div>';
    this.els.messages.appendChild(row);
    this.els.messages.scrollTop = this.els.messages.scrollHeight;
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
    var langCode = LANG_MAP[this.language] ? LANG_MAP[this.language].df : 'en';

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
        typing.remove();
        self.appendMessage('bot', 'Network error. Check your connection and try again.');
        self.showError('Could not reach chat server.');
      })
      .finally(function () {
        self.isSending = false;
        self.els.send.disabled = false;
      });
  };

  QualityAssistantWidget.prototype.toggleSpeech = function () {
    if (this.recognition) {
      this.stopSpeech();
      return;
    }
    var SpeechRecognition =
      global.SpeechRecognition || global.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.showError('Speech-to-text is not supported in this browser. Use Chrome or Edge.');
      return;
    }
    var self = this;
    var lang = LANG_MAP[this.language] ? LANG_MAP[this.language].speech : 'en-IN';
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
    this.els.mic.classList.remove('qa-mic--active');
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
