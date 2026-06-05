(function () {
  'use strict';

  var auth = window.DashboardDeskAuth;
  if (!auth) return;

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function formatWhen(iso) {
    if (!iso) return '—';
    try {
      var d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return iso;
    }
  }

  function formatPeriodLabel(period) {
    if (!period) return '';
    var from = period.from ? new Date(period.from) : null;
    var to = period.to ? new Date(period.to) : null;
    if (!from || !to) return '';
    return (
      from.toLocaleDateString() + ' → ' + to.toLocaleDateString()
    );
  }

  function renderQueryRows(list, emptyLabel) {
    if (!list.length) {
      return (
        '<tr><td colspan="4" class="qa-loading">' +
        escapeHtml(emptyLabel) +
        '</td></tr>'
      );
    }
    return list
      .map(function (q) {
        return (
          '<tr>' +
          '<td class="qa-query-cell">' +
          escapeHtml(q.query) +
          '</td>' +
          '<td class="num"><strong>' +
          (q.times || 0) +
          '</strong></td>' +
          '<td class="num">' +
          (q.sessions || 0) +
          '</td>' +
          '<td class="num">' +
          escapeHtml(formatWhen(q.lastAt)) +
          '</td></tr>'
        );
      })
      .join('');
  }

  function renderTables(data) {
    var answered = (data && data.answeredQueries) || [];
    var unanswered = (data && data.unansweredQueries) || [];

    var answeredBody = $('qa-answered-body');
    var unansweredBody = $('qa-unanswered-body');
    if (answeredBody) {
      answeredBody.innerHTML = renderQueryRows(
        answered,
        'No answered queries in this period.'
      );
    }
    if (unansweredBody) {
      unansweredBody.innerHTML = renderQueryRows(
        unanswered,
        'No unanswered queries in this period.'
      );
    }
  }

  function render(data) {
    var s = data.summary || {};
    $('qa-total').textContent = s.totalQueries != null ? s.totalQueries : '—';
    $('qa-bot').textContent = s.botAnswered != null ? s.botAnswered : '—';
    $('qa-fallback').textContent = s.fallback != null ? s.fallback : '—';
    $('qa-handoff').textContent = s.handoff != null ? s.handoff : '—';
    $('qa-unique').textContent = s.uniqueQueries != null ? s.uniqueQueries : '—';
    $('qa-period-label').textContent = formatPeriodLabel(data.period);
    renderTables(data);
  }

  function showUnlock(message) {
    var panel = $('qa-unlock');
    var msg = $('qa-unlock-msg');
    if (panel) panel.classList.remove('hidden');
    if (msg) {
      msg.textContent = message || '';
      msg.classList.toggle('ok', !message);
    }
    var saved = auth.viewerSecret();
    if (saved && $('qa-secret') && !$('qa-secret').value) {
      $('qa-secret').value = saved;
    }
  }

  function hideUnlock() {
    var panel = $('qa-unlock');
    var msg = $('qa-unlock-msg');
    if (panel) panel.classList.add('hidden');
    if (msg) {
      msg.textContent = '';
      msg.classList.remove('ok');
    }
  }

  function load() {
    if (!auth.hasAuth()) {
      showUnlock('Enter your viewer secret to load query analytics.');
      return;
    }

    var days = $('qa-period') ? $('qa-period').value : '30';
    var answeredBody = $('qa-answered-body');
    var unansweredBody = $('qa-unanswered-body');
    if (answeredBody) {
      answeredBody.innerHTML = '<tr><td colspan="4" class="qa-loading">Loading…</td></tr>';
    }
    if (unansweredBody) {
      unansweredBody.innerHTML = '<tr><td colspan="4" class="qa-loading">Loading…</td></tr>';
    }

    var url =
      auth.apiBase() +
      '/api/analytics/queries?days=' +
      encodeURIComponent(days);
    url = auth.withAuthQuery(url);

    fetch(url, { headers: auth.authHeaders() })
      .then(function (r) {
        return r.json().then(function (data) {
          return { status: r.status, data: data };
        });
      })
      .then(function (res) {
        if (res.status === 401 || !res.data.ok) {
          var detail =
            (res.data && (res.data.message || res.data.error)) ||
            'Secret not accepted.';
          showUnlock(detail + ' Check CONVERSATIONS_SHEET_VIEW_SECRET on Railway.');
          return;
        }
        hideUnlock();
        render(res.data);
      })
      .catch(function () {
        showUnlock('Network error — try again.');
      });
  }

  function unlockAndLoad() {
    var input = $('qa-secret');
    var msg = $('qa-unlock-msg');
    var btn = $('qa-unlock-btn');
    var secret = input ? input.value.trim() : '';
    if (!secret) {
      if (msg) msg.textContent = 'Enter viewer secret.';
      return;
    }
    if (btn) btn.disabled = true;
    if (msg) msg.textContent = 'Checking secret…';
    auth.validateSecret(secret).then(function (result) {
      if (btn) btn.disabled = false;
      if (!result.ok) {
        if (msg) msg.textContent = result.message || 'Secret not accepted.';
        return;
      }
      if (msg) {
        msg.textContent = 'Unlocked.';
        msg.classList.add('ok');
      }
      load();
    });
  }

  $('qa-refresh').addEventListener('click', load);
  $('qa-period').addEventListener('change', load);
  if ($('qa-unlock-btn')) {
    $('qa-unlock-btn').addEventListener('click', unlockAndLoad);
  }
  if ($('qa-secret')) {
    $('qa-secret').addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') unlockAndLoad();
    });
  }
  load();
})();
