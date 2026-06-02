/**
 * Sync chat turns to server for transcript + analytics.
 */
(function (global) {
  'use strict';

  function patchWidget() {
    var C = global.QualityAssistantWidget;
    if (!C || !C.prototype || C.prototype._transcriptPatched) return !!C;
    var p = C.prototype;
    p._transcriptPatched = true;

    var origAppend = p.appendMessage;
    p.appendMessage = function (role, text, options) {
      var out = origAppend.call(this, role, text, options);
      var t = text == null ? '' : String(text).trim();
      if (!t || !this.apiBase || !this.sessionId) return out;
      if (role !== 'user' && role !== 'bot') return out;
      fetch(this.apiBase + '/api/transcript/append', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          role: role,
          text: t,
        }),
      }).catch(function () {});
      return out;
    };

    return true;
  }

  if (!patchWidget()) {
    var n = 0;
    var iv = setInterval(function () {
      n += 1;
      if (patchWidget() || n > 80) clearInterval(iv);
    }, 100);
  }
})(typeof window !== 'undefined' ? window : globalThis);
