(function () {
  'use strict';

  var PROJECT_ID = String(window.BOT_PROJECT_ID || '').trim();
  var currentProject = null;
  var previewFrame = null;
  var previewReady = false;
  var previewPushTimer = null;
  var previewPending = false;
  var previewStarted = false;
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

  function effectivePreset(project, saved) {
    var cfg = window.QA_CHAT_UI_CONFIG || {};
    var sp =
      (cfg.common &&
        cfg.common.sitePresets &&
        cfg.common.sitePresets[project.sitePreset]) ||
      {};
    saved = saved || {};
    return {
      common: deepMerge(
        deepMerge({}, cfg.common || {}),
        deepMerge(sp.common || {}, saved.common || {})
      ),
      desk: deepMerge(
        deepMerge({}, cfg.desk || {}),
        deepMerge(sp.desk || {}, saved.desk || {})
      ),
      mob: deepMerge(
        deepMerge({}, cfg.mob || {}),
        deepMerge(sp.mob || {}, saved.mob || {})
      ),
    };
  }

  function fillForm(preset, project) {
    var view =
      project && project.sitePreset
        ? effectivePreset(project, preset)
        : preset || {};
    document.querySelectorAll('[data-path]').forEach(function (el) {
      var path = el.getAttribute('data-path');
      var val = getByPath(view, path);
      if (el.type === 'checkbox') {
        el.checked = !!val;
      } else if (el.tagName === 'SELECT') {
        el.value = val != null ? String(val) : el.options[0].value;
      } else if (val != null && val !== '') {
        el.value = val;
      } else {
        el.value = '';
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
    var preset = { common: {}, desk: {}, mob: {} };
    document.querySelectorAll('[data-path]').forEach(function (el) {
      var path = el.getAttribute('data-path');
      var value;
      if (el.type === 'checkbox') {
        value = !!el.checked;
      } else if (el.type === 'number') {
        if (String(el.value || '').trim() === '') return;
        var n = parseInt(el.value, 10);
        value = isNaN(n) ? 0 : n;
      } else if (el.tagName === 'SELECT') {
        value = String(el.value || '').trim();
      } else {
        value = String(el.value || '').trim();
      }
      preset = mergePath(preset, path, value);
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
      currentProject = data.project || null;
      fillForm(data.preset || {}, data.project || {});
      startPreviewFrame();
      pushPreviewSoon();
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
      currentProject = data.project || currentProject;
      fillForm(data.preset || collectPreset(), data.project);
      pushPreviewSoon();
      setStatus(
        'Saved. Live sites: hard-refresh (Ctrl+F5). Preview on the right updates instantly.',
        true
      );
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

  function selectField(path, label, options) {
    var html =
      '<label class="field">' +
      label +
      '<select data-path="' +
      path +
      '">';
    options.forEach(function (opt) {
      html +=
        '<option value="' +
        opt.value +
        '">' +
        opt.label +
        '</option>';
    });
    html += '</select></label>';
    return html;
  }

  function deviceSection(prefix, title) {
    var p = prefix;
    return (
      '<section class="settings-section">' +
      '<h3>' +
      title +
      '</h3>' +
      '<p class="hint">Layout, launcher bubble, story ring, chat window size</p>' +
      '<div class="field-grid">' +
      selectField(p + '.chatLayout.side', 'Chat panel side', [
        { value: 'right', label: 'Right' },
        { value: 'left', label: 'Left' },
      ]) +
      textField(p + '.launcher.sizePx', 'Launcher bubble size (px)', 'number') +
      textField(p + '.launcher.iconUrl', 'Bubble launcher icon URL') +
      textField(p + '.chatWindow.widthPx', 'Chat width (px, desktop only)', 'number') +
      textField(p + '.chatWindow.heightPx', 'Chat height (px)', 'number') +
      textField(p + '.chatWindow.minHeightPx', 'Chat min height (px)', 'number') +
      textField(p + '.header.titleFontSizePx', 'Header title size (px)', 'number') +
      textField(p + '.header.iconSizePx', 'Header icon size (px)', 'number') +
      '</div>' +
      '<div class="toggle-grid" style="margin-top:0.75rem">' +
      toggleRow(p + '.launcher.storyRing.enabled', 'Story ring around launcher') +
      toggleRow(p + '.launcher.storyRing.instagramStyle', 'Instagram-style story ring') +
      toggleRow(
        p + '.launcher.storyRing.colorRingMotionEnabled',
        'Animated color ring'
      ) +
      toggleRow(p + '.launcherStrip.enabled', 'Launcher strip bubble') +
      toggleRow(p + '.launcherStrip.wavePopup.enabled', 'Wave emoji popup on strip') +
      toggleRow(p + '.launcher.closeBubbleWhenOpen.enabled', 'Hide bubble when chat open') +
      toggleRow(p + '.autoOpenChat.enabled', 'Auto-open chat') +
      toggleRow(p + '.restartButton.enabled', 'Restart button (↻)') +
      toggleRow(p + '.features.restartChat.enabled', 'Restart chat menu item') +
      '</div>' +
      '<div class="field-grid" style="margin-top:0.75rem">' +
      textField(p + '.launcher.storyRing.widthPx', 'Story ring width (px)', 'number') +
      textField(
        p + '.launcher.storyRing.rotateSeconds',
        'Story ring rotate (seconds)',
        'number'
      ) +
      textField(p + '.launcherStrip.text', 'Launcher strip text') +
      textField(p + '.autoOpenChat.delayMs', 'Auto-open delay (ms)', 'number') +
      '</div></section>'
    );
  }

  function pushPreviewSoon() {
    if (previewPushTimer) clearTimeout(previewPushTimer);
    previewPushTimer = setTimeout(pushPreview, 80);
  }

  function pushPreview() {
    if (!previewFrame || !currentProject) return;
    if (!previewReady) {
      previewPending = true;
      return;
    }
    previewPending = false;
    try {
      previewFrame.contentWindow.postMessage(
        {
          type: 'qa-bot-preview',
          project: currentProject,
          preset: collectPreset(),
        },
        '*'
      );
    } catch (e) {
      previewPending = true;
    }
  }

  function startPreviewFrame() {
    if (!previewFrame || previewStarted) return;
    previewStarted = true;
    previewReady = false;
    previewPending = true;
    previewFrame.src = 'preview.html';
  }

  function bindPreviewListeners() {
    var form = $('settingsForm');
    if (!form) return;
    form.addEventListener('input', pushPreviewSoon);
    form.addEventListener('change', pushPreviewSoon);
  }

  function initPreviewFrame() {
    previewFrame = $('previewFrame');
    if (!previewFrame) return;
    window.addEventListener('message', function (ev) {
      if (ev.data && ev.data.type === 'qa-bot-preview-ready') {
        previewReady = true;
        if (previewPending || currentProject) {
          pushPreview();
        }
      }
    });
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
      '</div></header>' +
      '<main class="wrap settings-split">' +
      '<div class="settings-col-left">' +
      '<div class="settings-toolbar">' +
      '<div class="settings-toolbar__actions">' +
      '<a class="btn ghost" href="index.html">All projects</a>' +
      '<button type="button" class="btn primary" id="saveBtn">Save settings</button>' +
      '</div>' +
      '<span class="status" id="saveStatus" role="status"></span>' +
      '</div>' +
      '<div class="settings-col-scroll">' +
      '<form class="settings-form" id="settingsForm" onsubmit="return false">' +
      '<section class="settings-section">' +
      '<h3>General &amp; header</h3>' +
      '<p class="hint">Titles, logos, welcome panel</p>' +
      '<div class="field-grid">' +
      textField('common.header.title', 'Chat title') +
      textField('common.header.subtitle', 'Chat subtitle') +
      textField('common.botPersona.label', 'Bot display name') +
      textField('common.header.chatIconUrl', 'Bubble launcher icon URL (default)') +
      textField('common.header.headerIconUrl', 'Header logo icon URL') +
      textField('common.header.chatTitleIconUrl', 'Title bar icon URL') +
      textField('common.botPersona.imageUrl', 'Bot avatar image URL') +
      '</div>' +
      '<div class="toggle-grid" style="margin-top:0.75rem">' +
      toggleRow('common.header.showHeaderIcon', 'Show header icon') +
      toggleRow('common.welcome.enabled', 'Welcome panel (before first message)') +
      toggleRow('common.welcome.suggestionChips.enabled', 'Welcome suggestion chips') +
      toggleRow('common.botPersona.showTime', 'Show time on bot messages') +
      toggleRow('common.userPersona.showTime', 'Show time on user messages') +
      '</div></section>' +
      '<section class="settings-section">' +
      '<h3>Bot behaviour</h3>' +
      '<p class="hint">Language, mic, upload, ENDCHAT, FRESH — edit in company.config.js only</p>' +
      '<div class="toggle-grid">' +
      toggleRow('common.dialogflow.liveAgent.enabled', 'Live agent handoff') +
      toggleRow('common.dialogflow.forms.enabled', 'In-chat forms') +
      toggleRow('desk.showChatbot', 'Show chatbot on desktop') +
      toggleRow('mob.showChatbot', 'Show chatbot on mobile') +
      '</div>' +
      '<div class="field-grid" style="margin-top:0.75rem">' +
      textField('common.header.botWritingText', 'Typing indicator text') +
      '</div></section>' +
      deviceSection('desk', 'Desktop — layout &amp; launcher') +
      deviceSection('mob', 'Mobile — layout &amp; launcher') +
      '<section class="settings-section">' +
      '<h3>Client embed code</h3>' +
      '<p class="hint">Copy this block to the client website for this project.</p>' +
      '<pre class="embed-preview" id="embedSnippet"></pre>' +
      '</section>' +
      '</form></div></div>' +
      '<aside class="settings-col-right" aria-label="Live preview">' +
      '<iframe id="previewFrame" title="Chatbot preview"></iframe>' +
      '<div class="preview-foot">' +
      '<h3>Live preview</h3>' +
      '<p>Changes show here instantly (before Save)</p>' +
      '</div>' +
      '</aside></main>';
    initPreviewFrame();
    bindPreviewListeners();
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
    document.body.classList.add('bot-settings-project');
    document.documentElement.classList.add('bot-settings-project');
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
