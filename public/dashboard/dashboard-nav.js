(function (global) {
  'use strict';

  var NAV_ASSET_V = '20260611b';

  function ensureBoot() {
    var root = document.documentElement;
    if (root.getAttribute('data-dash-boot') === '1') return;
    root.setAttribute('data-dash-boot', '1');
    root.classList.add('dash-mount-pending');

    if (!document.getElementById('dash-critical-css')) {
      var crit = document.createElement('style');
      crit.id = 'dash-critical-css';
      crit.textContent =
        'html.dash-mount-pending,html.dash-mount-pending body{overflow:hidden!important}' +
        'html.dash-mount-pending .dash-page-content,html.dash-mount-pending #app[data-dash-pre-mount]{visibility:hidden!important;opacity:0!important}' +
        '.dash-nav-ic,svg.dash-nav-ic{width:18px!important;height:18px!important;max-width:18px!important;max-height:18px!important}' +
        '.dash-icon-badge svg{width:18px!important;height:18px!important;max-width:18px!important;max-height:18px!important}' +
        '#dash-shell-loader{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:#f1f5f9}' +
        'html.dash-ready #dash-shell-loader{display:none!important}';
      document.head.appendChild(crit);
    }

    function insertLoader() {
      if (document.getElementById('dash-shell-loader')) return;
      var loader = document.createElement('div');
      loader.id = 'dash-shell-loader';
      loader.className = 'dash-shell-loader';
      loader.setAttribute('role', 'status');
      loader.setAttribute('aria-live', 'polite');
      loader.setAttribute('aria-label', 'Loading');
      loader.innerHTML =
        '<div class="dash-loader"><div class="dash-loader__spinner" aria-hidden="true"></div><span>Loading</span></div>';
      (document.body || document.documentElement).appendChild(loader);
    }

    if (document.body) insertLoader();
    else document.addEventListener('DOMContentLoaded', insertLoader);
  }

  ensureBoot();
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

  /** Sidebar order: home → AI chatbot → live agent → admin */
  var NAV_SECTIONS = [
    {
      items: [{ key: 'home', label: 'Home', icon: 'home' }],
    },
    {
      items: [
        { key: 'uc-conversations', label: 'Chatbot conversations', icon: 'chart' },
        { key: 'queryanalytics', label: 'Customer questions', icon: 'search' },
        { key: 'appointments', label: 'Appointments', icon: 'calendar' },
        { key: 'documents', label: 'Customer uploads', icon: 'file' },
        { key: 'uiux-setting', label: 'Chatbot appearance', icon: 'palette' },
        { key: 'supersetting', label: 'Advanced configuration', icon: 'shield' },
      ],
    },
    {
      items: [
        { key: 'live-agent', label: 'Live chat inbox', icon: 'headset' },
        { key: 'ua-conversations', label: 'Agent conversations', icon: 'users' },
        { key: 'live-agent/settings', label: 'Live chat setup', icon: 'cog' },
      ],
    },
    {
      items: [{ key: 'manage-access', label: 'Access permissions', icon: 'lock' }],
    },
  ];

  var ICONS = {
    home:
      '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    chart:
      '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z"/><path d="M8 12h.01M12 12h.01M16 12h.01"/>',
    search:
      '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
    palette:
      '<path d="M12 22a1 1 0 0 1-1-1v-2.05a4 4 0 0 1-2.144-1.88"/><path d="M12 3v2.05a4 4 0 0 1 2.144 1.88"/><path d="M3 12h2.05a4 4 0 0 1 1.88 2.144"/><path d="M21 12h-2.05a4 4 0 0 1-1.88-2.144"/><circle cx="12" cy="12" r="2.5"/>',
    shield:
      '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    users:
      '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    headset:
      '<path d="M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H3z"/><path d="M21 11h-3a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h3z"/><path d="M4 11V9a8 8 0 0 1 16 0v2"/>',
    calendar:
      '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
    cog:
      '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    file:
      '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 13h4"/><path d="M10 17h7"/>',
    lock:
      '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/>',
  };

  function getIconForKey(key) {
    var i;
    var j;
    for (i = 0; i < NAV_SECTIONS.length; i++) {
      for (j = 0; j < NAV_SECTIONS[i].items.length; j++) {
        if (NAV_SECTIONS[i].items[j].key === key) {
          return NAV_SECTIONS[i].items[j].icon;
        }
      }
    }
    return 'home';
  }

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

  function navIcon(name) {
    var paths = ICONS[name] || ICONS.home;
    return (
      '<svg class="dash-nav-ic" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      paths +
      '</svg>'
    );
  }

  function iconBadge(name, extraClass) {
    return (
      '<span class="dash-icon-badge dash-icon-badge--' +
      name +
      (extraClass ? ' ' + extraClass : '') +
      '">' +
      navIcon(name) +
      '</span>'
    );
  }

  function botSelectHtml(botId) {
    botId = normalizeBotId(botId);
    return BOTS.map(function (b) {
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
  }

  function renderNav(activeKey, botId) {
    botId = normalizeBotId(botId);

    function navRow(key, label, iconName) {
      var href = navHref(key, botId);
      var cls = 'dash-nav-row' + (activeKey === key ? ' is-active' : '');
      return (
        '<a class="' +
        cls +
        '" href="' +
        href +
        '" title="' +
        label +
        '" aria-label="' +
        label +
        '">' +
        '<span class="dash-nav-row__icon">' +
        iconBadge(iconName) +
        '</span>' +
        '<span class="dash-nav-row__label">' +
        label +
        '</span></a>'
      );
    }

    var navHtml = '';
    NAV_SECTIONS.forEach(function (section, index) {
      if (index > 0) {
        navHtml += '<div class="dash-nav-sep" aria-hidden="true"></div>';
      }
      section.items.forEach(function (item) {
        navHtml += navRow(item.key, item.label, item.icon);
      });
    });

    return (
      '<aside class="dash-sidebar" aria-label="Dashboard navigation">' +
      '<div class="dash-sidebar__inner">' +
      '<nav class="dash-nav-list" aria-label="Main navigation">' +
      navHtml +
      '</nav>' +
      '</div>' +
      '</aside>'
    );
  }

  function renderTopbar(title, subtitle, botId) {
    return (
      '<header class="dash-topbar">' +
      '<div class="dash-topbar__lead">' +
      '<h2>' +
      title +
      '</h2>' +
      (subtitle ? '<p>' + subtitle + '</p>' : '') +
      '</div>' +
      '<div class="dash-topbar__tools">' +
      '<label class="dash-topbar__bot-label" for="dash-bot-select">Project</label>' +
      '<select class="dash-bot-select" id="dash-bot-select" aria-label="Select bot project">' +
      botSelectHtml(botId) +
      '</select>' +
      '</div>' +
      '</header>'
    );
  }

  function linkAssets() {
    if (!document.querySelector('link[data-dash-font]')) {
      var font = document.createElement('link');
      font.rel = 'stylesheet';
      font.href =
        'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap';
      font.setAttribute('data-dash-font', '1');
      document.head.appendChild(font);
    }
    if (!document.querySelector('link[data-dash-nav-css]')) {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/dashboard/dashboard-nav.css?v=' + NAV_ASSET_V;
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

  function bindSidebarExpand(shell) {
    var sidebar = shell ? shell.querySelector('.dash-sidebar') : document.querySelector('.dash-sidebar');
    if (!sidebar || sidebar.getAttribute('data-expand-bound') === '1') return;
    sidebar.setAttribute('data-expand-bound', '1');

    function setOpen(open) {
      sidebar.classList.toggle('is-expanded', open);
    }

    sidebar.addEventListener('mouseenter', function () {
      setOpen(true);
    });
    sidebar.addEventListener('mouseleave', function () {
      setOpen(false);
    });
    sidebar.addEventListener('focusin', function () {
      setOpen(true);
    });
    sidebar.addEventListener('focusout', function (ev) {
      if (!sidebar.contains(ev.relatedTarget)) setOpen(false);
    });
  }

  function finishMount() {
    var root = document.documentElement;
    root.classList.remove('dash-mount-pending');
    root.classList.add('dash-ready');
    var app = document.getElementById('app');
    if (app) app.removeAttribute('data-dash-pre-mount');
  }

  function mount(opts) {
    opts = opts || {};
    ensureBoot();
    if (document.querySelector('.dash-shell')) {
      bindBotSelect(document.querySelector('.dash-shell'));
      bindSidebarExpand(document.querySelector('.dash-shell'));
      finishMount();
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
      renderTopbar(title, subtitle, botId) +
      '<div class="dash-main" id="dash-main-slot"></div>' +
      '</div>';

    var slot = shell.querySelector('#dash-main-slot');
    slot.appendChild(content);
    content.classList.add('dash-mounted');
    content.style.display = '';
    content.style.visibility = 'visible';
    content.style.opacity = '1';

    document.body.classList.add('dash-has-shell');
    document.body.insertBefore(shell, document.body.firstChild);
    bindBotSelect(shell);
    bindSidebarExpand(shell);
    finishMount();
    return true;
  }

  function mountPage(opts) {
    ensureBoot();
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
    ensureBoot: ensureBoot,
    getBid: getBid,
    bidPath: bidPath,
    navHref: navHref,
    mount: mount,
    mountPage: mountPage,
    updateTopbar: updateTopbar,
    onBotChange: onBotChange,
    detectActiveKey: detectActiveKey,
    getIconForKey: getIconForKey,
    iconBadge: iconBadge,
    navIcon: navIcon,
    BOTS: BOTS,
    normalizeBotId: normalizeBotId,
  };
})(typeof window !== 'undefined' ? window : this);
