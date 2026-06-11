const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'site-presets.json');

/** Public project IDs → internal sitePreset keys */
const BOT_PROJECTS = {
  '001': {
    id: '001',
    sitePreset: 'receptionist',
    name: 'Receptionist',
    welcomeEventName: '',
    themeKey: 'receptionist',
  },
  '002': {
    id: '002',
    sitePreset: 'greenValley',
    name: 'Green Valley',
    welcomeEventName: 'START_GREEN_VALLEY',
    themeKey: 'greenValley',
  },
  '003': {
    id: '003',
    sitePreset: 'lakeView',
    name: 'Lake View',
    welcomeEventName: 'START_LAKE_VIEW',
    themeKey: 'lakeView',
  },
};

const DEFAULT_SITE_PRESETS = {
  receptionist: {
    common: {
      header: {
        title: 'Receptionist',
        subtitle: 'We are online to assist you',
      },
      botPersona: { label: 'Reception' },
      welcome: { enabled: false },
      features: {
        multiLanguage: { enabled: true },
        speechToText: { enabled: true },
        composerUpload: { enabled: true },
      },
      dialogflow: {
        liveAgent: { enabled: true },
        forms: { enabled: true },
        endChatEvent: { enabled: true, idleTimeoutMs: 10000 },
      },
    },
    desk: {
      launcherStrip: { enabled: true, text: '👋 Welcome! How can we help?' },
      autoOpenChat: { enabled: true, delayMs: 10000 },
      restartButton: { enabled: true },
      poweredBy: { enabled: true },
      features: {
        speechToText: { enabled: true },
        composerUpload: { enabled: true },
        restartChat: { enabled: false },
      },
    },
    mob: {
      launcherStrip: { enabled: true, text: '👋 Welcome! How can we help?' },
      autoOpenChat: { enabled: true, delayMs: 7000 },
      restartButton: { enabled: true },
      poweredBy: { enabled: true },
      features: {
        speechToText: { enabled: true },
        composerUpload: { enabled: true },
        restartChat: { enabled: true },
      },
    },
  },
  greenValley: {
    common: {
      header: {
        title: 'Green Valley',
        subtitle: 'Explore your dream home',
      },
      botPersona: { label: 'Green Valley' },
      welcome: { enabled: false },
      features: {
        multiLanguage: { enabled: false },
        speechToText: { enabled: true },
        composerUpload: { enabled: false },
      },
      dialogflow: {
        liveAgent: { enabled: false },
        forms: { enabled: true },
        endChatEvent: { enabled: true, idleTimeoutMs: 15000 },
      },
    },
    desk: {
      launcherStrip: { enabled: false },
      autoOpenChat: { enabled: true, delayMs: 5000 },
      restartButton: { enabled: true },
      poweredBy: { enabled: false },
      features: {
        speechToText: { enabled: true },
        composerUpload: { enabled: false },
        restartChat: { enabled: false },
      },
    },
    mob: {
      launcherStrip: { enabled: false },
      autoOpenChat: { enabled: true, delayMs: 4000 },
      restartButton: { enabled: true },
      poweredBy: { enabled: false },
      features: {
        speechToText: { enabled: false },
        composerUpload: { enabled: false },
        restartChat: { enabled: true },
      },
    },
  },
  lakeView: {
    common: {
      header: {
        title: 'Lake View',
        subtitle: 'Luxury lakeside living',
      },
      botPersona: { label: 'Lake View' },
      welcome: { enabled: false },
      features: {
        multiLanguage: { enabled: true },
        speechToText: { enabled: true },
        composerUpload: { enabled: true },
      },
      dialogflow: {
        liveAgent: { enabled: true },
        forms: { enabled: true },
        endChatEvent: { enabled: true, idleTimeoutMs: 12000 },
      },
    },
    desk: {
      launcherStrip: {
        enabled: true,
        text: '🌿 Discover Lake View homes',
      },
      autoOpenChat: { enabled: false },
      restartButton: { enabled: true },
      poweredBy: { enabled: true },
      features: {
        speechToText: { enabled: true },
        composerUpload: { enabled: true },
        restartChat: { enabled: false },
      },
    },
    mob: {
      launcherStrip: {
        enabled: true,
        text: '🌿 Discover Lake View homes',
      },
      autoOpenChat: { enabled: false },
      restartButton: { enabled: true },
      poweredBy: { enabled: true },
      features: {
        speechToText: { enabled: true },
        composerUpload: { enabled: true },
        restartChat: { enabled: true },
      },
    },
  },
};

function isPlainObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v);
}

function deepMerge(base, over) {
  const out = { ...(base || {}) };
  const o = over || {};
  Object.keys(o).forEach((k) => {
    if (isPlainObject(out[k]) && isPlainObject(o[k])) {
      out[k] = deepMerge(out[k], o[k]);
    } else {
      out[k] = o[k];
    }
  });
  return out;
}

function readOverrides_() {
  try {
    if (!fs.existsSync(DATA_PATH)) return {};
    const parsed = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    return parsed && typeof parsed.sitePresets === 'object' ? parsed.sitePresets : {};
  } catch (err) {
    console.warn('[site-presets] read failed:', err.message);
    return {};
  }
}

function writeOverrides_(sitePresets) {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tmp = DATA_PATH + '.tmp';
  fs.writeFileSync(
    tmp,
    JSON.stringify({ sitePresets, updatedAt: new Date().toISOString() }, null, 2),
    'utf8'
  );
  fs.renameSync(tmp, DATA_PATH);
}

function getMergedSitePresets() {
  const overrides = readOverrides_();
  const out = {};
  Object.keys(DEFAULT_SITE_PRESETS).forEach((key) => {
    out[key] = deepMerge(
      DEFAULT_SITE_PRESETS[key],
      overrides[key] || {}
    );
  });
  return out;
}

function listProjects() {
  return Object.values(BOT_PROJECTS).map((p) => ({
    ...p,
    settingsPath: `/bot-settings/${p.id}.html`,
  }));
}

function resolveProject(projectId) {
  const id = String(projectId || '').trim();
  return BOT_PROJECTS[id] || null;
}

function getProjectPreset(projectId) {
  const project = resolveProject(projectId);
  if (!project) return null;
  const all = getMergedSitePresets();
  return {
    project,
    preset: all[project.sitePreset] || DEFAULT_SITE_PRESETS[project.sitePreset],
  };
}

function saveProjectPreset(projectId, preset) {
  const project = resolveProject(projectId);
  if (!project) return { ok: false, error: 'Unknown project ID' };
  if (!preset || typeof preset !== 'object') {
    return { ok: false, error: 'Invalid preset payload' };
  }
  const overrides = readOverrides_();
  overrides[project.sitePreset] = preset;
  writeOverrides_(overrides);
  return { ok: true, project, preset: getMergedSitePresets()[project.sitePreset] };
}

module.exports = {
  BOT_PROJECTS,
  DATA_PATH,
  getMergedSitePresets,
  listProjects,
  getProjectPreset,
  saveProjectPreset,
  deepMerge,
};
