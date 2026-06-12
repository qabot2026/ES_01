(function () {
  'use strict';

  var auth = window.DashboardDeskAuth;
  var nav = window.DashboardNav;

  function apiBase() {
    return auth.apiBase();
  }

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderBotList(bots) {
    var el = document.getElementById('superBotList');
    if (!el) return;
    if (!bots.length) {
      el.innerHTML = '<p class="dash-muted">No bots registered yet.</p>';
      return;
    }
    el.innerHTML =
      '<table class="super-bot-table" aria-label="Registered bots">' +
      '<thead><tr><th>Bot ID</th><th>Name</th><th>Welcome event</th><th>Files</th><th></th></tr></thead><tbody>' +
      bots
        .map(function (b) {
          var event = b.welcomeEventName
            ? '<code>' + esc(b.welcomeEventName) + '</code>'
            : '<span class="dash-muted">(default / home)</span>';
          var canDelete = b.id !== '10001' && bots.length > 1;
          var deleteCell = canDelete
            ? '<button type="button" class="super-delete-btn" data-bot-id="' +
              esc(b.id) +
              '" data-bot-name="' +
              esc(b.name) +
              '">Delete</button>'
            : '<span class="dash-muted" title="Default bot cannot be removed">—</span>';
          return (
            '<tr>' +
            '<td><code>' +
            esc(b.id) +
            '</code></td>' +
            '<td>' +
            esc(b.name) +
            '</td>' +
            '<td>' +
            event +
            '</td>' +
            '<td class="super-bot-links">' +
            '<a href="' +
            nav.bidPath(b.id, 'uc-conversations') +
            '">Insights</a> · ' +
            '<a href="' +
            nav.bidPath(b.id, 'uiux-setting') +
            '">Appearance</a>' +
            (b.demoPath
              ? ' · <a href="' + esc(b.demoPath) + '" target="_blank" rel="noopener">Demo</a>'
              : '') +
            (b.configPath
              ? ' · <a href="' + esc(b.configPath) + '" target="_blank" rel="noopener">UI config</a>'
              : '') +
            '</td>' +
            '<td class="super-bot-actions">' +
            deleteCell +
            '</td></tr>'
          );
        })
        .join('') +
      '</tbody></table>';

    el.querySelectorAll('.super-delete-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        deleteBot(btn.getAttribute('data-bot-id'), btn.getAttribute('data-bot-name'));
      });
    });
  }

  function deleteBot(botId, botName) {
    var label = botName ? botName + ' (' + botId + ')' : botId;
    if (!window.confirm('Delete bot ' + label + '? This removes it from the dashboard and clears its appearance preset. This cannot be undone.')) {
      return;
    }
    setStatus('Deleting…', false);

    fetch(apiBase() + '/api/bot-registry/' + encodeURIComponent(botId), {
      method: 'DELETE',
      credentials: 'same-origin',
      headers: auth.authHeaders(),
    })
      .then(function (res) {
        return res.json().then(function (body) {
          return { ok: res.ok, body: body };
        });
      })
      .then(function (result) {
        if (!result.ok || !result.body.ok) {
          throw new Error((result.body && result.body.error) || 'Could not delete bot');
        }
        setStatus('Bot ' + label + ' deleted.', false);
        var currentBid = nav.getBid();
        return nav.refreshBots().then(function () {
          if (currentBid === botId && nav.BOTS.length) {
            window.location.href = '/dashboard/supersetting.html?bid=' + encodeURIComponent(nav.BOTS[0].id);
            return;
          }
          return loadRegistry();
        });
      })
      .catch(function (err) {
        setStatus(err.message || 'Request failed', true);
      });
  }

  function setStatus(msg, isError) {
    var el = document.getElementById('superFormStatus');
    if (!el) return;
    el.textContent = msg || '';
    el.className = 'super-form-status' + (isError ? ' super-form-status--error' : ' super-form-status--ok');
    el.hidden = !msg;
  }

  function loadRegistry() {
    return fetch(apiBase() + '/api/bot-registry', { credentials: 'same-origin' })
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        renderBotList((data && data.bots) || []);
        return data;
      })
      .catch(function () {
        renderBotList(nav.BOTS || []);
      });
  }

  function bindForm() {
    var form = document.getElementById('superAddBotForm');
    if (!form) return;

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      setStatus('Saving…', false);

      var id = document.getElementById('superBotId').value.trim();
      var name = document.getElementById('superBotName').value.trim();
      var welcomeEventName = document.getElementById('superWelcomeEvent').value.trim();

      fetch(apiBase() + '/api/bot-registry', {
        method: 'POST',
        credentials: 'same-origin',
        headers: Object.assign({ 'Content-Type': 'application/json' }, auth.authHeaders()),
        body: JSON.stringify({ id: id, name: name, welcomeEventName: welcomeEventName }),
      })
        .then(function (res) {
          return res.json().then(function (body) {
            return { ok: res.ok, body: body };
          });
        })
        .then(function (result) {
          if (!result.ok || !result.body.ok) {
            throw new Error((result.body && result.body.error) || 'Could not add bot');
          }
          var files = (result.body.filesCreated || []).join(', ');
          var extra = files ? ' Files: ' + files + '.' : '';
          setStatus(
            'Bot ' +
              result.body.bot.name +
              ' (' +
              result.body.bot.id +
              ') created. Config file, dashboard pages, demo HTML, and appearance preset are ready.' +
              extra,
            false
          );
          form.reset();
          return nav.refreshBots().then(function () {
            return loadRegistry();
          });
        })
        .catch(function (err) {
          setStatus(err.message || 'Request failed', true);
        });
    });
  }

  function init() {
    var bid = nav.getBid();
    var bot = nav.BOTS.find(function (b) {
      return b.id === bid;
    }) || nav.BOTS[0];

    nav.mount({
      active: 'supersetting',
      title: 'Advanced configuration',
      subtitle: bot.name + ' (Bot ID ' + bot.id + ')',
    });

    var line = document.getElementById('superBotLine');
    if (line) {
      line.textContent =
        'Add new chatbot projects here — no code edits. Each bot gets Insights, Customer questions, and Chatbot appearance pages automatically.';
    }

    var uiLink = document.getElementById('superUiLink');
    if (uiLink) uiLink.href = nav.bidPath(bid, 'uiux-setting');

    bindForm();
    loadRegistry();
  }

  nav.whenReady(init);
})();
