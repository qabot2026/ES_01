const fs = require('fs');
const path = require('path');

const BOT_CONFIGS_DIR = path.join(__dirname, '..', 'public', 'bot-configs');
const MANIFEST_PATH = path.join(BOT_CONFIGS_DIR, 'manifest.json');

const DEFAULT_THEME = {
  '--qa-primary': '#0284c7',
  '--qa-primary-dark': '#0369a1',
  '--qa-primary-deep': '#075985',
  '--qa-accent': '#0ea5e9',
  '--qa-accent-light': '#bae6fd',
  '--qa-bg': '#e8f4fc',
  '--qa-bg-2': '#f7fbff',
  '--qa-border': '#dbe5ec',
  '--qa-bot-bg': 'linear-gradient(168deg, #e8f6ff 0%, #bae6fd 100%)',
  '--qa-bot-text': '#0c4a6e',
  '--qa-user-bg': 'linear-gradient(145deg, #0284c7 0%, #0ea5e9 100%)',
  '--qa-user-text': '#f0f9ff',
  '--qa-header-bg':
    'linear-gradient(180deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.1) 24%, transparent 46%), linear-gradient(168deg, #38bdf8 0%, #0284c7 42%, #075985 100%)',
  '--qa-shadow':
    '0 10px 28px -6px rgba(15, 23, 42, 0.1), 0 20px 40px -14px rgba(14, 165, 233, 0.12)',
  '--qa-launcher-shadow': '0 3px 10px -2px rgba(14, 165, 233, 0.2)',
  '--qa-launcher-shadow-hover': '0 5px 14px -2px rgba(14, 165, 233, 0.28)',
  '--qa-ring-color': '#0ea5e9',
};

const SEED_THEMES = {
  receptionist: DEFAULT_THEME,
  greenValley: {
    '--qa-primary': '#ca8a04',
    '--qa-primary-dark': '#a16207',
    '--qa-primary-deep': '#854d0e',
    '--qa-accent': '#eab308',
    '--qa-accent-light': '#fef08a',
    '--qa-bg': '#fefce8',
    '--qa-bg-2': '#fffbeb',
    '--qa-border': '#fde68a',
    '--qa-bot-bg': 'linear-gradient(168deg, #fef9c3 0%, #fde047 100%)',
    '--qa-bot-text': '#713f12',
    '--qa-user-bg': 'linear-gradient(145deg, #ca8a04 0%, #eab308 100%)',
    '--qa-user-text': '#fffbeb',
    '--qa-header-bg':
      'linear-gradient(180deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.1) 24%, transparent 46%), linear-gradient(168deg, #fde047 0%, #ca8a04 42%, #854d0e 100%)',
    '--qa-shadow':
      '0 10px 28px -6px rgba(15, 23, 42, 0.1), 0 20px 40px -14px rgba(202, 138, 4, 0.12)',
    '--qa-launcher-shadow': '0 3px 10px -2px rgba(202, 138, 4, 0.2)',
    '--qa-launcher-shadow-hover': '0 5px 14px -2px rgba(202, 138, 4, 0.28)',
    '--qa-ring-color': '#eab308',
  },
  lakeView: {
    '--qa-primary': '#16a34a',
    '--qa-primary-dark': '#15803d',
    '--qa-primary-deep': '#166534',
    '--qa-accent': '#22c55e',
    '--qa-accent-light': '#bbf7d0',
    '--qa-bg': '#f0fdf4',
    '--qa-bg-2': '#f7fef9',
    '--qa-border': '#bbf7d0',
    '--qa-bot-bg': 'linear-gradient(168deg, #dcfce7 0%, #86efac 100%)',
    '--qa-bot-text': '#14532d',
    '--qa-user-bg': 'linear-gradient(145deg, #16a34a 0%, #22c55e 100%)',
    '--qa-user-text': '#f0fdf4',
    '--qa-header-bg':
      'linear-gradient(180deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.1) 24%, transparent 46%), linear-gradient(168deg, #4ade80 0%, #16a34a 42%, #166534 100%)',
    '--qa-shadow':
      '0 10px 28px -6px rgba(15, 23, 42, 0.1), 0 20px 40px -14px rgba(22, 163, 74, 0.12)',
    '--qa-launcher-shadow': '0 3px 10px -2px rgba(22, 163, 74, 0.2)',
    '--qa-launcher-shadow-hover': '0 5px 14px -2px rgba(22, 163, 74, 0.28)',
    '--qa-ring-color': '#22c55e',
  },
};

function writeFileAtomic_(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tmp = filePath + '.tmp';
  fs.writeFileSync(tmp, content, 'utf8');
  fs.renameSync(tmp, filePath);
}

function configFileName(sitePreset) {
  return sitePreset + '.config.js';
}

function configFilePath(sitePreset) {
  return path.join(BOT_CONFIGS_DIR, configFileName(sitePreset));
}

function renderBotConfigJs(bot, theme, sitePresetBlock) {
  const key = bot.sitePreset;
  const pack = {
    botId: bot.id,
    name: bot.name,
    welcomeEventName: bot.welcomeEventName || '',
    theme: theme || DEFAULT_THEME,
    sitePreset: sitePresetBlock,
  };
  const json = JSON.stringify(pack, null, 2);
  return (
    '/** UI/UX config — ' +
    bot.name +
    ' (Bot ID ' +
    bot.id +
    ', sitePreset: ' +
    key +
    ') */\n' +
    '(function (g) {\n' +
    "  g.QA_BOT_PRESETS = g.QA_BOT_PRESETS || {};\n" +
    '  g.QA_BOT_PRESETS[' +
    JSON.stringify(key) +
    '] = ' +
    json +
    ';\n' +
    "})(typeof window !== 'undefined' ? window : this);\n"
  );
}

function readManifest_() {
  try {
    if (!fs.existsSync(MANIFEST_PATH)) return { configs: [], updatedAt: null };
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  } catch (err) {
    console.warn('[bot-config-files] manifest read failed:', err.message);
    return { configs: [], updatedAt: null };
  }
}

function writeManifest_(configs) {
  writeFileAtomic_(
    MANIFEST_PATH,
    JSON.stringify(
      {
        configs: configs.slice().sort(),
        updatedAt: new Date().toISOString(),
      },
      null,
      2
    )
  );
}

function addToManifest_(sitePreset) {
  const file = configFileName(sitePreset);
  const manifest = readManifest_();
  if (!manifest.configs.includes(file)) {
    manifest.configs.push(file);
    writeManifest_(manifest.configs);
  }
}

function removeFromManifest_(sitePreset) {
  const file = configFileName(sitePreset);
  const manifest = readManifest_();
  writeManifest_(manifest.configs.filter((f) => f !== file));
}

function createBotConfigFile(bot, sitePresetBlock) {
  const theme = SEED_THEMES[bot.sitePreset] || DEFAULT_THEME;
  const filePath = configFilePath(bot.sitePreset);
  writeFileAtomic_(filePath, renderBotConfigJs(bot, theme, sitePresetBlock));
  addToManifest_(bot.sitePreset);
  return '/bot-configs/' + configFileName(bot.sitePreset);
}

function removeBotConfigFile(bot) {
  const filePath = configFilePath(bot.sitePreset);
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
    console.warn('[bot-config-files] unlink failed:', err.message);
  }
  removeFromManifest_(bot.sitePreset);
  return '/bot-configs/' + configFileName(bot.sitePreset);
}

function listConfigFiles() {
  return readManifest_().configs || [];
}

module.exports = {
  BOT_CONFIGS_DIR,
  MANIFEST_PATH,
  DEFAULT_THEME,
  SEED_THEMES,
  configFileName,
  configFilePath,
  renderBotConfigJs,
  createBotConfigFile,
  removeBotConfigFile,
  listConfigFiles,
  readManifest_,
  writeManifest_,
};
