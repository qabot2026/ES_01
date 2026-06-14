(function () {
  'use strict';

  var auth = window.DashboardDeskAuth;
  var nav = window.DashboardNav;

  var waState = {
    schema: null,
    config: null,
    publicBaseUrl: '',
    visibleVendor: 'meta',
  };

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

  function setWaStatus(msg, isError) {
    var el = document.getElementById('superWaStatus');
    if (!el) return;
    el.textContent = msg || '';
    el.className =
      'super-form-status' + (isError ? ' super-form-status--error' : ' super-form-status--ok');
    el.hidden = !msg;
  }

  function providerSchema(id) {
    return waState.schema && waState.schema.providers
      ? waState.schema.providers[id]
      : null;
  }

  function buildWebhookUrl(providerId) {
    var schema = providerSchema(providerId);
    var path = schema && schema.webhookPath ? schema.webhookPath : '/webhooks/meta';
    var base = String(waState.publicBaseUrl || window.location.origin || '').replace(/\/$/, '');
    return base ? base + path : path;
  }

  function updateWebhookDisplay() {
    var activeEl = document.getElementById('superWaActiveProvider');
    var box = document.getElementById('superWaWebhookBox');
    var urlEl = document.getElementById('superWaWebhookUrl');
    var pathEl = document.getElementById('superWaWebhookPath');
    if (!activeEl || !box || !urlEl) return;

    var providerId = activeEl.value || 'meta';
    var schema = providerSchema(providerId);
    var url = buildWebhookUrl(providerId);

    urlEl.textContent = url;
    if (pathEl) {
      pathEl.innerHTML =
        'Path: <code>' +
        esc(schema && schema.webhookPath ? schema.webhookPath : '') +
        '</code>' +
        (schema && schema.docsUrl
          ? ' · <a href="' +
            escAttr(schema.docsUrl) +
            '" target="_blank" rel="noopener">Vendor docs</a>'
          : '');
    }
    box.hidden = false;
  }

  function renderVendorTabs() {
    var tabsEl = document.getElementById('superWaVendorTabs');
    var panelsEl = document.getElementById('superWaVendorPanels');
    if (!tabsEl || !panelsEl || !waState.schema) return;

    var ids = waState.schema.providerIds || [];
    var activeProvider =
      (document.getElementById('superWaActiveProvider') || {}).value ||
      (waState.config && waState.config.activeProvider) ||
      'meta';

    tabsEl.innerHTML = ids
      .map(function (id) {
        var schema = providerSchema(id);
        var label = schema ? schema.label : id;
        var classes = 'super-wa-tab';
        if (id === waState.visibleVendor) classes += ' is-active';
        if (id === activeProvider) classes += ' is-active-provider';
        return (
          '<button type="button" class="' +
          classes +
          '" data-vendor="' +
          esc(id) +
          '" role="tab" aria-selected="' +
          (id === waState.visibleVendor ? 'true' : 'false') +
          '">' +
          esc(label) +
          '</button>'
        );
      })
      .join('');

    panelsEl.innerHTML = ids
      .map(function (id) {
        return renderVendorPanel(id, id === waState.visibleVendor);
      })
      .join('');

    tabsEl.querySelectorAll('.super-wa-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        waState.visibleVendor = btn.getAttribute('data-vendor') || 'meta';
        renderVendorTabs();
      });
    });
  }

  function renderVendorPanel(id, visible) {
    var schema = providerSchema(id);
    if (!schema) return '';
    var values =
      (waState.config &&
        waState.config.providers &&
        waState.config.providers[id]) ||
      {};

    var fieldsHtml = (schema.fields || [])
      .map(function (field) {
        var inputType = field.secret ? 'password' : 'text';
        var envHint = field.env
          ? '<div class="super-wa-env">Railway env: <code>' + esc(field.env) + '</code></div>'
          : '';
        return (
          '<label>' +
          esc(field.label) +
          '<input type="' +
          inputType +
          '" name="provider-' +
          esc(id) +
          '-' +
          esc(field.key) +
          '" data-provider="' +
          esc(id) +
          '" data-field="' +
          esc(field.key) +
          '" value="' +
          escAttr(values[field.key] || '') +
          '" placeholder="' +
          escAttr(field.placeholder || '') +
          '" autocomplete="off" />' +
          (field.hint ? '<small>' + esc(field.hint) + '</small>' : '') +
          envHint +
          '</label>'
        );
      })
      .join('');

    return (
      '<div class="super-wa-panel' +
      (visible ? ' is-visible' : '') +
      '" id="superWaPanel-' +
      esc(id) +
      '" role="tabpanel" data-vendor="' +
      esc(id) +
      '">' +
      '<h4>' +
      esc(schema.label) +
      '</h4>' +
      '<p class="dash-muted">Webhook: <code>' +
      esc(buildWebhookUrl(id)) +
      '</code></p>' +
      '<div class="super-form">' +
      fieldsHtml +
      '<label>Notes<textarea name="provider-' +
      esc(id) +
      '-notes" data-provider="' +
      esc(id) +
      '" data-field="notes" placeholder="Internal notes for this vendor">' +
      esc(values.notes || '') +
      '</textarea><small>Client-specific setup notes (not sent to vendor).</small></label>' +
      '</div></div>'
    );
  }

  function renderBotFields() {
    var el = document.getElementById('superWaBotFields');
    if (!el || !waState.schema) return;
    var bot = (waState.config && waState.config.bot) || {};
    el.innerHTML = (waState.schema.botFields || [])
      .map(function (field) {
        return (
          '<label>' +
          esc(field.label) +
          '<input type="text" name="bot-' +
          esc(field.key) +
          '" data-bot-field="' +
          esc(field.key) +
          '" value="' +
          escAttr(bot[field.key] != null ? String(bot[field.key]) : '') +
          '" placeholder="' +
          escAttr(field.placeholder || '') +
          '" />' +
          (field.hint ? '<small>' + esc(field.hint) + '</small>' : '') +
          '</label>'
        );
      })
      .join('');
  }

  function collectFormPayload() {
    var enabledEl = document.getElementById('superWaEnabled');
    var activeEl = document.getElementById('superWaActiveProvider');
    var providers = {};
    var ids = (waState.schema && waState.schema.providerIds) || [];

    ids.forEach(function (id) {
      var row = {};
      document
        .querySelectorAll('[data-provider="' + id + '"][data-field]')
        .forEach(function (input) {
          row[input.getAttribute('data-field')] = input.value;
        });
      providers[id] = row;
    });

    var bot = {};
    document.querySelectorAll('[data-bot-field]').forEach(function (input) {
      bot[input.getAttribute('data-bot-field')] = input.value;
    });

    return {
      enabled: !!(enabledEl && enabledEl.checked),
      activeProvider: activeEl ? activeEl.value : 'meta',
      providers: providers,
      bot: bot,
    };
  }

  function applyConfigToForm() {
    var cfg = waState.config || {};
    var enabledEl = document.getElementById('superWaEnabled');
    var activeEl = document.getElementById('superWaActiveProvider');

    if (enabledEl) enabledEl.checked = !!cfg.enabled;
    if (activeEl) activeEl.value = cfg.activeProvider || 'meta';
    waState.visibleVendor = cfg.activeProvider || 'meta';

    renderVendorTabs();
    renderBotFields();
    updateWebhookDisplay();
  }

  function loadWhatsappIntegration() {
    return fetch(apiBase() + '/api/whatsapp-integration', {
      credentials: 'same-origin',
      headers: auth.authHeaders(),
    })
      .then(function (res) {
        return res.json().then(function (body) {
          return { ok: res.ok, status: res.status, body: body };
        });
      })
      .then(function (result) {
        if (result.status === 401) {
          throw new Error(
            'Not signed in — open Live chat inbox or Insights and enter your desk token first.'
          );
        }
        if (!result.ok || !result.body.ok) {
          throw new Error(
            (result.body && result.body.error) || 'Could not load WhatsApp settings'
          );
        }
        waState.schema = result.body.schema;
        waState.config = result.body.config;
        waState.publicBaseUrl = result.body.publicBaseUrl || window.location.origin;
        applyConfigToForm();
      })
      .catch(function (err) {
        setWaStatus(err.message || 'Could not load WhatsApp settings', true);
      });
  }

  function saveWhatsappIntegration(ev) {
    if (ev) ev.preventDefault();
    var saveBtn = document.getElementById('superWaSaveBtn');
    if (saveBtn) saveBtn.disabled = true;
    setWaStatus('Saving…', false);

    return fetch(apiBase() + '/api/whatsapp-integration', {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: Object.assign({ 'Content-Type': 'application/json' }, auth.authHeaders()),
      body: JSON.stringify(collectFormPayload()),
    })
      .then(function (res) {
        return res.json().then(function (body) {
          return { ok: res.ok, status: res.status, body: body };
        });
      })
      .then(function (result) {
        if (result.status === 401) {
          throw new Error(
            'Not signed in — open Live chat inbox or Insights and enter your desk token first.'
          );
        }
        if (!result.ok || !result.body.ok) {
          throw new Error(
            (result.body && result.body.error) || 'Could not save WhatsApp settings'
          );
        }
        waState.config = result.body.config;
        waState.publicBaseUrl = result.body.publicBaseUrl || waState.publicBaseUrl;
        var provider =
          providerSchema(result.body.config.activeProvider) ||
          providerSchema('meta');
        setWaStatus(
          'Saved — active provider: ' + (provider ? provider.label : 'Meta') + '.',
          false
        );
        renderVendorTabs();
        updateWebhookDisplay();
      })
      .catch(function (err) {
        setWaStatus(err.message || 'Request failed', true);
      })
      .finally(function () {
        if (saveBtn) saveBtn.disabled = false;
      });
  }

  function bindWhatsappForm() {
    var form = document.getElementById('superWhatsappForm');
    var activeEl = document.getElementById('superWaActiveProvider');
    if (form) form.addEventListener('submit', saveWhatsappIntegration);
    if (activeEl) {
      activeEl.addEventListener('change', function () {
        updateWebhookDisplay();
        renderVendorTabs();
      });
    }
  }

  function init() {
    bindWhatsappForm();
    loadWhatsappIntegration();
  }

  if (nav && typeof nav.whenReady === 'function') {
    nav.whenReady(init);
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
