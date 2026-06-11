(function (global) {
  'use strict';

  var NAV_ASSET_V = '20260610e';
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

  /** Sidebar order: home → daily work → setup → admin */
  var NAV_SECTIONS = [
    {
      items: [{ key: 'home', label: 'Home', icon: 'home' }],
    },
    {
      items: [
        { key: 'live-agent', label: 'Live chat inbox', icon: 'headset' },
        { key: 'uc-conversations', label: 'Chatbot conversations', icon: 'chart' },
        { key: 'ua-conversations', label: 'Agent conversations', icon: 'users' },
        { key: 'queryanalytics', label: 'Customer questions', icon: 'search' },
        { key: 'appointments', label: 'Appointments', icon: 'calendar' },
        { key: 'documents', label: 'Customer uploads', icon: 'file' },
      ],
    },
    {
      items: [
        { key: 'uiux-setting', label: 'Chatbot appearance', icon: 'palette' },
        { key: 'live-agent/settings', label: 'Live chat setup', icon: 'cog' },
        { key: 'supersetting', label: 'Advanced configuration', icon: 'shield' },
      ],
    },
    {
      items: [{ key: 'manage-access', label: 'Access permissions', icon: 'lock' }],
    },
  ];

  var ICONS = {
    home:
      '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
    chart:
      '<path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 17V9"/><path d="M12 17V7"/><path d="M16 17v-4"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    palette:
      '<circle cx="12" cy="12" r="9"/><circle cx="8.5" cy="10.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="9" r="1.2" fill="currentColor" stroke="none"/><circle cx="16" cy="14.5" r="1.2" fill="currentColor" stroke="none"/>',
    shield: '<path d="M12 3 20 7v6c0 5-3.5 8-8 8s-8-3-8-8V7l8-4z"/>',
    users:
      '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/><path d="M14.5 14c2.8 0 5 1.8 5 5"/>',
    headset:
      '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="2"/><rect x="17" y="14" width="4" height="6" rx="2"/>',
    calendar:
      '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4M16 3v4M4 11h16"/>',
    cog:
      '<circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
    lock:
      '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  };

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
      '<svg class="dash-nav-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      paths +
      '</svg>'
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
        navIcon(iconName) +
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

  function mount(opts) {
    opts = opts || {};
    if (document.querySelector('.dash-shell')) {
      bindBotSelect(document.querySelector('.dash-shell'));
      bindSidebarExpand(document.querySelector('.dash-shell'));
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
    content.style.display = '';

    document.body.classList.add('dash-has-shell');
    document.body.insertBefore(shell, document.body.firstChild);
    bindBotSelect(shell);
    bindSidebarExpand(shell);
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
