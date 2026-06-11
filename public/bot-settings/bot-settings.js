(function () {
  'use strict';

  var PROJECT_ID = String(window.BOT_PROJECT_ID || '').trim();
  var $ = function (id) {
    return document.getElementById(id);
  };

  function apiBase() {
    return window.location.origin.replace(/\/$/, '');
  }

  function deskAuth() {
    return window.DashboardDeskAuth || null;
  }

  function authHeaders() {
    var da = deskAuth();
    if (da && da.authHeaders) {
      return da.authHeaders({ 'Content-Type': 'application/json' });
    }
    return { 'Content-Type': 'application/json' };
  }

  function setStatus(msg, ok) {
    var el = $('saveStatus');
    if (!el) return;
    el.textContent = msg || '';
    el.className = 'status' + (ok === true ? ' ok' : ok === false ? ' err' : '');
  }

  function setPath(path, value) {
    var parts = path.split('.');
    var obj = {};
    var cur = obj;
    for (var i = 0; i < parts.length - 1; i++) {
      cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = value;
    return obj;
  }

  function deepMerge(base, over) {
    var out = {};
    var b = base || {};
    var o = over || {};
    Object.keys(b).forEach(function (k) {
      out[k] = b[k];
    });
    Object.keys(o).forEach(function (k) {
      if (
        o[k] &&
        typeof o[k] === 'object' &&
        !Array.isArray(o[k]) &&
        b[k] &&
        typeof b[k] === 'object' &&
        !Array.isArray(b[k])
      ) {
        out[k] = deepMerge(b[k], o[k]);
      } else {
        out[k] = o[k];
      }
    });
    return out;
  }

  function mergePath(target, path, value) {
    return deepMerge(target, setPath(path, value));
  }

  function readToggle(id, path, bag) {
    var el = $(id);
    if (!el) return bag;
    return mergePath(bag, path, !!el.checked);
  }

  function readText(id, path, bag) {
    var el = $(id);
    if (!el) return bag;
    return mergePath(bag, path, String(el.value || '').trim());
  }

  function readNumber(id, path, bag) {
    var el = $(id);
    if (!el) return bag;
    var n = parseInt(el.value, 10);
    return mergePath(bag, path, isNaN(n) ? 0 : n);
  }

  function getByPath(obj, path) {
    var parts = path.split('.');
    var cur = obj;
    for (var i = 0; i < parts.length; i++) {
      if (!cur || typeof cur !== 'object') return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  function fillForm(preset, project) {
    document.querySelectorAll('[data-path]').forEach(function (el) {
      var path = el.getAttribute('data-path');
      var val = getByPath(preset, path);
      if (el.type === 'checkbox') {
        el.checked = !!val;
      } else if (val != null) {
        el.value = val;
      }
    });

    var embed = $('embedSnippet');
    if (embed && project) {
      var lines = ["<script>", "  window.QA_CONFIG = {"];
      if (project.welcomeEventName) {
        lines.push("    welcomeEventName: '" + project.welcomeEventName + "',");
      }
      lines.push("    sitePreset: '" + project.sitePreset + "',");
      lines.push('  };');
      lines.push('<\/script>');
      lines.push(
        '<script src="' +
          apiBase() +
          '/embed.js" async><\/script>'
      );
      embed.textContent = lines.join('\n');
    }
  }

  function collectPreset() {
    var preset = {};
    document.querySelectorAll('[data-path]').forEach(function (el) {
      var path = el.getAttribute('data-path');
      if (el.type === 'checkbox') {
        preset = mergePath(preset, path, !!el.checked);
      } else if (el.type === 'number') {
        var n = parseInt(el.value, 10);
        preset = mergePath(preset, path, isNaN(n) ? 0 : n);
      } else {
        preset = mergePath(preset, path, String(el.value || '').trim());
      }
    });
    return preset;
  }

  async function loadProject() {
    if (!PROJECT_ID) return;
    setStatus('Loading…');
    try {
      var res = await fetch(apiBase() + '/api/bot-settings/' + PROJECT_ID);
      if (!res.ok) throw new Error('Could not load settings');
      var data = await res.json();
      fillForm(data.preset || {}, data.project || {});
      var title = $('pageTitle');
      var sub = $('pageSubtitle');
      if (title && data.project) {
        title.textContent = data.project.name + ' — Bot settings';
      }
      if (sub && data.project) {
        sub.textContent = 'sitePreset: ' + data.project.sitePreset;
      }
      setStatus('Loaded.');
      return data;
    } catch (err) {
      setStatus(err.message || 'Load failed', false);
      return null;
    }
  }

  async function saveProject() {
    if (!PROJECT_ID) return;
    setStatus('Saving…');
    try {
      var res = await fetch(apiBase() + '/api/bot-settings/' + PROJECT_ID, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ preset: collectPreset() }),
      });
      var data = await res.json().catch(function () {
        return {};
      });
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Save failed — check viewer secret');
      }
      fillForm(data.preset || collectPreset(), data.project);
      setStatus('Saved. Live embed will use these settings.', true);
    } catch (err) {
      setStatus(err.message || 'Save failed', false);
    }
  }

  function toggleRow(path, label) {
    return (
      '<label class="toggle-row">' +
      '<input type="checkbox" data-path="' +
      path +
      '" />' +
      '<span>' +
      label +
      '</span></label>'
    );
  }

  function textField(path, label, type) {
    type = type || 'text';
    return (
      '<label class="field">' +
      label +
      '<input type="' +
      type +
      '" data-path="' +
      path +
      '" />' +
      '</label>'
    );
  }

  function renderProjectShell() {
    var app = $('app');
    if (!app) return;
    app.innerHTML =
      '<header class="top-bar">' +
      '<div class="top-bar-inner">' +
      '<div><h1 id="pageTitle">Bot settings</h1>' +
      '<p>Project ID <strong>' +
      PROJECT_ID +
      '</strong> · <span id="pageSubtitle"></span></p></div>' +
      '<div class="nav-links">' +
      '<a class="btn ghost" href="index.html">All projects</a>' +
      '<button type="button" class="btn primary" id="saveBtn">Save settings</button>' +
      '</div></div></header>' +
      '<main class="wrap">' +
      '<form class="settings-form" id="settingsForm" onsubmit="return false">' +
      '<section class="settings-section">' +
      '<h3>General</h3>' +
      '<p class="hint">Chat header and welcome panel</p>' +
      '<div class="field-grid">' +
      textField('common.header.title', 'Chat title') +
      textField('common.header.subtitle', 'Chat subtitle') +
      textField('common.botPersona.label', 'Bot display name') +
      '</div>' +
      '<div class="toggle-grid" style="margin-top:0.75rem">' +
      toggleRow('common.welcome.enabled', 'Welcome panel (before first message)') +
      '</div></section>' +
      '<section class="settings-section">' +
      '<h3>Features (all devices)</h3>' +
      '<div class="toggle-grid">' +
      toggleRow('common.features.multiLanguage.enabled', 'Language dropdown') +
      toggleRow('common.features.speechToText.enabled', 'Speech to text (mic)') +
      toggleRow('common.features.composerUpload.enabled', 'Composer upload (📎)') +
      toggleRow('common.dialogflow.liveAgent.enabled', 'Live agent handoff') +
      toggleRow('common.dialogflow.forms.enabled', 'In-chat forms') +
      toggleRow('common.dialogflow.endChatEvent.enabled', 'ENDCHAT on idle') +
      '</div>' +
      '<div class="field-grid" style="margin-top:0.75rem">' +
      textField('common.dialogflow.endChatEvent.idleTimeoutMs', 'Idle timeout (ms)', 'number') +
      '</div></section>' +
      '<section class="settings-section">' +
      '<h3>Desktop</h3>' +
      '<div class="toggle-grid">' +
      toggleRow('desk.launcherStrip.enabled', 'Launcher strip bubble') +
      toggleRow('desk.autoOpenChat.enabled', 'Auto-open chat') +
      toggleRow('desk.restartButton.enabled', 'Restart button (↻)') +
      toggleRow('desk.poweredBy.enabled', 'Powered by footer') +
      toggleRow('desk.features.speechToText.enabled', 'Mic on desktop') +
      toggleRow('desk.features.composerUpload.enabled', 'Upload on desktop') +
      toggleRow('desk.features.restartChat.enabled', 'Restart chat menu item') +
      '</div>' +
      '<div class="field-grid" style="margin-top:0.75rem">' +
      textField('desk.launcherStrip.text', 'Launcher strip text') +
      textField('desk.autoOpenChat.delayMs', 'Auto-open delay (ms)', 'number') +
      '</div></section>' +
      '<section class="settings-section">' +
      '<h3>Mobile</h3>' +
      '<div class="toggle-grid">' +
      toggleRow('mob.launcherStrip.enabled', 'Launcher strip bubble') +
      toggleRow('mob.autoOpenChat.enabled', 'Auto-open chat') +
      toggleRow('mob.restartButton.enabled', 'Restart button (↻)') +
      toggleRow('mob.poweredBy.enabled', 'Powered by footer') +
      toggleRow('mob.features.speechToText.enabled', 'Mic on mobile') +
      toggleRow('mob.features.composerUpload.enabled', 'Upload on mobile') +
      toggleRow('mob.features.restartChat.enabled', 'Restart chat menu item') +
      '</div>' +
      '<div class="field-grid" style="margin-top:0.75rem">' +
      textField('mob.launcherStrip.text', 'Launcher strip text') +
      textField('mob.autoOpenChat.delayMs', 'Auto-open delay (ms)', 'number') +
      '</div></section>' +
      '<section class="settings-section">' +
      '<h3>Client embed code</h3>' +
      '<p class="hint">Copy this block to the client website for this project.</p>' +
      '<pre class="embed-preview" id="embedSnippet"></pre>' +
      '</section>' +
      '<div class="save-bar">' +
      '<button type="button" class="btn primary" id="saveBtn2">Save settings</button>' +
      '<span class="status" id="saveStatus" role="status"></span>' +
      '</div></form></main>';
    var save2 = $('saveBtn2');
    if (save2) save2.addEventListener('click', saveProject);
  }

  function initHub() {
    fetch(apiBase() + '/api/bot-settings')
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        var root = $('projectList');
        if (!root || !data.projects) return;
        root.innerHTML = '';
        data.projects.forEach(function (p) {
          var card = document.createElement('article');
          card.className = 'project-card';
          var badgeClass = 'id-badge';
          if (p.id === '002') badgeClass += ' gv';
          if (p.id === '003') badgeClass += ' lv';
          card.innerHTML =
            '<span class="' +
            badgeClass +
            '">ID ' +
            p.id +
            '</span>' +
            '<h2>' +
            p.name +
            '</h2>' +
            '<p class="hint">sitePreset: <code>' +
            p.sitePreset +
            '</code></p>' +
            '<p style="margin-top:0.75rem"><a class="btn primary" href="' +
            p.settingsPath +
            '">Open settings</a></p>';
          root.appendChild(card);
        });
      })
      .catch(function () {
        var root = $('projectList');
        if (root) root.textContent = 'Could not load projects.';
      });
  }

  function initProjectPage() {
    renderProjectShell();
    var da = deskAuth();
    if (da && !da.requireAuthOrRedirect('bot-settings/' + PROJECT_ID + '.html')) {
      return;
    }
    var saveBtn = $('saveBtn');
    if (saveBtn) saveBtn.addEventListener('click', saveProject);
    loadProject();
  }

  if (document.body && document.body.dataset.page === 'hub') {
    initHub();
  } else if (PROJECT_ID) {
    initProjectPage();
  }
})();
