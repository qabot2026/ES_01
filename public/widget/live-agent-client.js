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
    var pack =
      (global.QA_CHAT_LIVE_STRINGS && global.QA_CHAT_LIVE_STRINGS[lang]) ||
      (global.QA_CHAT_LIVE_STRINGS && global.QA_CHAT_LIVE_STRINGS.en) ||
      {};
    return pack[key] != null ? pack[key] : fallback;
  }

  function messageKey(m) {
    if (!m) return '';
    if (m.id) return String(m.id);
    return (
      (m.role || m.from || '') +
      '|' +
      (m.createdAt || m.at || '') +
      '|' +
      String(m.text || '').slice(0, 80)
    );
  }

  function humanChatActive_(w) {
    return !!(w && (w.liveAgentMode || w._liveAgentHumanActive));
  }

  function patchWidget() {
    var C = global.QualityAssistantWidget;
    if (!C || !C.prototype) return false;
    var p = C.prototype;
    if (p._liveAgentPatched) return true;
    p._liveAgentPatched = true;

    var origSend = p.sendMessageWithText;
    p.sendMessageWithText = function (text) {
      text = (text || '').trim();
      if (!text) return;
      if (humanChatActive_(this)) {
        if (!this.liveAgentMode) {
          this.startLiveAgentMode({});
        }
        this._liveAgentSendUser(text);
        return;
      }
      return origSend.call(this, text);
    };

    var origPostDf = p.postToDialogflow;
    p.postToDialogflow = function (body, opts) {
      if (humanChatActive_(this)) {
        return Promise.resolve();
      }
      return origPostDf.call(this, body, opts);
    };

    var origApply = p.applyDialogflowResult;
    p.applyDialogflowResult = function (result) {
      if (!result || !result.ok) {
        return origApply.call(this, result);
      }
      var data = result.data || {};
      if (data.humanActive) {
        this._liveAgentHumanActive = true;
      }
      if (data.liveAgent && liveEnabled()) {
        this._liveAgentHumanActive = true;
        if (!this.liveAgentMode) {
          this.startLiveAgentMode(data);
        }
        return;
      }
      if (humanChatActive_(this)) {
        return;
      }
      return origApply.call(this, result);
    };

    var origWelcome = p.triggerWelcomeEvent;
    if (typeof origWelcome === 'function') {
      p.triggerWelcomeEvent = function () {
        if (humanChatActive_(this)) return;
        return origWelcome.call(this);
      };
    }

    var origEndChat = p.triggerEndChatEvent;
    if (typeof origEndChat === 'function') {
      p.triggerEndChatEvent = function (opts) {
        if (humanChatActive_(this)) return Promise.resolve();
        return origEndChat.call(this, opts);
      };
    }

    var origDfAction = p.runFormDialogflowAction;
    if (typeof origDfAction === 'function') {
      p.runFormDialogflowAction = function (action, opts) {
        if (humanChatActive_(this)) return Promise.resolve();
        return origDfAction.call(this, action, opts);
      };
    }

    p._liveAgentAnnounceConnected = function (agentLabel, messageText) {
      var name = (agentLabel && String(agentLabel).trim()) || 'an agent';
      var text =
        (messageText && String(messageText).trim()) ||
        t(this, 'connectedPrefix', 'You are now chatting with') + ' ' + name + '.';
      if (!this._liveAgentConnectedAnnounced) {
        this._liveAgentConnectedAnnounced = true;
        this.appendMessage('bot', text);
      }
      this._liveAgentConnectedBanner(name);
    };

    p.startLiveAgentMode = function (data) {
      var self = this;
      if (!liveEnabled() || !this.apiBase) return;
      var cfg = liveCfg();
      var starting = !this.liveAgentMode;
      this.liveAgentMode = true;
      this._liveAgentHumanActive = true;
      if (starting) {
        this.liveAgentSeen = this.liveAgentSeen || {};
        this._liveAgentConnectedAnnounced = false;
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
            clientSessionId: this.sessionId,
            sessionId: this.sessionId,
            userLanguage: this.language || 'en',
          }),
        }).catch(function () {
          self.appendMessage(
            'bot',
            t(self, 'handoffError', 'Could not reach support. Try again.')
          );
        });
      }
      if (this._liveAgentPollTimer) {
        clearInterval(this._liveAgentPollTimer);
      }
      var pollMs = Math.min(cfg.pollIntervalMs || 2000, 1200);
      this._liveAgentPollTimer = setInterval(function () {
        self._liveAgentPollTick();
      }, pollMs);
      this._liveAgentPollTick();
    };

    p.stopLiveAgentMode = function (endedByAgent) {
      this.liveAgentMode = false;
      this._liveAgentHumanActive = false;
      this._liveAgentConnectedAnnounced = false;
      if (this._liveAgentPollTimer) {
        clearInterval(this._liveAgentPollTimer);
        this._liveAgentPollTimer = null;
      }
      this._hideLiveAgentBanner();
      if (endedByAgent) {
        this.appendMessage(
          'bot',
          t(
            this,
            'ended',
            'Chat with agent ended. You can continue with the assistant.'
          )
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

    p._liveAgentConnectedBanner = function (name) {
      var label = (name && String(name).trim()) || 'an agent';
      this._showLiveAgentBanner(
        t(this, 'connectedPrefix', 'You are now chatting with') +
          ' ' +
          label +
          '.'
      );
    };

    p._liveAgentSendUser = function (text) {
      var self = this;
      text = (text || '').trim();
      if (!text) return;
      this.markUserInteracted();
      this.noteUserActivity();
      this.appendMessage('user', text);
      fetch(this.apiBase + '/api/live-agent/visitor-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientSessionId: this.sessionId,
          sessionId: this.sessionId,
          text: text,
        }),
      })
        .then(function (r) {
          return r.json();
        })
        .then(function (body) {
          if (!body || !body.ok) {
            throw new Error((body && body.error) || 'Send failed');
          }
          self._liveAgentPollTick();
        })
        .catch(function () {
          self.showError('Could not send message to agent.');
        });
    };

    p._liveAgentIngestMessages = function (data) {
      if (!data || !data.ok) return;
      var self = this;
      var agentName = data.agentName || 'Support';
      if (!this.liveAgentSeen) {
        this.liveAgentSeen = {};
      }
      (data.messages || []).forEach(function (m) {
        var key = messageKey(m);
        if (!key || self.liveAgentSeen[key]) return;
        self.liveAgentSeen[key] = true;
        var role = m.role || '';
        var from =
          m.from ||
          (role === 'agent' || role === 'staff'
            ? 'agent'
            : role === 'system'
              ? 'system'
              : '');
        if (from === 'agent' && m.text) {
          self.appendMessage('bot', m.text, {
            personaLabel: m.senderDisplayName || agentName,
            skipTranscriptLog: false,
          });
        } else if (from === 'system') {
          if (/you are now chatting with/i.test(m.text || '')) {
            var match = String(m.text).match(/chatting with\s+(.+?)\.?$/i);
            var label = match && match[1] ? match[1].trim() : agentName;
            self._liveAgentAnnounceConnected(label, m.text);
          } else if (m.text) {
            self.appendMessage('bot', m.text);
          }
        }
      });
    };

    p._liveAgentPollTick = function () {
      var self = this;
      if (!this.apiBase || !this.sessionId) return;
      if (!this.liveAgentMode && !this._liveAgentHumanActive) return;
      var statusUrl =
        this.apiBase +
        '/api/live-agent/status?clientSessionId=' +
        encodeURIComponent(this.sessionId);
      var msgUrl =
        this.apiBase +
        '/api/live-agent/messages?clientSessionId=' +
        encodeURIComponent(this.sessionId) +
        '&tail=50';
      fetch(statusUrl)
        .then(function (r) {
          return r.json();
        })
        .then(function (st) {
          if (!st || !st.ok) return null;
          self._liveAgentHumanActive = !!st.humanActive;
          if (!st.humanActive) {
            self._liveAgentHumanActive = false;
          }
          if (st.conversation && st.conversation.status === 'closed') {
            self.stopLiveAgentMode(true);
            return null;
          }
          if (st.humanActive && !self.liveAgentMode) {
            self.startLiveAgentMode({});
          }
          var agentLabel =
            st.assignedAgentDisplayName ||
            st.agentName ||
            (st.conversation && st.conversation.assignedAgentEmail
              ? String(st.conversation.assignedAgentEmail).split('@')[0]
              : '');
          if (st.agentConnected && agentLabel) {
            self._liveAgentAnnounceConnected(
              agentLabel,
              st.connectedMessage || ''
            );
          } else if (st.humanActive) {
            self._showLiveAgentBanner(
              t(self, 'waiting', 'Waiting for an agent…')
            );
          }
          return fetch(msgUrl).then(function (r) {
            return r.json();
          });
        })
        .then(function (data) {
          if (data) self._liveAgentIngestMessages(data);
        })
        .catch(function () {});
    };

    p._liveAgentResumeIfNeeded = function () {
      var self = this;
      if (!liveEnabled() || !this.apiBase || !this.sessionId) {
        return;
      }
      if (this.liveAgentMode) {
        this._liveAgentPollTick();
        return;
      }
      fetch(
        this.apiBase +
          '/api/live-agent/status?clientSessionId=' +
          encodeURIComponent(this.sessionId)
      )
        .then(function (r) {
          return r.json();
        })
        .then(function (st) {
          if (!st || !st.ok || !st.humanActive) return;
          self._liveAgentHumanActive = true;
          self.startLiveAgentMode({});
          if (st.agentConnected && st.assignedAgentDisplayName) {
            self._liveAgentAnnounceConnected(
              st.assignedAgentDisplayName,
              st.connectedMessage || ''
            );
          }
        })
        .catch(function () {});
    };

    return true;
  }

  global.QA_LIVE_AGENT_PATCH = patchWidget;

  global.QA_CHAT_LIVE_STRINGS = {
    en: {
      waiting: 'Waiting for an agent…',
      connectedPrefix: 'You are now chatting with',
      handoffReply: 'Connecting you to our team. Please wait.',
      handoffError: 'Could not reach support. Try again.',
      ended: 'Chat with agent ended. You can continue with the assistant.',
    },
    hi: {
      waiting: 'एजेंट का इंतज़ार…',
      connectedPrefix: 'अब आप बात कर रहे हैं',
      handoffReply: 'हम आपको टीम से जोड़ रहे हैं। कृपया प्रतीक्षा करें।',
      handoffError: 'सपोर्ट से कनेक्ट नहीं हो सका।',
      ended: 'एजेंट चैट समाप्त। आप असिस्टेंट से जारी रख सकते हैं।',
    },
    mr: {
      waiting: 'एजंटची वाट पाहत आहोत…',
      connectedPrefix: 'आता तुम्ही बोलत आहात',
      handoffReply: 'आम्ही तुम्हाला टीमशी जोडत आहोत. कृपया थांबा.',
      handoffError: 'सपोर्टशी कनेक्ट होऊ शकले नाही.',
      ended: 'एजंट चॅट संपली. तुम्ही असिस्टंटसह पुढे चालू ठेवू शकता.',
    },
  };

  patchWidget();

  if (!global.QualityAssistantWidget) {
    var n = 0;
    var iv = setInterval(function () {
      n += 1;
      if (patchWidget() || n > 80) clearInterval(iv);
    }, 100);
  }
})(typeof window !== 'undefined' ? window : globalThis);
