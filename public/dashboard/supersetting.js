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

  function escAttr(s) {
    return esc(s).replace(/'/g, '&#39;');
  }

  function suggestSheetTab(name) {
    var label = String(name || '').trim();
    if (!label) return 'Bot Conv.';
    return label + ' Conv.';
  }

  function setStatus(msg, isError) {
    var el = document.getElementById('superFormStatus');
    if (!el) return;
    el.textContent = msg || '';
    el.className = 'super-form-status' + (isError ? ' super-form-status--error' : ' super-form-status--ok');
    el.hidden = !msg;
  }

  function setListStatus(msg, isError) {
    var el = document.getElementById('superListStatus');
    if (!el) return;
    el.textContent = msg || '';
    el.className = 'super-list-status' + (isError ? ' super-list-status--error' : ' super-list-status--ok');
    el.hidden = !msg;
  }

  function saveBotSettings(botId, rowEl) {
    if (!botId || !rowEl) return Promise.resolve();

    var sheetInput = rowEl.querySelector('.super-sheet-tab-input');
    var welcomeInput = rowEl.querySelector('.super-welcome-input');
    var saveBtn = rowEl.querySelector('.super-save-btn');
    var sheetTab = sheetInput ? sheetInput.value.trim() : '';
    var welcomeEventName = welcomeInput ? welcomeInput.value.trim() : '';

    if (!sheetTab) {
      setListStatus('Sheet tab name cannot be empty.', true);
      return Promise.resolve();
    }

    if (saveBtn) saveBtn.disabled = true;
    setListStatus('Saving bot ' + botId + '…', false);

    return fetch(apiBase() + '/api/bot-registry/' + encodeURIComponent(botId), {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: Object.assign({ 'Content-Type': 'application/json' }, auth.authHeaders()),
      body: JSON.stringify({ sheetTab: sheetTab, welcomeEventName: welcomeEventName }),
    })
      .then(function (res) {
        return res.json().then(function (body) {
          return { ok: res.ok, status: res.status, body: body };
        });
      })
      .then(function (result) {
        if (result.status === 401) {
          throw new Error('Not signed in — open Live chat inbox or Insights and enter your desk token first.');
        }
        if (!result.ok || !result.body.ok) {
          throw new Error((result.body && result.body.error) || 'Could not save settings');
        }
        var bot = result.body.bot || {};
        setListStatus(
          'Saved ' +
            (bot.name || 'bot') +
            ' (' +
            botId +
            '): sheet tab "' +
            (bot.sheetTab || sheetTab) +
            '"' +
            (bot.welcomeEventName
              ? ', welcome event "' + bot.welcomeEventName + '"'
              : ', welcome event cleared'),
          false
        );
        if (sheetInput && bot.sheetTab) sheetInput.value = bot.sheetTab;
        if (welcomeInput) welcomeInput.value = bot.welcomeEventName || '';
        return nav.refreshBots().then(loadRegistry);
      })
      .catch(function (err) {
        setListStatus(err.message || 'Request failed', true);
      })
      .finally(function () {
        if (saveBtn) saveBtn.disabled = false;
      });
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
      '<thead><tr><th>Bot ID</th><th>Name</th><th>Sheet tab</th><th>Welcome event</th><th></th><th>Files</th><th></th></tr></thead><tbody>' +
      bots
        .map(function (b) {
          var tabVal = escAttr(b.sheetTab || '');
          var welcomeVal = escAttr(b.welcomeEventName || '');
          var canDelete = b.id !== '10001' && bots.length > 1;
          var deleteCell = canDelete
            ? '<button type="button" class="super-delete-btn" data-bot-id="' +
              esc(b.id) +
              '" data-bot-name="' +
              esc(b.name) +
              '">Delete</button>'
            : '<span class="dash-muted" title="Default bot cannot be removed">—</span>';
          return (
            '<tr data-bot-row="' +
            esc(b.id) +
            '">' +
            '<td><code>' +
            esc(b.id) +
            '</code></td>' +
            '<td>' +
            esc(b.name) +
            '</td>' +
            '<td><input class="super-sheet-tab-input" type="text" data-bot-id="' +
            esc(b.id) +
            '" value="' +
            tabVal +
            '" aria-label="Sheet tab for ' +
            esc(b.name) +
            '" /></td>' +
            '<td><input class="super-welcome-input" type="text" data-bot-id="' +
            esc(b.id) +
            '" value="' +
            welcomeVal +
            '" placeholder="(default / home)" aria-label="Welcome event for ' +
            esc(b.name) +
            '" /></td>' +
            '<td class="super-bot-actions"><button type="button" class="super-save-btn" data-bot-id="' +
            esc(b.id) +
            '">Save</button></td>' +
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

    el.querySelectorAll('.super-save-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var botId = btn.getAttribute('data-bot-id');
        var row = btn.closest('tr[data-bot-row]');
        saveBotSettings(botId, row);
      });
    });
  }

  function deleteBot(botId, botName) {
    var label = botName ? botName + ' (' + botId + ')' : botId;
    if (!window.confirm('Delete bot ' + label + '? This removes it from the dashboard and clears its appearance preset. This cannot be undone.')) {
      return;
    }
    setListStatus('Deleting…', false);

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
        setListStatus('Bot ' + label + ' deleted.', false);
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
        setListStatus(err.message || 'Request failed', true);
      });
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

    var nameInput = document.getElementById('superBotName');
    var sheetTabInput = document.getElementById('superSheetTab');

    if (nameInput && sheetTabInput) {
      nameInput.addEventListener('input', function () {
        if (sheetTabInput.dataset.touched === '1') return;
        sheetTabInput.value = suggestSheetTab(nameInput.value);
      });
      sheetTabInput.addEventListener('input', function () {
        sheetTabInput.dataset.touched = '1';
      });
    }

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      setStatus('Saving…', false);

      var id = document.getElementById('superBotId').value.trim();
      var name = document.getElementById('superBotName').value.trim();
      var welcomeEventName = document.getElementById('superWelcomeEvent').value.trim();
      var sheetTab = sheetTabInput ? sheetTabInput.value.trim() : '';

      fetch(apiBase() + '/api/bot-registry', {
        method: 'POST',
        credentials: 'same-origin',
        headers: Object.assign({ 'Content-Type': 'application/json' }, auth.authHeaders()),
        body: JSON.stringify({
          id: id,
          name: name,
          welcomeEventName: welcomeEventName,
          sheetTab: sheetTab,
        }),
      })
        .then(function (res) {
          return res.json().then(function (body) {
            return { ok: res.ok, status: res.status, body: body };
          });
        })
        .then(function (result) {
          if (result.status === 401) {
            throw new Error('Not signed in — open Live chat inbox or Insights and enter your desk token first.');
          }
          if (!result.ok || !result.body.ok) {
            throw new Error((result.body && result.body.error) || 'Could not add bot');
          }
          var bot = result.body.bot || {};
          var files = (result.body.filesCreated || []).join(', ');
          var extra = files ? ' Files: ' + files + '.' : '';
          setStatus(
            'Bot ' +
              bot.name +
              ' (' +
              bot.id +
              ') created. Sheet tab "' +
              (bot.sheetTab || '') +
              '" is ready.' +
              extra,
            false
          );
          form.reset();
          if (sheetTabInput) delete sheetTabInput.dataset.touched;
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
        'Create new bots below. For existing bots, edit settings in the table and click Save on each row.';
    }

    var uiLink = document.getElementById('superUiLink');
    if (uiLink) uiLink.href = nav.bidPath(bid, 'uiux-setting');

    bindForm();
    loadRegistry();
  }

  nav.whenReady(init);
})();
