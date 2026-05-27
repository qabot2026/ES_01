(function () {
  'use strict';

  var script = document.currentScript;
  var base = '';
  if (script && script.src) {
    base = script.src.replace(/\/embed\.js(\?.*)?$/i, '');
  }
  if (!base && window.QA_CONFIG && window.QA_CONFIG.apiBase) {
    base = window.QA_CONFIG.apiBase;
  }
  if (!base && window.QA_CHAT_UI_CONFIG && window.QA_CHAT_UI_CONFIG.common) {
    base = window.QA_CHAT_UI_CONFIG.common.deploy.publicBaseUrl;
  }

  function loadCss(href) {
    if (document.querySelector('link[data-qa-widget-css]')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute('data-qa-widget-css', 'true');
    document.head.appendChild(link);
  }

  function loadJs(src, cb) {
    if (document.querySelector('script[src="' + src + '"]')) {
      if (cb) cb();
      return;
    }
    var s = document.createElement('script');
    s.src = src;
    s.async = false;
    s.onload = cb || null;
    document.head.appendChild(s);
  }

  function boot() {
    if (window.__qaWidgetLoaded) return;
    loadJs(base + '/company.config.js', function () {
      loadCss(base + '/widget/chat-widget.css');
      loadJs(base + '/widget/chat-widget.js', function () {
        if (window.QualityAssistantWidget) {
          window.__qaWidgetLoaded = true;
          new window.QualityAssistantWidget({
            apiBase:
              (window.QA_CONFIG && window.QA_CONFIG.apiBase) || base,
          });
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
