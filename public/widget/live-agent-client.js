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
    return !!(w && w._liveAgentHumanActive);
  }

  function humanHandoffFromSync_(st) {
    if (!st) return false;
    if (typeof st.humanHandoffActive === 'boolean') {
      return st.humanHandoffActive;
    }
    return !!st.humanActive;
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

    p._liveAgentResolveAgentLabel_ = function (st) {
      var label =
        (st && st.assignedAgentDisplayName) ||
        (st && st.agentName) ||
        '';
      label = String(label || '').trim();
      if (!label || /^me$/i.test(label)) {
        label = 'Support Agent';
      }
      return label;
    };

    p._liveAgentAnnounceConnected = function (agentLabel, messageText) {
      var name = (agentLabel && String(agentLabel).trim()) || '';
      if (!name || /^me$/i.test(name)) {
        name = 'Support Agent';
      }
      var text =
        (messageText && String(messageText).trim()) ||
        t(this, 'connectedPrefix', 'You are now chatting with') + ' ' + name + '.';
      if (!this._liveAgentConnectedAnnounced) {
        this._liveAgentConnectedAnnounced = true;
        this.appendMessage('bot', text, { skipTranscriptLog: true });
      }
      this._liveAgentConnectedBanner(name);
    };

    p._releaseLiveAgentToBot_ = function () {
      this.liveAgentMode = false;
      this._liveAgentHumanActive = false;
      this._hideLiveAgentBanner();
    };

    p._applyLiveAgentSyncState = function (st) {
      if (!st || !st.ok) return;
      if (st.revision) this._liveAgentRev = st.revision;
      var self = this;
      var handoff = humanHandoffFromSync_(st);
      if (st.conversation && st.conversation.status === 'closed') {
        this.stopLiveAgentMode(true);
        this._liveAgentHandoffRequested = false;
        return;
      }
      if (!handoff) {
        if (
          st.sessionOpen ||
          (st.conversation &&
            (st.conversation.status === 'waiting' ||
              st.conversation.status === 'active'))
        ) {
          this._releaseLiveAgentToBot_();
        } else {
          this._liveAgentHumanActive = false;
          this._hideLiveAgentBanner();
        }
        return;
      }
      this._liveAgentHumanActive = true;
      if (!this.liveAgentMode) {
        this.startLiveAgentMode({ skipHandoffRequest: true });
      }
      if (st.agentConnected) {
        this._liveAgentAnnounceConnected(
          this._liveAgentResolveAgentLabel_(st),
          st.connectedMessage || ''
        );
      } else if (handoff) {
        this._showLiveAgentBanner(
          t(this, 'waiting', 'Waiting for an agent…')
        );
      }
      this._liveAgentIngestMessages({
        ok: true,
        messages: st.messages || [],
        agentName: this._liveAgentResolveAgentLabel_(st),
      });
      if (st.lastMessageId) {
        this._liveAgentLastMessageId = st.lastMessageId;
      }
    };

    p.startLiveAgentMode = function (data) {
      data = data || {};
      var self = this;
      if (!liveEnabled() || !this.apiBase) return;
      var cfg = liveCfg();
      var starting = !this.liveAgentMode;
      this.liveAgentMode = true;
      this._liveAgentHumanActive = true;
      if (starting && !data.skipHandoffRequest && !this._liveAgentHandoffRequested) {
        this._liveAgentHandoffRequested = true;
        this.liveAgentSeen = this.liveAgentSeen || {};
        this._liveAgentConnectedAnnounced = false;
        this._showLiveAgentBanner(
          t(this, 'waiting', 'Waiting for an agent…')
        );
        var waitingMsg =
          (data.reply && String(data.reply).trim()) ||
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
        })
          .then(function (r) {
            return r.json();
          })
          .then(function (body) {
            if (body && body.dismissed) {
              self.stopLiveAgentMode(true);
              return;
            }
            var conv = body && body.conversation;
            if (conv && conv.status === 'closed') {
              self.stopLiveAgentMode(true);
            }
          })
          .catch(function () {
            self.appendMessage(
              'bot',
              t(self, 'handoffError', 'Could not reach support. Try again.')
            );
          });
      }
      this._liveAgentBindTyping();
      this._liveAgentStartStream();
    };

    p.stopLiveAgentMode = function (endedByAgent) {
      this.liveAgentMode = false;
      this._liveAgentHumanActive = false;
      this._liveAgentHandoffRequested = false;
      this._liveAgentConnectedAnnounced = false;
      this._liveAgentStopStream();
      this._hideLiveAgentBanner();
      this._liveAgentSetAgentTypingIndicator('');
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
      var label = (name && String(name).trim()) || 'Support Agent';
      if (/^me$/i.test(label)) label = 'Support Agent';
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
      fetch(this.apiBase + '/api/live-agent/visitor-typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientSessionId: this.sessionId,
          sessionId: this.sessionId,
          text: '',
          active: false,
        }),
      }).catch(function () {});
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
          if (body.revision) self._liveAgentRev = body.revision;
          if (body.agentConnected) {
            self._liveAgentAnnounceConnected(
              self._liveAgentResolveAgentLabel_(body),
              body.connectedMessage || ''
            );
          }
          if (body.messages && body.messages.length) {
            self._liveAgentIngestMessages({
              ok: true,
              messages: body.messages,
              agentName: self._liveAgentResolveAgentLabel_(body),
            });
          }
          if (body.lastMessageId) {
            self._liveAgentLastMessageId = body.lastMessageId;
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
          self._liveAgentRemoveTypingDraft_();
          self.appendMessage('bot', m.text, {
            personaLabel: m.senderDisplayName || agentName,
            skipTranscriptLog: true,
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

    p._liveAgentRemoveTypingDraft_ = function () {
      if (!this.els || !this.els.messages) return;
      var el = this.els.messages.querySelector('[data-typing-draft-agent]');
      if (el) el.remove();
    };

    p._liveAgentSetAgentTypingIndicator = function (text) {
      if (!this.els || !this.els.messages) return;
      var t = String(text || '').trim();
      if (!t) {
        this._liveAgentRemoveTypingDraft_();
        return;
      }
      var el = this.els.messages.querySelector('[data-typing-draft-agent]');
      if (!el) {
        el = document.createElement('div');
        el.className = 'qa-msg qa-msg--bot qa-msg--typing-draft';
        el.dataset.typingDraftAgent = '1';
        this.els.messages.appendChild(el);
      }
      el.innerHTML =
        '<div class="qa-msg__body"><div class="qa-msg__bubble">' +
        escapeHtmlWidget(t) +
        '</div><div class="qa-msg__typing-hint">Typing…</div></div>';
      this.els.messages.scrollTop = this.els.messages.scrollHeight;
    };

    function escapeHtmlWidget(s) {
      return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    p._liveAgentBindTyping = function () {
      var self = this;
      if (!this.els || !this.els.input || this._liveAgentTypingBound) return;
      this._liveAgentTypingBound = true;
      var typingTimer = null;
      var lastTypingSendMs = 0;
      var postTyping = function (text, active) {
        if (!self.apiBase || !self.sessionId) return;
        fetch(self.apiBase + '/api/live-agent/visitor-typing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientSessionId: self.sessionId,
            sessionId: self.sessionId,
            text: text || '',
            active: active !== false,
          }),
        }).catch(function () {});
      };
      this.els.input.addEventListener('input', function () {
        if (!self.liveAgentMode && !self._liveAgentHumanActive) return;
        var val = self.els.input.value || '';
        var now = Date.now();
        if (now - lastTypingSendMs > 45) {
          lastTypingSendMs = now;
          postTyping(val, true);
        } else {
          clearTimeout(typingTimer);
          typingTimer = setTimeout(function () {
            lastTypingSendMs = Date.now();
            postTyping(val, true);
          }, 45);
        }
      });
      this.els.input.addEventListener('blur', function () {
        clearTimeout(typingTimer);
        postTyping('', false);
      });
    };

    p._liveAgentStopTypingPulse = function () {
      if (this._liveAgentTypingPulseTimer) {
        clearInterval(this._liveAgentTypingPulseTimer);
        this._liveAgentTypingPulseTimer = null;
      }
    };

    p._liveAgentTypingPulseTick = function () {
      var self = this;
      if (!this.apiBase || !this.sessionId) return;
      if (
        !this.liveAgentMode &&
        !this._liveAgentHumanActive &&
        !this._liveAgentHandoffRequested
      ) {
        return;
      }
      if (this._liveAgentTypingPulseInFlight) return;
      this._liveAgentTypingPulseInFlight = true;
      var rev = this._liveAgentRev || 0;
      var msgId = encodeURIComponent(this._liveAgentLastMessageId || '');
      fetch(
        this.apiBase +
          '/api/live-agent/typing-pulse?clientSessionId=' +
          encodeURIComponent(this.sessionId) +
          '&rev=' +
          rev +
          '&lastMessageId=' +
          msgId
      )
        .then(function (r) {
          return r.json();
        })
        .then(function (st) {
          if (!st || !st.ok) return;
          if (st.revision) self._liveAgentRev = Math.max(rev, st.revision);
          self._liveAgentSetAgentTypingIndicator(st.agentTyping || '');
          if (st.newMessage) {
            self._liveAgentPollTick();
          }
        })
        .catch(function () {})
        .finally(function () {
          self._liveAgentTypingPulseInFlight = false;
        });
    };

    p._liveAgentStartTypingPulse = function () {
      var self = this;
      this._liveAgentStopTypingPulse();
      this._liveAgentTypingPulseTick();
      this._liveAgentTypingPulseTimer = setInterval(function () {
        self._liveAgentTypingPulseTick();
      }, 100);
    };

    p._liveAgentStopStream = function () {
      this._liveAgentStopTypingPulse();
      if (this._liveAgentPollTimer) {
        clearInterval(this._liveAgentPollTimer);
        this._liveAgentPollTimer = null;
      }
      if (this._liveAgentEventSource) {
        try {
          this._liveAgentEventSource.close();
        } catch (e) {}
        this._liveAgentEventSource = null;
      }
    };

    p._liveAgentStartStream = function () {
      var self = this;
      this._liveAgentStopStream();
      if (!this.apiBase || !this.sessionId) return;
      this._liveAgentStartTypingPulse();
      this._liveAgentPollTick();
      this._liveAgentPollTimer = setInterval(function () {
        self._liveAgentPollTick();
      }, 180);
    };

    p._liveAgentPollTick = function () {
      var self = this;
      if (!this.apiBase || !this.sessionId) return;
      if (
        !this.liveAgentMode &&
        !this._liveAgentHumanActive &&
        !this._liveAgentHandoffRequested
      ) {
        return;
      }
      if (this._liveAgentPollInFlight) return;
      this._liveAgentPollInFlight = true;
      var rev = this._liveAgentRev || 0;
      var msgId = encodeURIComponent(this._liveAgentLastMessageId || '');
      var syncUrl =
        this.apiBase +
        '/api/live-agent/sync?clientSessionId=' +
        encodeURIComponent(this.sessionId) +
        '&rev=' +
        rev +
        '&waitMs=2200&lastMessageId=' +
        msgId;
      fetch(syncUrl)
        .then(function (r) {
          return r.json();
        })
        .then(function (st) {
          if (!st) return;
          if (st.revision) self._liveAgentRev = st.revision;
          self._liveAgentSetAgentTypingIndicator(st.agentTyping || '');
          if (st.unchanged) return;
          self._applyLiveAgentSyncState(st);
        })
        .catch(function () {})
        .finally(function () {
          self._liveAgentPollInFlight = false;
        });
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
          '/api/live-agent/sync?clientSessionId=' +
          encodeURIComponent(this.sessionId)
      )
        .then(function (r) {
          return r.json();
        })
        .then(function (st) {
          if (!st || !st.ok) return;
          if (!humanHandoffFromSync_(st)) {
            if (st.sessionOpen) self._releaseLiveAgentToBot_();
            return;
          }
          self._liveAgentHandoffRequested = true;
          self._applyLiveAgentSyncState(st);
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
