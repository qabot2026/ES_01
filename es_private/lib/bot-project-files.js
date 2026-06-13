const fs = require('fs');
const path = require('path');
const botConfigFiles = require('./bot-config-files');
const clientPaths = require('./client-paths');

const PUBLIC_DIR = path.join(clientPaths.PROJECT_ROOT, 'es_public');
const BOT_SETTINGS_DIR = clientPaths.botSettingsDir();
const PAGES_DIR = clientPaths.pagesDir();
const NAV_ASSET_V = '20260613b';

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
    '  <script src="/bot-configs/bootstrap.js"></script>\n' +
    '  <script src="/bot-configs/load-chain.js"></script>\n' +
    '  <script>\n' +
    '    ESLoadScriptChain([\n' +
    "      '/company.config.js',\n" +
    "      '/dashboard/desk-auth.js',\n" +
    "      '/dashboard/dashboard-nav.js?v=" +
    NAV_ASSET_V +
    "',\n" +
    "      '/bot-settings/bot-settings.js'\n" +
    '    ]);\n' +
    '  </script>\n' +
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
    '    window.ES_CONFIG = {\n' +
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

function createForBot(bot, preset) {
  const files = [];
  const botId = bot.id;
  const settingsPath = path.join(BOT_SETTINGS_DIR, botId + '.html');
  writeFileAtomic_(settingsPath, renderBotSettingsHtml(botId, bot.name));
  files.push('/bot-settings/' + botId + '.html');

  const demoName = demoFileName(bot.name, botId);
  const demoPath = path.join(PAGES_DIR, demoName);
  writeFileAtomic_(demoPath, renderDemoHtml(bot));
  files.push('/' + demoName);

  const configPath = botConfigFiles.createBotConfigFile(bot, preset);
  files.push(configPath);

  return {
    ok: true,
    files,
    demoPath: '/' + demoName,
    settingsPath: '/bot-settings/' + botId + '.html',
    configPath,
  };
}

function removeForBot(bot) {
  const removed = [];
  if (bot && bot.id) {
    const settingsPath = path.join(BOT_SETTINGS_DIR, bot.id + '.html');
    try {
      if (fs.existsSync(settingsPath)) fs.unlinkSync(settingsPath);
      removed.push('/bot-settings/' + bot.id + '.html');
    } catch (err) {
      console.warn('[bot-project-files] unlink failed:', err.message);
    }
  }
  if (bot && bot.name) {
    const demoPath = path.join(PAGES_DIR, demoFileName(bot.name, bot.id));
    try {
      if (fs.existsSync(demoPath)) fs.unlinkSync(demoPath);
      removed.push('/' + demoFileName(bot.name, bot.id));
    } catch (err) {
      console.warn('[bot-project-files] unlink failed:', err.message);
    }
  }
  if (bot && bot.sitePreset) {
    removed.push(botConfigFiles.removeBotConfigFile(bot));
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
};
