(function (global) {
  'use strict';

  var DESK_KEY = 'qa_live_agent_desk';
  var SECRET_KEY = 'conversations_sheet_secret_v1';

  function desk() {
    try {
      return JSON.parse(localStorage.getItem(DESK_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  function viewerSecret() {
    try {
      return (
        sessionStorage.getItem(SECRET_KEY) ||
        localStorage.getItem(SECRET_KEY) ||
        ''
      ).trim();
    } catch (e) {
      return '';
    }
  }

  function hasAuth() {
    return !!(desk().token || viewerSecret());
  }

  function authHeaders(extra) {
    var h = extra || {};
    var d = desk();
    if (d.token) h['X-Agent-Token'] = d.token;
    var s = viewerSecret();
    if (s) h['X-Conversations-Sheet-Secret'] = s;
    return h;
  }

  function apiBase() {
    var d = desk();
    return (d.apiBase || window.location.origin).replace(/\/$/, '');
  }

  function requireAuthOrRedirect(returnPath) {
    if (hasAuth()) return true;
    var next = returnPath || 'dashboard/index.html';
    window.location.href =
      '../live-agent/settings.html?next=' + encodeURIComponent(next);
    return false;
  }

  global.DashboardDeskAuth = {
    desk: desk,
    viewerSecret: viewerSecret,
    hasAuth: hasAuth,
    authHeaders: authHeaders,
    apiBase: apiBase,
    requireAuthOrRedirect: requireAuthOrRedirect,
  };
})(typeof window !== 'undefined' ? window : this);
