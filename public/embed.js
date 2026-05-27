(function () {
  'use strict';

  var script = document.currentScript;
  var base =
    (typeof window !== 'undefined' &&
      window.QA_CONFIG &&
      window.QA_CONFIG.apiBase) ||
    '';
  if (script && script.src) {
    base = script.src.replace(/\/embed\.js(\?.*)?$/i, '');
  }
  if (!base && typeof window !== 'undefined' && window.QA_CONFIG) {
    base = window.QA_CONFIG.apiBase;
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
    if (document.querySelector('script[data-qa-widget-js]')) {
      if (cb) cb();
      return;
    }
    var s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.setAttribute('data-qa-widget-js', 'true');
    s.onload = cb || null;
    document.head.appendChild(s);
  }

  function boot() {
    if (window.__qaWidgetLoaded) return;
    window.__qaWidgetLoaded = true;
    loadCss(base + '/widget/chat-widget.css');
    loadJs(base + '/widget/chat-widget.js', function () {
      if (window.QualityAssistantWidget) {
        new window.QualityAssistantWidget({ apiBase: base });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
