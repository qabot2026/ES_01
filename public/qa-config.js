/**
 * @deprecated Use public/company.config.js — kept for old script tags.
 * Loads company.config if present; otherwise minimal production defaults.
 */
(function () {
  if (window.QA_CHAT_UI_CONFIG) return;
  window.QA_CHAT_UI_CONFIG = {
    common: {
      deploy: {
        publicBaseUrl: 'https://es-based-chatbot-production.up.railway.app',
        embedScript:
          'https://es-based-chatbot-production.up.railway.app/embed.js',
      },
      header: { title: 'QualityAssistant', subtitle: 'Your quality & compliance guide' },
    },
  };
  window.QA_CONFIG = {
    apiBase: window.QA_CHAT_UI_CONFIG.common.deploy.publicBaseUrl,
    embedScript: window.QA_CHAT_UI_CONFIG.common.deploy.embedScript,
  };
})();
