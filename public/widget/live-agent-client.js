/**
 * Live agent handoff — user widget talks to /api/live-agent while agents use /live-agent/ desk.
 */
(function (global) {
  'use strict';

  function liveCfg() {
    var root = global.QA_CHAT_UI_CONFIG || {};
    var c = (root.common && root.common.liveAgent) || root.liveAgent || {};
    return c;
  }

  function liveEnabled() {
    return liveCfg().enabled !== false;
  }

  function t(widget, key, fallback) {
    var lang = (widget && widget.language) || 'en';
    var pack = (global.QA_CHAT_LIVE_STRINGS && global.QA_CHAT_LIVE_STRINGS[lang]) ||
      (global.QA_CHAT_LIVE_STRINGS && global.QA_CHAT_LIVE_STRINGS.en) ||
      {};
    return pack[key] != null ? pack[key] : fallback;
  }

  function patchWidget() {
    var C = global.QualityAssistantWidget;
    if (!C || !C.prototype) return false;
    var p = C.prototype;
    if (p._liveAgentPatched) return true;
    p._liveAgentPatched = true;

    var origSend = p.sendMessageWithText;
    p.sendMessageWithText = function (text) {
      if (this.liveAgentMode) {
        this._liveAgentSendUser(text);
        return;
      }
      return origSend.call(this, text);
    };

    var origApply = p.applyDialogflowResult;
    p.applyDialogflowResult = function (result) {
      origApply.call(this, result);
      if (!liveEnabled()) return;
      if (result && result.ok && result.data && result.data.liveAgent) {
        this.startLiveAgentMode(result.data);
      }
    };

    p.startLiveAgentMode = function (data) {
      var self = this;
      if (!liveEnabled() || !this.apiBase) return;
      if (this.liveAgentMode) return;
      var cfg = liveCfg();
      this.liveAgentMode = true;
      this.liveAgentSince = '';
      this.liveAgentSeen = {};
      this._showLiveAgentBanner(
        t(this, 'waiting', 'Waiting for an agent…')
      );
      var waitingMsg =
        (data && data.reply && String(data.reply).trim()) ||
        t(this, 'handoffReply', 'Connecting you to our team. Please wait.');
      if (waitingMsg) {
        this.appendMessage('bot', waitingMsg);
      }
      fetch(this.apiBase + '/api/live-agent/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          userLanguage: this.language || 'en',
        }),
      })
        .then(function (r) {
          return r.json();
        })
        .then(function () {
          self._liveAgentPollTick();
        })
        .catch(function () {
          self.appendMessage(
            'bot',
            t(self, 'handoffError', 'Could not reach support. Try again.')
          );
        });
      this._liveAgentPollTimer = setInterval(function () {
        self._liveAgentPollTick();
      }, cfg.pollIntervalMs || 2000);
    };

    p.stopLiveAgentMode = function (endedByAgent) {
      this.liveAgentMode = false;
      if (this._liveAgentPollTimer) {
        clearInterval(this._liveAgentPollTimer);
        this._liveAgentPollTimer = null;
      }
      this._hideLiveAgentBanner();
      if (endedByAgent) {
        this.appendMessage(
          'bot',
          t(this, 'ended', 'Chat with agent ended. You can continue with the assistant.')
        );
      }
    };

    p._showLiveAgentBanner = function (text) {
      if (!this.els || !this.els.panel) return;
      var el = this.els.panel.querySelector('.qa-live-agent-banner');
      if (!el) {
        el = document.createElement('div');
        el.className = 'qa-live-agent-banner';
        var scroll = this.els.panel.querySelector('.qa-panel__scroll');
        if (scroll && scroll.parentNode) {
          scroll.parentNode.insertBefore(el, scroll);
        } else {
          this.els.panel.insertBefore(el, this.els.panel.firstChild);
        }
      }
      el.textContent = text;
      el.hidden = false;
    };

    p._hideLiveAgentBanner = function () {
      if (!this.els || !this.els.panel) return;
      var el = this.els.panel.querySelector('.qa-live-agent-banner');
      if (el) el.hidden = true;
    };

    p._liveAgentSendUser = function (text) {
      var self = this;
      text = (text || '').trim();
      if (!text) return;
      this.markUserInteracted();
      this.noteUserActivity();
      this.appendMessage('user', text);
      fetch(this.apiBase + '/api/live-agent/user-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          message: text,
        }),
      }).catch(function () {
        self.showError('Could not send message to agent.');
      });
    };

    p._liveAgentPollTick = function () {
      var self = this;
      if (!this.liveAgentMode || !this.apiBase || !this.sessionId) return;
      var url =
        this.apiBase +
        '/api/live-agent/poll?sessionId=' +
        encodeURIComponent(this.sessionId) +
        (this.liveAgentSince
          ? '&since=' + encodeURIComponent(this.liveAgentSince)
          : '');
      fetch(url)
        .then(function (r) {
          return r.json();
        })
        .then(function (data) {
          if (!data || !data.ok) return;
          if (data.status === 'ended') {
            self.stopLiveAgentMode(true);
            return;
          }
          if (data.status === 'active' && data.agentName) {
            self._showLiveAgentBanner(
              t(self, 'connected', 'Connected to') + ' ' + data.agentName
            );
          }
          (data.messages || []).forEach(function (m) {
            if (!m || !m.id || self.liveAgentSeen[m.id]) return;
            self.liveAgentSeen[m.id] = true;
            if (m.from === 'agent') {
              self.appendMessage('bot', m.text, { personaLabel: data.agentName || 'Support' });
            } else if (m.from === 'system') {
              self.appendMessage('bot', m.text);
            }
            if (m.at) self.liveAgentSince = m.at;
          });
        })
        .catch(function () {});
    };

    return true;
  }

  global.QA_CHAT_LIVE_STRINGS = {
    en: {
      waiting: 'Waiting for an agent…',
      connected: 'Connected to',
      handoffReply: 'Connecting you to our team. Please wait.',
      handoffError: 'Could not reach support. Try again.',
      ended: 'Chat with agent ended. You can continue with the assistant.',
    },
    hi: {
      waiting: 'एजेंट का इंतज़ार…',
      connected: 'जुड़े हुए:',
      handoffReply: 'हम आपको टीम से जोड़ रहे हैं। कृपया प्रतीक्षा करें।',
      handoffError: 'सपोर्ट से कनेक्ट नहीं हो सका।',
      ended: 'एजेंट चैट समाप्त। आप असिस्टेंट से जारी रख सकते हैं।',
    },
    mr: {
      waiting: 'एजंटची वाट पाहत आहोत…',
      connected: 'जोडले:',
      handoffReply: 'आम्ही तुम्हाला टीमशी जोडत आहोत. कृपया थांबा.',
      handoffError: 'सपोर्टशी कनेक्ट होऊ शकले नाही.',
      ended: 'एजंट चॅट संपली. तुम्ही असिस्टंटसह पुढे चालू ठेवू शकता.',
    },
  };

  if (!patchWidget()) {
    var n = 0;
    var iv = setInterval(function () {
      n += 1;
      if (patchWidget() || n > 80) clearInterval(iv);
    }, 100);
  }
})(typeof window !== 'undefined' ? window : globalThis);
