(function () {
  'use strict';

  var widgetInstance = null;
  var bootTimer = null;

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

  function destroyWidget() {
    var nodes = document.querySelectorAll('.qa-widget');
    nodes.forEach(function (n) {
      n.parentNode.removeChild(n);
    });
    widgetInstance = null;
    window.__qaWidgetLoaded = false;
  }

  function applyPreview(payload) {
    if (!payload || !payload.project) return;
    var project = payload.project;
    var preset = payload.preset || {};
    var cfg = window.QA_CHAT_UI_CONFIG;
    if (!cfg || !cfg.common) return;

    if (!cfg.common.sitePresets) cfg.common.sitePresets = {};
    cfg.common.sitePresets[project.sitePreset] = deepMerge(
      cfg.common.sitePresets[project.sitePreset] || {},
      preset
    );

    window.QA_CONFIG = {
      apiBase: window.location.origin.replace(/\/$/, ''),
      sitePreset: project.sitePreset,
      previewViewport: 'desk',
    };
    if (project.welcomeEventName) {
      window.QA_CONFIG.welcomeEventName = project.welcomeEventName;
    }

    destroyWidget();

    if (!window.QualityAssistantWidget) return;

    widgetInstance = new window.QualityAssistantWidget({
      apiBase: window.QA_CONFIG.apiBase,
    });

    var hint = document.getElementById('previewHint');
    if (hint) hint.textContent = project.name + ' — live preview';

    setTimeout(function () {
      if (!widgetInstance) return;
      if (typeof widgetInstance.applyLayout === 'function') {
        widgetInstance.applyLayout();
      }
      if (typeof widgetInstance.applyTheme === 'function') {
        widgetInstance.applyTheme();
      }
      if (typeof widgetInstance.open === 'function') {
        widgetInstance.open();
      }
    }, 150);
  }

  function schedulePreview(payload) {
    if (bootTimer) clearTimeout(bootTimer);
    bootTimer = setTimeout(function () {
      bootTimer = null;
      applyPreview(payload);
    }, 280);
  }

  window.addEventListener('message', function (ev) {
    var data = ev.data;
    if (!data || data.type !== 'qa-bot-preview') return;
    schedulePreview(data);
  });

  if (window.parent !== window) {
    window.parent.postMessage({ type: 'qa-bot-preview-ready' }, '*');
  }
})();
