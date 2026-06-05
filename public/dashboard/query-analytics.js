(function () {
  'use strict';

  var KEY = 'qa_live_agent_desk';

  function desk() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  function headers() {
    var d = desk();
    var h = {};
    if (d.token) h['X-Agent-Token'] = d.token;
    return h;
  }

  function apiBase() {
    var d = desk();
    return (d.apiBase || window.location.origin).replace(/\/$/, '');
  }

  if (!desk().token) {
    window.location.href = '../live-agent/settings.html';
    return;
  }

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

  function renderDaily(daily) {
    var root = $('qa-daily');
    if (!root) return;
    var list = daily || [];
    if (!list.length) {
      root.innerHTML = '<p class="dash-muted">No queries in this period.</p>';
      return;
    }
    var max = 1;
    for (var i = 0; i < list.length; i++) {
      if (list[i].total > max) max = list[i].total;
    }
    root.innerHTML = list
      .map(function (d) {
        var botW = Math.round((d.bot / max) * 100);
        var fbW = Math.round((d.fallback / max) * 100);
        var hoW = Math.round((d.handoff / max) * 100);
        return (
          '<div class="qa-day-row">' +
          '<span class="qa-day-label">' +
          escapeHtml(d.date) +
          '</span>' +
          '<div class="qa-day-bar" title="Bot ' +
          d.bot +
          ', Fallback ' +
          d.fallback +
          ', Agent ' +
          d.handoff +
          '">' +
          (botW ? '<span class="seg-bot" style="width:' + botW + '%"></span>' : '') +
          (fbW ? '<span class="seg-fallback" style="width:' + fbW + '%"></span>' : '') +
          (hoW ? '<span class="seg-handoff" style="width:' + hoW + '%"></span>' : '') +
          '</div>' +
          '<span class="qa-day-total">' +
          d.total +
          '</span></div>'
        );
      })
      .join('');
  }

  function renderTable(queries) {
    var body = $('qa-table-body');
    if (!body) return;
    var list = queries || [];
    if (!list.length) {
      body.innerHTML =
        '<tr><td colspan="7" class="qa-loading">No queries in this period.</td></tr>';
      return;
    }
    body.innerHTML = list
      .map(function (q) {
        return (
          '<tr>' +
          '<td class="qa-query-cell">' +
          escapeHtml(q.query) +
          '</td>' +
          '<td class="num"><strong>' +
          q.total +
          '</strong></td>' +
          '<td class="num">' +
          q.bot +
          '</td>' +
          '<td class="num">' +
          (q.fallback
            ? '<span class="qa-pill qa-pill--fallback">' + q.fallback + '</span>'
            : '0') +
          '</td>' +
          '<td class="num">' +
          (q.handoff
            ? '<span class="qa-pill qa-pill--handoff">' + q.handoff + '</span>'
            : '0') +
          '</td>' +
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

  function render(data) {
    var s = data.summary || {};
    $('qa-total').textContent = s.totalQueries != null ? s.totalQueries : '—';
    $('qa-bot').textContent = s.botAnswered != null ? s.botAnswered : '—';
    $('qa-fallback').textContent = s.fallback != null ? s.fallback : '—';
    $('qa-handoff').textContent = s.handoff != null ? s.handoff : '—';
    $('qa-unique').textContent = s.uniqueQueries != null ? s.uniqueQueries : '—';
    $('qa-period-label').textContent = formatPeriodLabel(data.period);
    renderDaily(data.daily);
    renderTable(data.queries);
  }

  function load() {
    var days = $('qa-period') ? $('qa-period').value : '30';
    var body = $('qa-table-body');
    if (body) {
      body.innerHTML = '<tr><td colspan="7" class="qa-loading">Loading…</td></tr>';
    }
    fetch(apiBase() + '/api/analytics/queries?days=' + encodeURIComponent(days), {
      headers: headers(),
    })
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        if (!data.ok) {
          alert('Could not load query analytics. Check desk token.');
          return;
        }
        render(data);
      })
      .catch(function () {
        alert('Network error');
      });
  }

  $('qa-refresh').addEventListener('click', load);
  $('qa-period').addEventListener('change', load);
  load();
})();
