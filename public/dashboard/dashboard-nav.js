(function (global) {
  'use strict';

  var DEFAULT_BOT_ID = '10001';
  var BOTS = [
    { id: '10001', name: 'Receptionist' },
    { id: '10002', name: 'Green Valley' },
    { id: '10003', name: 'Lake View' },
  ];

  var BOT_PAGE_KEYS = [
    'uc-conversations',
    'queryanalytics',
    'uiux-setting',
    'supersetting',
  ];

  var BOT_PAGES = [
    { key: 'uc-conversations', label: 'User chatbot analytics' },
    { key: 'queryanalytics', label: 'Query analytics' },
    { key: 'uiux-setting', label: 'UI / UX settings' },
    { key: 'supersetting', label: 'Super settings' },
  ];

  var COMMON_PAGES = [
    { key: 'ua-conversations', label: 'User agent analytics' },
    { key: 'live-agent', label: 'Service desk' },
    { key: 'appointments', label: 'Appointments' },
    { key: 'live-agent/settings', label: 'Service desk settings' },
    { key: 'documents', label: 'Documents' },
    { key: 'manage-access', label: 'Manage access' },
  ];

  function normalizeBotId(id) {
    var s = String(id || '').trim();
    if (s === '001') return '10001';
    if (s === '002') return '10002';
    if (s === '003') return '10003';
    return s;
  }

  function getBid() {
    var pathMatch = location.pathname.match(/\/bot-settings\/(\d{5})\.html/);
    if (pathMatch) return pathMatch[1];
    pathMatch = location.pathname.match(/\/bid[=/](\d{5})\//);
    if (pathMatch) return pathMatch[1];
    var q = new URLSearchParams(location.search).get('bid');
    if (q && resolveBot(q)) return normalizeBotId(q);
    return DEFAULT_BOT_ID;
  }

  function resolveBot(botId) {
    var id = normalizeBotId(botId);
    return BOTS.find(function (b) {
      return b.id === id;
    });
  }

  function bidPath(botId, slug) {
    return '/bid=' + encodeURIComponent(normalizeBotId(botId)) + '/' + slug;
  }

  function commonPath(slug) {
    if (slug === 'live-agent/settings') return '/live-agent/settings';
    if (slug === 'appointments') return '/dashboard/appointments.html';
    if (slug === 'documents') return '/dashboard/documents.html';
    if (slug === 'manage-access') return '/dashboard/manage-access.html';
    if (slug === 'ua-conversations') return '/ua-conversations';
    if (slug === 'live-agent') return '/live-agent/';
    return '/dashboard/';
  }

  function navHref(key, botId) {
    botId = normalizeBotId(botId);
    if (key === 'home') return '/dashboard/?bid=' + botId;
    if (BOT_PAGE_KEYS.indexOf(key) >= 0) {
      return bidPath(botId, key);
    }
    var path = commonPath(key);
    if (key === 'ua-conversations' || key === 'live-agent' || key === 'live-agent/settings') {
      return path + '?bid=' + botId;
    }
    if (key === 'appointments' || key === 'documents' || key === 'manage-access') {
      return path + '?bid=' + botId;
    }
    return path;
  }

  function detectActiveKey() {
    var p = location.pathname;
    if (p.indexOf('/dashboard/manage-access') >= 0) return 'manage-access';
    if (p.indexOf('/dashboard/supersetting') >= 0) return 'supersetting';
    if (p.indexOf('/dashboard/query-analytics') >= 0) return 'queryanalytics';
    if (p.indexOf('/dashboard/documents') >= 0) return 'documents';
    if (p.indexOf('/dashboard/appointments') >= 0) return 'appointments';
    if (p.indexOf('/bot-settings/') >= 0) return 'uiux-setting';
    if (p.indexOf('/uc-conversations') >= 0) return 'uc-conversations';
    if (p.indexOf('/ua-conversations') >= 0) return 'ua-conversations';
    if (p.indexOf('/live-agent/settings') >= 0) return 'live-agent/settings';
    if (p.indexOf('/live-agent') >= 0) return 'live-agent';
    if (p === '/dashboard/' || p === '/dashboard' || p.indexOf('/dashboard/index') >= 0) {
      return 'home';
    }
    return '';
  }

  function isBotSpecificPage(active) {
    return BOT_PAGE_KEYS.indexOf(active) >= 0;
  }

  function onBotChange(botId) {
    botId = normalizeBotId(botId);
    var active = detectActiveKey();
    if (!active || active === 'home') {
      global.location.href = '/dashboard/?bid=' + encodeURIComponent(botId);
      return;
    }
    if (isBotSpecificPage(active)) {
      global.location.href = navHref(active, botId);
      return;
    }
    var url = new URL(global.location.href);
    url.searchParams.set('bid', botId);
    global.location.href = url.pathname + url.search + url.hash;
  }

  function renderNav(activeKey, botId) {
    botId = normalizeBotId(botId);
    var bot = resolveBot(botId) || BOTS[0];
    var botOptions = BOTS.map(function (b) {
      return (
        '<option value="' +
        b.id +
        '"' +
        (b.id === botId ? ' selected' : '') +
        '>' +
        b.name +
        ' (Bot ID ' +
        b.id +
        ')</option>'
      );
    }).join('');

    function link(key, label) {
      var href = navHref(key, botId);
      var cls = 'dash-nav-link' + (activeKey === key ? ' is-active' : '');
      return '<a class="' + cls + '" href="' + href + '">' + label + '</a>';
    }

    var botLinks = BOT_PAGES.map(function (p) {
      return link(p.key, p.label);
    }).join('');

    var commonLinks = COMMON_PAGES.map(function (p) {
      return link(p.key, p.label);
    }).join('');

    return (
      '<aside class="dash-sidebar" aria-label="Dashboard navigation">' +
      '<div class="dash-sidebar__brand">' +
      '<h1>QualityAssistant</h1>' +
      '<label class="dash-muted" style="display:block;font-size:0.72rem;margin-bottom:0.25rem">Switch project</label>' +
      '<select class="dash-bot-select" id="dash-bot-select" aria-label="Select bot project">' +
      botOptions +
      '</select>' +
      '</div>' +
      '<nav class="dash-nav-group">' +
      link('home', 'Dashboard home') +
      '</nav>' +
      '<nav class="dash-nav-group" aria-label="Bot-specific pages">' +
      '<h2>For ' +
      bot.name +
      '</h2>' +
      botLinks +
      '</nav>' +
      '<nav class="dash-nav-group" aria-label="Common pages">' +
      '<h2>Common</h2>' +
      commonLinks +
      '</nav>' +
      '</aside>'
    );
  }

  function linkAssets() {
    if (!document.querySelector('link[data-dash-nav-css]')) {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/dashboard/dashboard-nav.css';
      link.setAttribute('data-dash-nav-css', '1');
      document.head.appendChild(link);
    }
  }

  function findPageContent(selector) {
    if (selector) {
      var picked = document.querySelector(selector);
      if (picked) return picked;
    }
    var el = document.querySelector('.dash-page-content');
    if (el) return el;
    var selectors = [
      '.bot-settings-dash-content',
      '.dash-app',
      '.docs-app',
      '.appt-app',
      '.qa-app',
      '#la-dash-shell-root',
      '#la-settings-shell-root',
      'div.app',
    ];
    for (var i = 0; i < selectors.length; i++) {
      var node = document.querySelector(selectors[i]);
      if (node && !node.closest('.dash-shell')) return node;
    }
    return null;
  }

  function preparePageContent(selector) {
    var content = findPageContent(selector);
    if (!content) return null;
    content.classList.add('dash-page-content');
    if (!content.style.display) content.style.display = 'none';
    return content;
  }

  function bindBotSelect(shell) {
    var select = shell
      ? shell.querySelector('#dash-bot-select')
      : document.getElementById('dash-bot-select');
    if (!select || select.getAttribute('data-bound') === '1') return;
    select.setAttribute('data-bound', '1');
    select.addEventListener('change', function () {
      onBotChange(select.value);
    });
  }

  function mount(opts) {
    opts = opts || {};
    if (document.querySelector('.dash-shell')) {
      bindBotSelect(document.querySelector('.dash-shell'));
      return true;
    }

    var botId = opts.bid || getBid();
    var activeKey = opts.active || detectActiveKey();
    var title = opts.title || 'Dashboard';
    var subtitle = opts.subtitle || '';

    var content = preparePageContent(opts.contentSelector);
    if (!content) return false;

    var shell = document.createElement('div');
    shell.className = 'dash-shell';
    shell.innerHTML =
      renderNav(activeKey, botId) +
      '<div class="dash-main-wrap">' +
      '<header class="dash-topbar">' +
      '<h2>' +
      title +
      '</h2>' +
      (subtitle ? '<p>' + subtitle + '</p>' : '') +
      '</header>' +
      '<div class="dash-main" id="dash-main-slot"></div>' +
      '</div>';

    var slot = shell.querySelector('#dash-main-slot');
    slot.appendChild(content);
    content.style.display = '';

    document.body.classList.add('dash-has-shell');
    document.body.insertBefore(shell, document.body.firstChild);
    bindBotSelect(shell);
    return true;
  }

  function mountPage(opts) {
    linkAssets();
    return mount(opts || {});
  }

  function updateTopbar(title, subtitle) {
    var h2 = document.querySelector('.dash-topbar h2');
    var p = document.querySelector('.dash-topbar p');
    if (h2 && title) h2.textContent = title;
    if (p && subtitle !== undefined) p.textContent = subtitle;
  }

  global.DashboardNav = {
    getBid: getBid,
    bidPath: bidPath,
    navHref: navHref,
    mount: mount,
    mountPage: mountPage,
    updateTopbar: updateTopbar,
    onBotChange: onBotChange,
    detectActiveKey: detectActiveKey,
    BOTS: BOTS,
    normalizeBotId: normalizeBotId,
  };
})(typeof window !== 'undefined' ? window : this);
