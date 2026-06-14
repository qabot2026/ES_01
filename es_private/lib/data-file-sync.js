/**
 * Auto-sync runtime data/ files between Railway, GCS, and GitHub.
 * Triggered on Supersetting save — no manual pull commands needed.
 */

const fs = require('fs');
const path = require('path');
const gcsUpload = require('./gcs-upload');
const clientPaths = require('./client-paths');
const appEnv = require('./app-env');

const DATA_DIR = clientPaths.dataDir();
const GCS_PREFIX = appEnv.GCS_DATA_SYNC_PREFIX.replace(/^\/+|\/+$/g, '');

const SYNC_FILES = [
  'bot-registry.json',
  'site-presets.json',
  'social-integrations.json',
  'whatsapp-integration.json',
];

const GITHUB_REPO = appEnv.GITHUB_REPO;
const GITHUB_BRANCH = appEnv.GITHUB_BRANCH;
const GITHUB_TOKEN = appEnv.GITHUB_TOKEN;

const pending = new Set();
let flushTimer = null;

function useGcs() {
  return appEnv.DATA_SYNC_GCS && gcsUpload.isConfigured();
}

function useGithub() {
  return appEnv.DATA_SYNC_GITHUB && !!GITHUB_TOKEN;
}

function githubHeaders() {
  return {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'es-chatbot-data-sync',
    'Content-Type': 'application/json',
  };
}

function readUpdatedAt(content) {
  try {
    const parsed = JSON.parse(content);
    const ts = Date.parse(String(parsed.updatedAt || ''));
    return Number.isFinite(ts) ? ts : 0;
  } catch {
    return 0;
  }
}

function writeLocalFile(fileName, content) {
  const localPath = path.join(DATA_DIR, fileName);
  const dir = path.dirname(localPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tmp = localPath + '.tmp';
  fs.writeFileSync(tmp, content, 'utf8');
  fs.renameSync(tmp, localPath);
}

function scheduleSync(fileName) {
  if (!SYNC_FILES.includes(fileName)) return;
  pending.add(fileName);
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushPending().catch((err) => {
      console.warn('[data-sync] flush failed:', err.message);
    });
  }, 2000);
}

async function flushPending() {
  const files = [...pending];
  pending.clear();
  for (const fileName of files) {
    await pushFile(fileName);
  }
}

async function pushFile(fileName) {
  const localPath = path.join(DATA_DIR, fileName);
  if (!fs.existsSync(localPath)) return;
  const content = fs.readFileSync(localPath, 'utf8');
  const tasks = [];
  if (useGcs()) tasks.push(pushToGcs(fileName, content));
  if (useGithub()) {
    tasks.push(
      pushToGithub(
        `es_private/client-based/data/${fileName}`,
        content,
        `sync: update es_private/client-based/data/${fileName} from server`
      )
    );
  }
  if (!tasks.length) return;
  const results = await Promise.allSettled(tasks);
  results.forEach((result) => {
    if (result.status === 'rejected') {
      console.warn('[data-sync] push failed:', result.reason.message);
    }
  });
}

async function pushToGcs(fileName, content) {
  const storage = gcsUpload.getStorage();
  if (!storage) return;
  const objectPath = `${GCS_PREFIX}/${fileName}`;
  await storage.bucket(gcsUpload.BUCKET_NAME).file(objectPath).save(content, {
    contentType: 'application/json',
    resumable: false,
  });
  console.log('[data-sync] GCS pushed', objectPath);
}

async function pushToGithub(repoPath, content, message) {
  const [owner, repo] = GITHUB_REPO.split('/');
  if (!owner || !repo) throw new Error('Invalid GITHUB_REPO');
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${repoPath}`;
  const getRes = await fetch(`${url}?ref=${encodeURIComponent(GITHUB_BRANCH)}`, {
    headers: githubHeaders(),
  });
  let sha;
  if (getRes.ok) {
    const meta = await getRes.json();
    sha = meta.sha;
    const remote = Buffer.from(meta.content || '', 'base64').toString('utf8');
    if (remote === content) return;
  } else if (getRes.status !== 404) {
    throw new Error(`GitHub read ${repoPath}: HTTP ${getRes.status}`);
  }
  const putRes = await fetch(url, {
    method: 'PUT',
    headers: githubHeaders(),
    body: JSON.stringify({
      message,
      content: Buffer.from(content, 'utf8').toString('base64'),
      branch: GITHUB_BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!putRes.ok) {
    throw new Error(`GitHub write ${repoPath}: HTTP ${putRes.status} ${await putRes.text()}`);
  }
  console.log('[data-sync] GitHub pushed', repoPath);
}

async function pullFromGcs(fileName) {
  const storage = gcsUpload.getStorage();
  if (!storage) return false;
  const objectPath = `${GCS_PREFIX}/${fileName}`;
  const file = storage.bucket(gcsUpload.BUCKET_NAME).file(objectPath);
  const [exists] = await file.exists();
  if (!exists) return false;
  const [buf] = await file.download();
  const remote = buf.toString('utf8');
  const localPath = path.join(DATA_DIR, fileName);
  if (fs.existsSync(localPath) && fs.readFileSync(localPath, 'utf8') === remote) {
    return true;
  }
  writeLocalFile(fileName, remote);
  console.log('[data-sync] GCS pulled', objectPath);
  return true;
}

async function pullFromGithub(fileName) {
  const [owner, repo] = GITHUB_REPO.split('/');
  if (!owner || !repo) return false;
  const repoPath = `es_private/client-based/data/${fileName}`;
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${repoPath}?ref=${encodeURIComponent(GITHUB_BRANCH)}`;
  const res = await fetch(url, { headers: githubHeaders() });
  if (!res.ok) return false;
  const meta = await res.json();
  const remote = Buffer.from(meta.content || '', 'base64').toString('utf8');
  const localPath = path.join(DATA_DIR, fileName);
  const local = fs.existsSync(localPath) ? fs.readFileSync(localPath, 'utf8') : '';
  if (local === remote) return true;
  if (readUpdatedAt(remote) < readUpdatedAt(local)) return true;
  writeLocalFile(fileName, remote);
  console.log('[data-sync] GitHub pulled', repoPath);
  return true;
}

async function pullFile(fileName) {
  let pulled = false;
  if (useGcs()) {
    try {
      pulled = await pullFromGcs(fileName);
    } catch (err) {
      console.warn('[data-sync] GCS pull failed', fileName, err.message);
    }
  }
  if (!pulled && useGithub()) {
    try {
      await pullFromGithub(fileName);
    } catch (err) {
      console.warn('[data-sync] GitHub pull failed', fileName, err.message);
    }
  }
}

async function pullAllOnStartup() {
  if (!useGcs() && !useGithub()) return;
  for (const fileName of SYNC_FILES) {
    await pullFile(fileName);
  }
}

async function pullAllForWorkspace() {
  for (const fileName of SYNC_FILES) {
    await pullFile(fileName);
  }
}

module.exports = {
  SYNC_FILES,
  scheduleSync,
  pullAllOnStartup,
  pullAllForWorkspace,
  useGcs,
  useGithub,
};
