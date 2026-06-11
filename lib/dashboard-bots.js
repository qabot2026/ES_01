/**
 * Dashboard bot registry — public Bot ID (10001…) maps to internal project 001/002/003.
 */

const sitePresetsStore = require('./site-presets-store');

/** @type {Record<string, { bid: string, projectId: string, name: string, sitePreset: string }>} */
const BY_BID = {
  '10001': { bid: '10001', projectId: '001', name: 'Receptionist', sitePreset: 'receptionist' },
  '10002': { bid: '10002', projectId: '002', name: 'Green Valley', sitePreset: 'greenValley' },
  '10003': { bid: '10003', projectId: '003', name: 'Lake View', sitePreset: 'lakeView' },
};

const DEFAULT_BID = '10001';

/** Page slug → route metadata */
const PAGES = {
  home: {
    label: 'Dashboard home',
    botSpecific: false,
    resolvePath: (bid) => '/dashboard/' + (bid ? '?bid=' + bid : ''),
  },
  'uc-conversations': {
    label: 'User chatbot analytics',
    botSpecific: true,
    aliases: ['aichatanalytics'],
    resolvePath: (bid) => bidPath(bid, 'uc-conversations'),
  },
  queryanalytics: {
    label: 'Query analytics',
    botSpecific: true,
    resolvePath: (bid) => bidPath(bid, 'queryanalytics'),
  },
  'uiux-setting': {
    label: 'UI / UX settings',
    botSpecific: true,
    resolvePath: (bid) => bidPath(bid, 'uiux-setting'),
  },
  supersetting: {
    label: 'Super settings',
    botSpecific: true,
    resolvePath: (bid) => bidPath(bid, 'supersetting'),
  },
  'ua-conversations': {
    label: 'User agent analytics',
    botSpecific: false,
    aliases: ['agentanalytics'],
    resolvePath: () => '/ua-conversations',
  },
  'live-agent': {
    label: 'Service desk',
    botSpecific: false,
    resolvePath: () => '/live-agent/',
  },
  appointments: {
    label: 'Appointments',
    botSpecific: false,
    resolvePath: () => '/dashboard/appointments.html',
  },
  'live-agent-settings': {
    label: 'Service desk settings',
    botSpecific: false,
    slug: 'live-agent/settings',
    resolvePath: () => '/live-agent/settings',
  },
  documents: {
    label: 'Documents',
    botSpecific: false,
    resolvePath: () => '/dashboard/documents.html',
  },
  'manage-access': {
    label: 'Manage access',
    botSpecific: false,
    resolvePath: () => '/dashboard/manage-access.html',
  },
};

function bidPath(bid, slug) {
  return '/bid=' + encodeURIComponent(bid) + '/' + slug;
}

function listBots() {
  return Object.values(BY_BID).map((b) => ({
    ...b,
    settingsPath: '/bid=' + b.bid + '/uiux-setting',
  }));
}

function resolveBid(bid) {
  const id = String(bid || '').trim();
  return BY_BID[id] || null;
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
      redirect: '/bot-settings/' + bot.projectId + '.html?bid=' + bot.bid,
    };
  }

  if (pageKey === 'uc-conversations' || pageKey === 'ua-conversations') {
    const base = pageKey === 'ua-conversations' ? '/ua-conversations' : '/uc-conversations';
    return {
      pageKey,
      redirect: bot ? base + '?bid=' + bot.bid : base,
    };
  }

  if (pageKey === 'queryanalytics') {
    return {
      pageKey,
      redirect: '/dashboard/query-analytics.html' + (bot ? '?bid=' + bot.bid : ''),
    };
  }

  if (pageKey === 'supersetting') {
    return {
      pageKey,
      redirect: '/dashboard/supersetting.html' + (bot ? '?bid=' + bot.bid : ''),
    };
  }

  if (pageKey === 'home') {
    return { pageKey, redirect: '/dashboard/' + (bot ? '?bid=' + bot.bid : '') };
  }

  const path = page.resolvePath(bot ? bot.bid : null);
  return { pageKey, redirect: path };
}

function navSections(currentBid) {
  const bid = resolveBid(currentBid) ? currentBid : defaultBid();
  const botPages = [
    'uc-conversations',
    'queryanalytics',
    'uiux-setting',
    'supersetting',
  ];
  const commonPages = [
    'ua-conversations',
    'live-agent',
    'appointments',
    'live-agent-settings',
    'documents',
    'manage-access',
  ];
  return {
    bid,
    bot: resolveBid(bid),
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
    homeHref: PAGES.home.resolvePath(bid),
  };
}

module.exports = {
  BY_BID,
  DEFAULT_BID,
  PAGES,
  bidPath,
  listBots,
  resolveBid,
  defaultBid,
  normalizePageSlug,
  resolvePageTarget,
  navSections,
  projectFromBid(bid) {
    const b = resolveBid(bid);
    return b ? sitePresetsStore.resolveProject(b.projectId) : null;
  },
};
