(function () {
  'use strict';

  var widgetInstance = null;
  var bootTimer = null;
  var currentSitePreset = null;

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
    currentSitePreset = null;
    window.__qaWidgetLoaded = false;
  }

  function mergePreviewConfig(payload) {
    var project = payload.project;
    var preset = payload.preset || {};
    var cfg = window.QA_CHAT_UI_CONFIG;
    if (!cfg || !cfg.common) return null;

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

    return project;
  }

  function updateHint(project) {
    var hint = document.getElementById('previewHint');
    if (hint) hint.textContent = project.name + ' — live preview';
  }

  function bootWidget(project) {
    if (!window.QualityAssistantWidget) return;

    widgetInstance = new window.QualityAssistantWidget({
      apiBase: window.QA_CONFIG.apiBase,
    });
    currentSitePreset = project.sitePreset;
    updateHint(project);

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
    }, 50);
  }

  function refreshWidget(project) {
    if (!widgetInstance) return;
    updateHint(project);

    if (typeof widgetInstance.refreshUiFromConfig === 'function') {
      widgetInstance.refreshUiFromConfig();
    } else {
      if (typeof widgetInstance.applyTheme === 'function') {
        widgetInstance.applyTheme();
      }
      if (typeof widgetInstance.applyLayout === 'function') {
        widgetInstance.applyLayout();
      }
      if (typeof widgetInstance.updateLauncherStripVisibility === 'function') {
        widgetInstance.updateLauncherStripVisibility();
      }
      if (typeof widgetInstance.applyFeatureToggles === 'function') {
        widgetInstance.applyFeatureToggles();
      }
    }

    if (!widgetInstance.isOpen && typeof widgetInstance.open === 'function') {
      widgetInstance.open();
    }
  }

  function applyPreview(payload) {
    if (!payload || !payload.project) return;
    var project = mergePreviewConfig(payload);
    if (!project) return;

    if (widgetInstance && currentSitePreset === project.sitePreset) {
      refreshWidget(project);
      return;
    }

    destroyWidget();
    bootWidget(project);
  }

  function schedulePreview(payload) {
    if (bootTimer) clearTimeout(bootTimer);
    bootTimer = setTimeout(function () {
      bootTimer = null;
      applyPreview(payload);
    }, 60);
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
