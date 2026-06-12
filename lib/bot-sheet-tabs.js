/**
 * Per-bot Google Sheet tab names — stored in bot-registry.json (Supersetting).
 * Agent chats tab: SHEETS_AGENT_TAB on Railway (one tab for all bots).
 */

/** Default tab names for seeded bots (used when sheetTab is empty). */
const DEFAULT_BOT_ID = '10001';
const DEFAULT_SITE_PRESET = 'receptionist';

const DEFAULT_SHEET_TABS = {
  '10001': 'Recep. Chats',
  '10002': 'Green Valley Conv.',
  '10003': 'Lake Valley Leads',
};

function sitePresetsStore() {
  return require('./site-presets-store');
}

function normalizeSheetTab(tab) {
  return String(tab || '').trim();
}

function agentTabName() {
  const env = String(process.env.SHEETS_AGENT_TAB || '').trim();
  if (env) return env;
  try {
    const sheets = require('./sheets');
    return sheets.dashboardTabName();
  } catch {
    return 'Agent Chats';
  }
}

function suggestSheetTabForBot(name) {
  const label = String(name || '').trim();
  if (!label) return 'Bot Conv.';
  return label + ' Conv.';
}

function resolveConversationTabForBot(bot) {
  if (!bot) return null;
  const tab = normalizeSheetTab(bot.sheetTab);
  if (tab) return tab;
  const fallback = DEFAULT_SHEET_TABS[bot.id];
  if (fallback) return fallback;
  try {
    const sheets = require('./sheets');
    return sheets.tabName();
  } catch {
    return null;
  }
}

function resolveConversationTabForBotId(botId) {
  return resolveConversationTabForBot(sitePresetsStore().resolveProject(botId));
}

function resolveConversationTabForSitePreset(sitePreset) {
  const key = String(sitePreset || '').trim();
  if (!key) return null;
  const bots = sitePresetsStore().listProjects();
  const bot = bots.find((b) => b.sitePreset === key);
  return resolveConversationTabForBot(bot);
}

function resolveConversationTabForMeta(meta) {
  const m = meta && typeof meta === 'object' ? meta : {};
  if (m.botId) {
    const byId = resolveConversationTabForBotId(m.botId);
    if (byId) return byId;
  }
  if (m.sitePreset) {
    const byPreset = resolveConversationTabForSitePreset(m.sitePreset);
    if (byPreset) return byPreset;
  }
  /* Home / receptionist embed often omits QA_CONFIG.sitePreset — default bot 10001 */
  return resolveConversationTabForBotId(DEFAULT_BOT_ID);
}

function ensureBotSheetTabsOnRegistry_(bots) {
  let changed = false;
  const out = bots.map((b) => {
    if (normalizeSheetTab(b.sheetTab)) return b;
    const fallback = DEFAULT_SHEET_TABS[b.id];
    if (!fallback) return b;
    changed = true;
    return { ...b, sheetTab: fallback };
  });
  return { bots: out, changed };
}

module.exports = {
  DEFAULT_BOT_ID,
  DEFAULT_SITE_PRESET,
  DEFAULT_SHEET_TABS,
  agentTabName,
  suggestSheetTabForBot,
  normalizeSheetTab,
  resolveConversationTabForBot,
  resolveConversationTabForBotId,
  resolveConversationTabForSitePreset,
  resolveConversationTabForMeta,
  ensureBotSheetTabsOnRegistry_,
};
