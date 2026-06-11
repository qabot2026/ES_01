const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BOT_SETTINGS_DIR = path.join(ROOT, 'public', 'bot-settings');
const PUBLIC_DIR = path.join(ROOT, 'public');
const COMPANY_CONFIG_PATH = path.join(ROOT, 'public', 'company.config.js');
const NAV_ASSET_V = '20260611e';

function toDemoSlug(name, botId) {
  const slug = String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'bot-' + String(botId || '').slice(-3);
}

function demoFileName(name, botId) {
  return toDemoSlug(name, botId) + '-demo.html';
}

function renderBotSettingsHtml(botId, botName) {
  const title = 'Bot settings — ' + botId + ' ' + botName;
  return (
    '<!DOCTYPE html>\n<html lang="en">\n<head>\n' +
    '  <meta charset="UTF-8" />\n' +
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n' +
    '  <meta name="robots" content="noindex, nofollow" />\n' +
    '  <title>' +
    title +
    '</title>\n' +
    '  <link rel="stylesheet" href="bot-settings.css" />\n' +
    '</head>\n<body data-page="project">\n' +
    '  <div id="app"></div>\n' +
    "  <script>window.BOT_ID = '" +
    botId +
    "';</script>\n" +
    '  <script src="/company.config.js"></script>\n' +
    '  <script src="../dashboard/desk-auth.js"></script>\n' +
    '  <script src="../dashboard/dashboard-nav.js?v=' +
    NAV_ASSET_V +
    '"></script>\n' +
    '  <script src="bot-settings.js"></script>\n' +
    '</body>\n</html>\n'
  );
}

function renderDemoHtml(bot) {
  const name = bot.name || 'Chatbot';
  const event = bot.welcomeEventName
    ? String(bot.welcomeEventName).trim()
    : 'FRESH';
  const eventNote = bot.welcomeEventName
    ? '<code>' + event + '</code> event chalega.'
    : 'Home bot — <code>FRESH</code> event (default).';
  return (
    '<!DOCTYPE html>\n<html lang="en">\n<head>\n' +
    '  <meta charset="UTF-8" />\n' +
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n' +
    '  <title>' +
    name +
    ' — chat test</title>\n' +
    '  <style>\n' +
    '    body { font-family: system-ui, sans-serif; max-width: 42rem; margin: 2rem auto; padding: 0 1rem; color: #333; }\n' +
    '  </style>\n' +
    '</head>\n<body>\n' +
    '  <h1>' +
    name +
    ' (test page)</h1>\n' +
    '  <p>Chat open karo — ' +
    eventNote +
    '</p>\n' +
    '  <script>\n' +
    '    window.QA_CONFIG = {\n' +
    (bot.welcomeEventName
      ? "      welcomeEventName: '" + event + "',\n"
      : '') +
    "      sitePreset: '" +
    bot.sitePreset +
    "',\n" +
    '    };\n' +
    '  </script>\n' +
    '  <script src="/embed.js" async></script>\n' +
    '</body>\n</html>\n'
  );
}

function writeFileAtomic_(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tmp = filePath + '.tmp';
  fs.writeFileSync(tmp, content, 'utf8');
  fs.renameSync(tmp, filePath);
}

function formatSitePresetEntry(key, preset) {
  const json = JSON.stringify(preset, null, 2);
  const lines = json.split('\n');
  const first = '      ' + key + ': ' + lines[0];
  const rest = lines.slice(1).map((line) => '        ' + line);
  return [first, ...rest].join('\n') + ',';
}

function sitePresetExistsInCompanyConfig_(key) {
  if (!fs.existsSync(COMPANY_CONFIG_PATH)) return false;
  const text = fs.readFileSync(COMPANY_CONFIG_PATH, 'utf8');
  return text.includes('      ' + key + ':');
}

function findSitePresetsInsertPoint_(text) {
  const patterns = ['    },\r\n\r\n    chatPanel:', '    },\n\n    chatPanel:'];
  for (let i = 0; i < patterns.length; i++) {
    const idx = text.indexOf(patterns[i]);
    if (idx >= 0) return { idx, anchor: patterns[i] };
  }
  const match = text.match(/    \},\r?\n\r?\n    chatPanel:/);
  if (match && match.index >= 0) {
    return { idx: match.index, anchor: match[0] };
  }
  return null;
}

function addSitePresetToCompanyConfig(key, preset) {
  if (!fs.existsSync(COMPANY_CONFIG_PATH)) {
    return { ok: false, error: 'company.config.js not found' };
  }
  if (sitePresetExistsInCompanyConfig_(key)) {
    return { ok: true, skipped: true };
  }

  let text = fs.readFileSync(COMPANY_CONFIG_PATH, 'utf8');
  const point = findSitePresetsInsertPoint_(text);
  if (!point) {
    return { ok: false, error: 'company.config.js sitePresets block not found' };
  }

  const block = formatSitePresetEntry(key, preset) + '\n';
  text = text.slice(0, point.idx) + block + text.slice(point.idx);
  writeFileAtomic_(COMPANY_CONFIG_PATH, text);
  return { ok: true };
}

function removeSitePresetFromCompanyConfig(key) {
  if (!fs.existsSync(COMPANY_CONFIG_PATH)) return { ok: true };
  let text = fs.readFileSync(COMPANY_CONFIG_PATH, 'utf8');
  const start = text.indexOf('      ' + key + ':');
  if (start < 0) return { ok: true, skipped: true };

  const braceStart = text.indexOf('{', start);
  if (braceStart < 0) return { ok: false, error: 'Malformed sitePreset in company.config.js' };

  let depth = 0;
  let end = braceStart;
  for (; end < text.length; end++) {
    if (text[end] === '{') depth++;
    if (text[end] === '}') depth--;
    if (depth === 0) break;
  }
  end += 1;
  if (text[end] === ',') end += 1;
  if (text[end] === '\n') end += 1;

  text = text.slice(0, start) + text.slice(end);
  writeFileAtomic_(COMPANY_CONFIG_PATH, text);
  return { ok: true };
}

function safeUnlink_(filePath) {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return true;
  } catch (err) {
    console.warn('[bot-project-files] unlink failed:', filePath, err.message);
    return false;
  }
}

function createForBot(bot, preset) {
  const files = [];
  const botId = bot.id;
  const settingsPath = path.join(BOT_SETTINGS_DIR, botId + '.html');
  writeFileAtomic_(settingsPath, renderBotSettingsHtml(botId, bot.name));
  files.push('/bot-settings/' + botId + '.html');

  const demoName = demoFileName(bot.name, botId);
  const demoPath = path.join(PUBLIC_DIR, demoName);
  writeFileAtomic_(demoPath, renderDemoHtml(bot));
  files.push('/' + demoName);

  const configResult = addSitePresetToCompanyConfig(bot.sitePreset, preset);
  if (configResult.ok && !configResult.skipped) {
    files.push('public/company.config.js (sitePreset: ' + bot.sitePreset + ')');
  } else if (!configResult.ok) {
    console.warn('[bot-project-files] company.config.js update failed:', configResult.error);
  }

  return {
    ok: true,
    files,
    demoPath: '/' + demoName,
    settingsPath: '/bot-settings/' + botId + '.html',
    companyConfigUpdated: !!(configResult.ok && !configResult.skipped),
  };
}

function removeForBot(bot) {
  const removed = [];
  if (bot && bot.id) {
    const settingsPath = path.join(BOT_SETTINGS_DIR, bot.id + '.html');
    if (safeUnlink_(settingsPath)) removed.push('/bot-settings/' + bot.id + '.html');
  }
  if (bot && bot.name) {
    const demoPath = path.join(PUBLIC_DIR, demoFileName(bot.name, bot.id));
    if (safeUnlink_(demoPath)) removed.push('/' + demoFileName(bot.name, bot.id));
  }
  if (bot && bot.sitePreset) {
    removeSitePresetFromCompanyConfig(bot.sitePreset);
    removed.push('company.config.js:' + bot.sitePreset);
  }
  return { ok: true, removed };
}

module.exports = {
  NAV_ASSET_V,
  toDemoSlug,
  demoFileName,
  renderBotSettingsHtml,
  renderDemoHtml,
  createForBot,
  removeForBot,
  addSitePresetToCompanyConfig,
  removeSitePresetFromCompanyConfig,
};
