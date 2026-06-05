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

  function parseInputDate(raw) {
    var dd = window.QADateDisplay;
    if (dd && dd.parseToIsoYmd) return dd.parseToIsoYmd(raw);
    return String(raw || '').trim();
  }

  function formatDmy(raw) {
    var dd = window.QADateDisplay;
    if (dd && dd.formatDateDisplay) return dd.formatDateDisplay(raw);
    return String(raw || '').trim();
  }

  function localTodayIso() {
    var d = new Date();
    return (
      d.getFullYear() +
      '-' +
      String(d.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(d.getDate()).padStart(2, '0')
    );
  }

  function todayDmy() {
    return formatDmy(localTodayIso());
  }

  function initDefaultDates() {
    var today = todayDmy();
    if ($('appt-from') && !$('appt-from').value) $('appt-from').value = today;
    if ($('appt-to') && !$('appt-to').value) $('appt-to').value = today;
  }

  function buildUrl() {
    var base = auth.apiBase() + '/api/appointments?';
    var fromRaw = $('appt-from') ? $('appt-from').value : '';
    var toRaw = $('appt-to') ? $('appt-to').value : '';
    var qs = [];
    if (fromRaw) {
      var from = parseInputDate(fromRaw);
      if (from) qs.push('from=' + encodeURIComponent(from));
    }
    if (toRaw) {
      var to = parseInputDate(toRaw);
      if (to) qs.push('to=' + encodeURIComponent(to));
    }
    return base + qs.join('&');
  }

  function renderRows(data) {
    var body = $('appt-body');
    var meta = $('appt-meta');
    if (!body) return;

    var rows = (data && data.appointments) || [];
    if (!rows.length) {
      body.innerHTML =
        '<tr><td colspan="8" class="appt-empty">No appointments for the selected date(s).</td></tr>';
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
            esc(formatDmy(row.appointmentDate) || '—') +
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
            esc(formatDmy(row.conversationDate) || '—') +
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
      var df = data && data.dateFilter;
      if (df && df.from && df.to) {
        parts.push(
          df.from === df.to
            ? 'App. date: ' + df.from
            : 'App. dates: ' + df.from + ' – ' + df.to
        );
      }
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
  if ($('appt-today')) {
    $('appt-today').addEventListener('click', function () {
      var today = todayDmy();
      if ($('appt-from')) $('appt-from').value = today;
      if ($('appt-to')) $('appt-to').value = today;
      load();
    });
  }
  $('appt-apply').addEventListener('click', load);
  if ($('appt-unlock-btn')) {
    $('appt-unlock-btn').addEventListener('click', unlockAndLoad);
  }
  if ($('appt-secret')) {
    $('appt-secret').addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') unlockAndLoad();
    });
  }
  initDefaultDates();
  load();
})();
