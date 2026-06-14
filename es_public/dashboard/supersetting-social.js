(function () {
  'use strict';

  var auth = window.DashboardDeskAuth;
  var nav = window.DashboardNav;

  var CHANNELS = ['whatsapp', 'instagram', 'facebook'];
  var CHANNEL_ICONS = { whatsapp: 'WA', instagram: 'IG', facebook: 'FB' };

  var state = {
    botId: '',
    botName: '',
    summary: null,
    channels: {},
    openChannel: null,
    visibleVendor: {},
  };

  function apiBase() {
    return auth.apiBase();
  }

  function currentBotId() {
    return nav && typeof nav.getBid === 'function' ? String(nav.getBid() || '').trim() : '';
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

  function channelApi(botId, channel) {
    return (
      apiBase() +
      '/api/social-integration/' +
      encodeURIComponent(botId) +
      '/' +
      encodeURIComponent(channel)
    );
  }

  function setIntro() {
    var el = document.getElementById('superSocialBotLine');
    if (!el) return;
    el.textContent =
      (state.botName || 'Bot') +
      ' (ID ' +
      state.botId +
      ') — har channel ki alag config. Sirf is bot ke liye save hota hai.';
  }

  function badgeFor(channelId) {
    var ch = state.summary && state.summary.channels && state.summary.channels[channelId];
    if (!ch) return { text: 'Not set up', cls: 'social-channel__badge--off' };
    if (ch.enabled) return { text: 'Active', cls: 'social-channel__badge--on' };
    if (ch.configured) return { text: 'Draft', cls: 'social-channel__badge--draft' };
    return { text: 'Not set up', cls: 'social-channel__badge--off' };
  }

  function renderChannelList() {
    var root = document.getElementById('superSocialChannels');
    if (!root) return;

    root.innerHTML = CHANNELS.map(function (channelId) {
      var meta =
        (state.summary && state.summary.channels && state.summary.channels[channelId]) || {};
      var badge = badgeFor(channelId);
      var isOpen = state.openChannel === channelId;
      var accent = meta.accent || '#64748b';
      var label = meta.label || channelId;
      var tagline =
        channelId === 'whatsapp'
          ? 'WATI, Gupshup, Meta & more'
          : channelId === 'instagram'
            ? 'Instagram DM'
            : 'Facebook Page Messenger';

      return (
        '<article class="social-channel' +
        (isOpen ? ' is-open' : '') +
        '" data-channel="' +
        esc(channelId) +
        '">' +
        '<button type="button" class="social-channel__head" data-channel-toggle="' +
        esc(channelId) +
        '" aria-expanded="' +
        (isOpen ? 'true' : 'false') +
        '">' +
        '<span class="social-channel__icon" style="background:' +
        escAttr(accent) +
        '">' +
        esc(CHANNEL_ICONS[channelId] || '?') +
        '</span>' +
        '<span class="social-channel__meta">' +
        '<p class="social-channel__title">' +
        esc(label) +
        '</p>' +
        '<p class="social-channel__tag">' +
        esc(tagline) +
        ' · session <code>' +
        esc(meta.sessionPrefix || '') +
        '</code></p>' +
        '</span>' +
        '<span class="social-channel__badge ' +
        badge.cls +
        '">' +
        esc(badge.text) +
        '</span>' +
        '<span class="social-channel__chev" aria-hidden="true">▼</span>' +
        '</button>' +
        '<div class="social-channel__body" id="socialBody-' +
        esc(channelId) +
        '">' +
        '<div class="social-channel__placeholder">Loading…</div>' +
        '</div>' +
        '</article>'
      );
    }).join('');

    root.querySelectorAll('[data-channel-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var ch = btn.getAttribute('data-channel-toggle');
        toggleChannel(ch);
      });
    });

    if (state.openChannel) {
      loadChannelPanel(state.openChannel);
    }
  }

  function toggleChannel(channelId) {
    if (state.openChannel === channelId) {
      state.openChannel = null;
      renderChannelList();
      return;
    }
    state.openChannel = channelId;
    renderChannelList();
  }

  function providerOptions(schema, active) {
    return (schema.providerIds || [])
      .map(function (id) {
        var p = schema.providers[id];
        return (
          '<option value="' +
          esc(id) +
          '"' +
          (id === active ? ' selected' : '') +
          '>' +
          esc(p ? p.label : id) +
          '</option>'
        );
      })
      .join('');
  }

  function renderVendorTabs(channelId, schema, cfg) {
    var visible = state.visibleVendor[channelId] || cfg.activeProvider || 'meta';
    var active = cfg.activeProvider || 'meta';
    var tabs = (schema.providerIds || [])
      .map(function (id) {
        var p = schema.providers[id];
        var cls = 'social-vendor-tab';
        if (id === visible) cls += ' is-active';
        if (id === active) cls += ' is-provider';
        return (
          '<button type="button" class="' +
          cls +
          '" data-vendor-tab="' +
          esc(id) +
          '">' +
          esc(p ? p.label : id) +
          '</button>'
        );
      })
      .join('');

    var panels = (schema.providerIds || [])
      .map(function (id) {
        return renderVendorPanel(channelId, id, schema.providers[id], cfg, id === visible);
      })
      .join('');

    return (
      '<div class="social-section-label">Vendor credentials</div>' +
      '<div class="social-vendor-tabs" data-channel-vendors="' +
      esc(channelId) +
      '">' +
      tabs +
      '</div>' +
      '<div data-channel-panels="' +
      esc(channelId) +
      '">' +
      panels +
      '</div>'
    );
  }

  function renderVendorPanel(channelId, providerId, prov, cfg, visible) {
    var values = (cfg.providers && cfg.providers[providerId]) || {};
    var fields = (prov.fields || [])
      .map(function (field) {
        var type = field.secret ? 'password' : 'text';
        return (
          '<label>' +
          esc(field.label) +
          '<input type="' +
          type +
          '" data-ch="' +
          esc(channelId) +
          '" data-prov="' +
          esc(providerId) +
          '" data-field="' +
          esc(field.key) +
          '" value="' +
          escAttr(values[field.key] || '') +
          '" placeholder="' +
          escAttr(field.placeholder || '') +
          '" autocomplete="off" />' +
          (field.hint ? '<small>' + esc(field.hint) + '</small>' : '') +
          (field.env
            ? '<span class="social-env-hint">Env: <code>' + esc(field.env) + '</code></span>'
            : '') +
          '</label>'
        );
      })
      .join('');

    var webhook =
      state.channels[channelId] && state.channels[channelId].webhookUrl
        ? state.channels[channelId].webhookUrl
        : '—';

    return (
      '<div class="social-vendor-panel' +
      (visible ? ' is-visible' : '') +
      '" data-vendor-panel="' +
      esc(providerId) +
      '">' +
      '<p class="dash-muted" style="margin:0;font-size:0.75rem">Webhook: <code>' +
      esc(webhook) +
      '</code></p>' +
      fields +
      '<label>Notes<textarea data-ch="' +
      esc(channelId) +
      '" data-prov="' +
      esc(providerId) +
      '" data-field="notes" placeholder="Setup notes">' +
      esc(values.notes || '') +
      '</textarea></label>' +
      (prov.docsUrl
        ? '<p style="margin:0;font-size:0.75rem"><a href="' +
          escAttr(prov.docsUrl) +
          '" target="_blank" rel="noopener">Open vendor docs</a></p>'
        : '') +
      '</div>'
    );
  }

  function renderBotFields(channelId, schema, cfg) {
    var bot = cfg.bot || {};
    return (
      '<div class="social-section-label">Bot routing</div>' +
      '<div class="social-bot-grid">' +
      (schema.botFields || [])
        .map(function (field) {
          return (
            '<label>' +
            esc(field.label) +
            '<input type="text" data-ch="' +
            esc(channelId) +
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
        .join('') +
      '</div>'
    );
  }

  function renderChannelForm(channelId, payload) {
    var schema = payload.schema;
    var cfg = payload.config;
    var configured = !!payload.configured;
    var webhook = payload.webhookUrl || '—';

    if (!configured) {
      return (
        '<div class="social-channel__empty">' +
        '<p>' +
        esc(payload.channelMeta.label) +
        ' is bot ke liye configure nahi hai. Neeche setup shuru karo.</p>' +
        '<button type="button" class="dash-btn dash-btn--primary" data-setup-channel="' +
        esc(channelId) +
        '">Set up ' +
        esc(payload.channelMeta.label) +
        '</button>' +
        '</div>' +
        '<form class="social-form" id="socialForm-' +
        esc(channelId) +
        '" hidden data-channel-form="' +
        esc(channelId) +
        '">' +
        buildFormInner(channelId, schema, cfg, webhook) +
        '</form>'
      );
    }

    return (
      '<form class="social-form" id="socialForm-' +
      esc(channelId) +
      '" data-channel-form="' +
      esc(channelId) +
      '">' +
      buildFormInner(channelId, schema, cfg, webhook) +
      '</form>'
    );
  }

  function buildFormInner(channelId, schema, cfg, webhook) {
    state.visibleVendor[channelId] =
      state.visibleVendor[channelId] || cfg.activeProvider || 'meta';

    return (
      '<div class="social-form__row">' +
      '<label class="social-form__toggle">' +
      '<input type="checkbox" data-ch="' +
      esc(channelId) +
      '" data-enabled-toggle' +
      (cfg.enabled ? ' checked' : '') +
      ' />' +
      '<span>Channel enabled</span>' +
      '</label>' +
      '</div>' +
      '<label>Active provider<select data-ch="' +
      esc(channelId) +
      '" data-active-provider>' +
      providerOptions(schema, cfg.activeProvider) +
      '</select><small>Outbound + webhook vendor for this bot.</small></label>' +
      '<div class="social-webhook"><strong>Webhook URL</strong><br /><code>' +
      esc(webhook) +
      '</code><br /><small>Vendor dashboard mein paste karo. <code>bid</code> + <code>channel</code> query params routing ke liye.</small></div>' +
      renderVendorTabs(channelId, schema, cfg) +
      renderBotFields(channelId, schema, cfg) +
      '<div class="social-form__row">' +
      '<button type="submit" class="dash-btn dash-btn--primary">Save ' +
      esc(schema.label || channelId) +
      '</button>' +
      '<p class="social-form-status" id="socialStatus-' +
      esc(channelId) +
      '" hidden></p>' +
      '</div>'
    );
  }

  function bindChannelPanel(channelId) {
    var body = document.getElementById('socialBody-' + channelId);
    if (!body) return;

    var setupBtn = body.querySelector('[data-setup-channel]');
    if (setupBtn) {
      setupBtn.addEventListener('click', function () {
        var form = body.querySelector('[data-channel-form]');
        if (form) {
          form.hidden = false;
          setupBtn.closest('.social-channel__empty').style.display = 'none';
          var toggle = form.querySelector('[data-enabled-toggle]');
          if (toggle) toggle.checked = true;
        }
      });
    }

    body.querySelectorAll('[data-vendor-tab]').forEach(function (tab) {
      tab.addEventListener('click', function () {
        state.visibleVendor[channelId] = tab.getAttribute('data-vendor-tab');
        var payload = state.channels[channelId];
        if (payload) {
          body.innerHTML = renderChannelForm(channelId, payload);
          bindChannelPanel(channelId);
        }
      });
    });

    var activeSelect = body.querySelector('[data-active-provider]');
    if (activeSelect) {
      activeSelect.addEventListener('change', function () {
        state.visibleVendor[channelId] = activeSelect.value;
        refreshWebhookInPanel(channelId);
      });
    }

    var form = body.querySelector('[data-channel-form]');
    if (form) {
      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        saveChannel(channelId);
      });
    }
  }

  function refreshWebhookInPanel(channelId) {
    var payload = state.channels[channelId];
    if (!payload || !payload.schema) return;
    var active =
      (document.querySelector('[data-ch="' + channelId + '"][data-active-provider]') || {})
        .value || payload.config.activeProvider;
    var prov = payload.schema.providers[active];
    var path = (prov && prov.webhookPath) || '/webhooks/meta';
    var base = String(payload.publicBaseUrl || window.location.origin).replace(/\/$/, '');
    var url =
      base +
      path +
      '?bid=' +
      encodeURIComponent(state.botId) +
      '&channel=' +
      encodeURIComponent(channelId);
    var code = document.querySelector('#socialBody-' + channelId + ' .social-webhook code');
    if (code) code.textContent = url;
  }

  function collectChannelPayload(channelId) {
    var providers = {};
    var schema = state.channels[channelId] && state.channels[channelId].schema;
    if (!schema) return null;

    (schema.providerIds || []).forEach(function (provId) {
      var row = {};
      document
        .querySelectorAll(
          '[data-ch="' + channelId + '"][data-prov="' + provId + '"][data-field]'
        )
        .forEach(function (el) {
          row[el.getAttribute('data-field')] = el.value;
        });
      providers[provId] = row;
    });

    var bot = { botId: state.botId };
    document
      .querySelectorAll('[data-ch="' + channelId + '"][data-bot-field]')
      .forEach(function (el) {
        bot[el.getAttribute('data-bot-field')] = el.value;
      });

    var enabledEl = document.querySelector('[data-ch="' + channelId + '"][data-enabled-toggle]');
    var activeEl = document.querySelector('[data-ch="' + channelId + '"][data-active-provider]');

    return {
      enabled: !!(enabledEl && enabledEl.checked),
      activeProvider: activeEl ? activeEl.value : 'meta',
      providers: providers,
      bot: bot,
    };
  }

  function setChannelStatus(channelId, msg, isError) {
    var el = document.getElementById('socialStatus-' + channelId);
    if (!el) return;
    el.textContent = msg || '';
    el.className =
      'social-form-status' + (isError ? ' social-form-status--error' : ' social-form-status--ok');
    el.hidden = !msg;
  }

  function saveChannel(channelId) {
    setChannelStatus(channelId, 'Saving…', false);
    return fetch(channelApi(state.botId, channelId), {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: Object.assign({ 'Content-Type': 'application/json' }, auth.authHeaders()),
      body: JSON.stringify(collectChannelPayload(channelId)),
    })
      .then(function (res) {
        return res.json().then(function (body) {
          return { ok: res.ok, status: res.status, body: body };
        });
      })
      .then(function (result) {
        if (result.status === 401) {
          throw new Error('Not signed in — enter desk token first.');
        }
        if (!result.ok || !result.body.ok) {
          throw new Error((result.body && result.body.error) || 'Save failed');
        }
        state.channels[channelId] = result.body;
        setChannelStatus(channelId, 'Saved for Bot ' + state.botId + '.', false);
        return loadSummary().then(function () {
          var body = document.getElementById('socialBody-' + channelId);
          if (body) {
            body.innerHTML = renderChannelForm(channelId, result.body);
            bindChannelPanel(channelId);
          }
          renderChannelList();
        });
      })
      .catch(function (err) {
        setChannelStatus(channelId, err.message || 'Request failed', true);
      });
  }

  function loadChannelPanel(channelId) {
    var body = document.getElementById('socialBody-' + channelId);
    if (!body) return Promise.resolve();

    if (state.channels[channelId]) {
      body.innerHTML = renderChannelForm(channelId, state.channels[channelId]);
      bindChannelPanel(channelId);
      return Promise.resolve();
    }

    return fetch(channelApi(state.botId, channelId), {
      credentials: 'same-origin',
      headers: auth.authHeaders(),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, body: data };
        });
      })
      .then(function (result) {
        if (!result.ok || !result.body.ok) {
          throw new Error((result.body && result.body.error) || 'Load failed');
        }
        state.channels[channelId] = result.body;
        body.innerHTML = renderChannelForm(channelId, result.body);
        bindChannelPanel(channelId);
      })
      .catch(function (err) {
        body.innerHTML =
          '<p class="dash-muted" style="padding-top:1rem">' + esc(err.message) + '</p>';
      });
  }

  function loadSummary() {
    var botId = currentBotId();
    if (!botId) return Promise.resolve();

    state.botId = botId;
    state.channels = {};

    return fetch(apiBase() + '/api/social-integration/' + encodeURIComponent(botId), {
      credentials: 'same-origin',
      headers: auth.authHeaders(),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, body: data };
        });
      })
      .then(function (result) {
        if (!result.ok || !result.body.ok) {
          throw new Error((result.body && result.body.error) || 'Could not load');
        }
        state.summary = result.body;
        state.botName = result.body.botName || botId;
        setIntro();
        renderChannelList();
      });
  }

  function init() {
    loadSummary().catch(function (err) {
      var el = document.getElementById('superSocialBotLine');
      if (el) el.textContent = err.message || 'Could not load social integrations.';
    });
  }

  if (nav && typeof nav.whenReady === 'function') {
    nav.whenReady(init);
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
