(function () {
  'use strict';

  var KEY = 'qa_live_agent_desk';
  var selectedId = '';
  var pollTimer = null;
  var msgSince = '';

  function loadDesk() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  function apiBase() {
    var d = loadDesk();
    if (d.apiBase) return d.apiBase.replace(/\/$/, '');
    return window.location.origin;
  }

  function headers() {
    var d = loadDesk();
    var h = { 'Content-Type': 'application/json' };
    if (d.token) h['X-Agent-Token'] = d.token;
    return h;
  }

  function agent() {
    var d = loadDesk();
    return {
      agentId: d.agentId || 'agent',
      agentName: d.agentName || 'Agent',
    };
  }

  function fetchJson(url, opts) {
    return fetch(url, opts).then(function (r) {
      return r.json().then(function (body) {
        return { ok: r.ok, status: r.status, body: body };
      });
    });
  }

  function renderList(id, items, emptyText) {
    var ul = document.getElementById(id);
    ul.innerHTML = '';
    if (!items.length) {
      var li = document.createElement('li');
      li.className = 'la-list__empty';
      li.textContent = emptyText;
      ul.appendChild(li);
      return;
    }
    items.forEach(function (s) {
      var li = document.createElement('li');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'la-list__item' + (s.sessionId === selectedId ? ' la-list__item--active' : '');
      btn.innerHTML =
        '<span class="la-list__id">' +
        s.sessionId.slice(0, 8) +
        '…</span>' +
        '<span class="la-list__preview">' +
        (s.preview || '(no messages)') +
        '</span>';
      btn.addEventListener('click', function () {
        selectSession(s.sessionId);
      });
      li.appendChild(btn);
      ul.appendChild(li);
    });
  }

  function refreshQueue() {
    return fetchJson(apiBase() + '/api/live-agent/queue', { headers: headers() }).then(
      function (res) {
        if (!res.ok) {
          if (res.status === 401) {
            alert('Unauthorized — set desk token in Settings.');
          }
          return;
        }
        var b = res.body;
        document.getElementById('la-wait-count').textContent = (b.waiting || []).length;
        document.getElementById('la-active-count').textContent = (b.active || []).length;
        renderList('la-waiting', b.waiting || [], 'No one waiting');
        renderList('la-active', b.active || [], 'No active chats');
      }
    );
  }

  function selectSession(sessionId) {
    selectedId = sessionId;
    msgSince = '';
    document.getElementById('la-chat-empty').hidden = true;
    document.getElementById('la-chat-panel').hidden = false;
    document.getElementById('la-chat-title').textContent = 'Session ' + sessionId.slice(0, 12) + '…';
    loadMessages(true);
    refreshQueue();
  }

  function loadMessages(scrollEnd) {
    if (!selectedId) return;
    var url =
      apiBase() +
      '/api/live-agent/session?sessionId=' +
      encodeURIComponent(selectedId);
    return fetchJson(url, { headers: headers() }).then(function (res) {
      if (!res.ok || !res.body.ok) return;
      var box = document.getElementById('la-messages');
      box.innerHTML = '';
      (res.body.messages || []).forEach(function (m) {
        appendMsgEl(box, m);
        msgSince = m.at || msgSince;
      });
      if (scrollEnd) box.scrollTop = box.scrollHeight;
      var st = res.body.session && res.body.session.status;
      document.getElementById('la-claim').hidden = st === 'active';
      document.getElementById('la-end').hidden = st === 'ended' || st === 'waiting';
    });
  }

  function appendMsgEl(box, m) {
    var div = document.createElement('div');
    div.className = 'la-msg la-msg--' + (m.from || 'system');
    var meta = document.createElement('div');
    meta.className = 'la-msg__meta';
    meta.textContent = (m.from || '') + ' · ' + (m.at || '').replace('T', ' ').slice(0, 19);
    var text = document.createElement('div');
    text.className = 'la-msg__text';
    text.textContent = m.text || '';
    div.appendChild(meta);
    div.appendChild(text);
    box.appendChild(div);
  }

  function pollSelected() {
    if (!selectedId) return;
    fetchJson(
      apiBase() +
        '/api/live-agent/poll?sessionId=' +
        encodeURIComponent(selectedId) +
        (msgSince ? '&since=' + encodeURIComponent(msgSince) : ''),
      { headers: headers() }
    ).then(function (res) {
      if (!res.ok || !res.body.ok) return;
      var box = document.getElementById('la-messages');
      (res.body.messages || []).forEach(function (m) {
        appendMsgEl(box, m);
        msgSince = m.at || msgSince;
      });
      box.scrollTop = box.scrollHeight;
    });
  }

  document.getElementById('la-refresh').addEventListener('click', function () {
    refreshQueue();
    if (selectedId) loadMessages(true);
  });

  document.getElementById('la-claim').addEventListener('click', function () {
    if (!selectedId) return;
    var a = agent();
    fetchJson(apiBase() + '/api/live-agent/claim', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        sessionId: selectedId,
        agentId: a.agentId,
        agentName: a.agentName,
      }),
    }).then(function () {
      loadMessages(true);
      refreshQueue();
    });
  });

  document.getElementById('la-end').addEventListener('click', function () {
    if (!selectedId) return;
    var a = agent();
    fetchJson(apiBase() + '/api/live-agent/end', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        sessionId: selectedId,
        agentId: a.agentId,
        agentName: a.agentName,
      }),
    }).then(function () {
      loadMessages(true);
      refreshQueue();
    });
  });

  document.getElementById('la-reply-form').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!selectedId) return;
    var input = document.getElementById('la-reply-input');
    var text = input.value.trim();
    if (!text) return;
    var a = agent();
    fetchJson(apiBase() + '/api/live-agent/agent-message', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        sessionId: selectedId,
        message: text,
        agentId: a.agentId,
        agentName: a.agentName,
      }),
    }).then(function (res) {
      if (res.body && res.body.ok) {
        input.value = '';
        pollSelected();
      } else if (res.body && res.body.error === 'session_not_active') {
        alert('Take the chat first (Take chat).');
      }
    });
  });

  var d = loadDesk();
  document.getElementById('la-agent-name').textContent = d.agentName || 'Agent';

  refreshQueue();
  pollTimer = setInterval(function () {
    refreshQueue();
    pollSelected();
  }, 2500);
})();
