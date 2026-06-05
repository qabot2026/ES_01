(function () {
  'use strict';

  var auth = window.DashboardDeskAuth;
  if (!auth) return;

  function $(id) {
    return document.getElementById(id);
  }

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  function buildUrl() {
    var base = auth.apiBase() + '/api/appointments?';
    var from = $('appt-from') ? $('appt-from').value : '';
    var to = $('appt-to') ? $('appt-to').value : '';
    var qs = [];
    if (from) qs.push('from=' + encodeURIComponent(from));
    if (to) qs.push('to=' + encodeURIComponent(to));
    return base + qs.join('&');
  }

  function renderRows(data) {
    var body = $('appt-body');
    var meta = $('appt-meta');
    if (!body) return;

    var rows = (data && data.appointments) || [];
    if (!rows.length) {
      body.innerHTML =
        '<tr><td colspan="8" class="appt-empty">No appointment bookings in this period.</td></tr>';
    } else {
      body.innerHTML = rows
        .map(function (row) {
          var link = row.transcriptUrl || '';
          var chatCell = link
            ? '<a href="' +
              esc(link) +
              '" target="_blank" rel="noopener">Open chat</a>'
            : '—';
          return (
            '<tr>' +
            '<td>' +
            esc(row.appointmentDate || '—') +
            '</td>' +
            '<td>' +
            esc(row.appointmentTime || '—') +
            '</td>' +
            '<td>' +
            esc(row.name || '—') +
            '</td>' +
            '<td>' +
            esc(row.mobile || '—') +
            '</td>' +
            '<td>' +
            esc(row.email || '—') +
            '</td>' +
            '<td>' +
            esc(row.conversationDate || '—') +
            '</td>' +
            '<td>' +
            esc(row.channel || '—') +
            '</td>' +
            '<td>' +
            chatCell +
            '</td>' +
            '</tr>'
          );
        })
        .join('');
    }

    if (meta) {
      var parts = [rows.length + ' appointment' + (rows.length === 1 ? '' : 's')];
      if (data && data.source) parts.push('source: ' + data.source);
      if (data && data.sheetsConfigured === false) {
        parts.push('Google Sheet not configured — showing transcript data only');
      }
      meta.textContent = parts.join(' · ');
    }
  }

  function showUnlock(message) {
    var panel = $('appt-unlock');
    var msg = $('appt-unlock-msg');
    if (panel) panel.classList.remove('hidden');
    if (msg) {
      msg.textContent = message || '';
      msg.classList.toggle('ok', !message);
    }
    var saved = auth.viewerSecret();
    if (saved && $('appt-secret') && !$('appt-secret').value) {
      $('appt-secret').value = saved;
    }
  }

  function hideUnlock() {
    var panel = $('appt-unlock');
    var msg = $('appt-unlock-msg');
    if (panel) panel.classList.add('hidden');
    if (msg) {
      msg.textContent = '';
      msg.classList.remove('ok');
    }
  }

  function load() {
    if (!auth.hasAuth()) {
      showUnlock('Enter your viewer secret to load appointments.');
      return;
    }

    var body = $('appt-body');
    if (body) {
      body.innerHTML = '<tr><td colspan="8" class="appt-loading">Loading…</td></tr>';
    }

    var url = auth.withAuthQuery(buildUrl());
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
          showUnlock(detail);
          return;
        }
        hideUnlock();
        renderRows(res.data);
      })
      .catch(function () {
        showUnlock('Network error — try again.');
      });
  }

  function unlockAndLoad() {
    var input = $('appt-secret');
    var msg = $('appt-unlock-msg');
    var btn = $('appt-unlock-btn');
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

  $('appt-refresh').addEventListener('click', load);
  $('appt-apply').addEventListener('click', load);
  if ($('appt-unlock-btn')) {
    $('appt-unlock-btn').addEventListener('click', unlockAndLoad);
  }
  if ($('appt-secret')) {
    $('appt-secret').addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') unlockAndLoad();
    });
  }
  load();
})();
