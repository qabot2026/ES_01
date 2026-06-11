/**
 * Dashboard routing — bot IDs from data/bot-registry.json (5-digit public IDs).
 */

const sitePresetsStore = require('./site-presets-store');

const DEFAULT_BID = '10001';

/** Page slug → route metadata */
const PAGES = {
  home: {
    label: 'Home',
    botSpecific: false,
    resolvePath: (bid) => '/dashboard/' + (bid ? '?bid=' + bid : ''),
  },
  'uc-conversations': {
    label: 'Insights',
    botSpecific: true,
    aliases: ['aichatanalytics'],
    resolvePath: (bid) => bidPath(bid, 'uc-conversations'),
  },
  queryanalytics: {
    label: 'Customer questions',
    botSpecific: true,
    resolvePath: (bid) => bidPath(bid, 'queryanalytics'),
  },
  'uiux-setting': {
    label: 'Chatbot appearance',
    botSpecific: true,
    resolvePath: (bid) => bidPath(bid, 'uiux-setting'),
  },
  supersetting: {
    label: 'Advanced configuration',
    botSpecific: true,
    resolvePath: (bid) => bidPath(bid, 'supersetting'),
  },
  'ua-conversations': {
    label: 'Agent conversations',
    botSpecific: false,
    aliases: ['agentanalytics'],
    resolvePath: () => '/ua-conversations',
  },
  'live-agent': {
    label: 'Live chat inbox',
    botSpecific: false,
    resolvePath: () => '/live-agent/',
  },
  appointments: {
    label: 'Appointments',
    botSpecific: false,
    resolvePath: () => '/dashboard/appointments.html',
  },
  'live-agent-settings': {
    label: 'Live chat setup',
    botSpecific: false,
    slug: 'live-agent/settings',
    resolvePath: () => '/live-agent/settings',
  },
  documents: {
    label: 'Customer uploads',
    botSpecific: false,
    resolvePath: () => '/dashboard/documents.html',
  },
  'manage-access': {
    label: 'Access permissions',
    botSpecific: false,
    resolvePath: () => '/dashboard/manage-access.html',
  },
};

function bidPath(bid, slug) {
  return '/bid=' + encodeURIComponent(bid) + '/' + slug;
}

function listBots() {
  return sitePresetsStore.listProjects();
}

function resolveBid(bid) {
  return sitePresetsStore.resolveProject(bid);
}

function defaultBid() {
  return DEFAULT_BID;
}

function normalizePageSlug(slug) {
  const s = String(slug || '')
    .trim()
    .toLowerCase()
    .replace(/\.html$/, '');
  if (PAGES[s]) return s;
  for (const [key, page] of Object.entries(PAGES)) {
    if (page.slug === s) return key;
    if (page.aliases && page.aliases.includes(s)) return key;
  }
  return null;
}

function resolvePageTarget(slug, bid) {
  const pageKey = normalizePageSlug(slug);
  if (!pageKey) return null;
  const page = PAGES[pageKey];
  const bot = resolveBid(bid);
  if (page.botSpecific && !bot) return null;

  if (pageKey === 'uiux-setting') {
    if (!bot) return null;
    return {
      pageKey,
      redirect: '/bot-settings/' + bot.id + '.html',
    };
  }

  if (pageKey === 'uc-conversations' || pageKey === 'ua-conversations') {
    const base = pageKey === 'ua-conversations' ? '/ua-conversations' : '/uc-conversations';
    return {
      pageKey,
      redirect: bot ? base + '?bid=' + bot.id : base,
    };
  }

  if (pageKey === 'queryanalytics') {
    return {
      pageKey,
      redirect: '/dashboard/query-analytics.html' + (bot ? '?bid=' + bot.id : ''),
    };
  }

  if (pageKey === 'supersetting') {
    return {
      pageKey,
      redirect: '/dashboard/supersetting.html' + (bot ? '?bid=' + bot.id : ''),
    };
  }

  if (pageKey === 'home') {
    return { pageKey, redirect: '/dashboard/' + (bot ? '?bid=' + bot.id : '') };
  }

  const path = page.resolvePath(bot ? bot.id : null);
  return { pageKey, redirect: path };
}

function navSections(currentBid) {
  const bid = resolveBid(currentBid) ? normalizeBotId(currentBid) : defaultBid();
  const bot = resolveBid(bid);
  const botPages = [
    'uc-conversations',
    'queryanalytics',
    'uiux-setting',
    'supersetting',
  ];
  const commonPages = [
    'appointments',
    'documents',
    'live-agent',
    'ua-conversations',
    'live-agent-settings',
    'manage-access',
  ];
  const chatbotPages = [
    'uc-conversations',
    'queryanalytics',
    'appointments',
    'documents',
    'uiux-setting',
    'supersetting',
  ];
  const agentPages = ['live-agent', 'ua-conversations', 'live-agent-settings'];
  const adminPages = ['manage-access'];
  return {
    bid,
    bot,
    bots: listBots(),
    botSection: botPages.map((key) => ({
      key,
      label: PAGES[key].label,
      href: PAGES[key].resolvePath(bid),
    })),
    commonSection: commonPages.map((key) => ({
      key,
      label: PAGES[key].label,
      href: PAGES[key].resolvePath(bid),
    })),
    chatbotSection: chatbotPages.map((key) => ({
      key,
      label: PAGES[key].label,
      href: PAGES[key].resolvePath(bid),
    })),
    agentSection: agentPages.map((key) => ({
      key,
      label: PAGES[key].label,
      href: PAGES[key].resolvePath(bid),
    })),
    adminSection: adminPages.map((key) => ({
      key,
      label: PAGES[key].label,
      href: PAGES[key].resolvePath(bid),
    })),
    homeHref: PAGES.home.resolvePath(bid),
  };
}

function normalizeBotId(bid) {
  return sitePresetsStore.normalizeBotId(bid);
}

module.exports = {
  DEFAULT_BID,
  PAGES,
  bidPath,
  listBots,
  resolveBid,
  defaultBid,
  normalizeBotId,
  normalizePageSlug,
  resolvePageTarget,
  navSections,
};
