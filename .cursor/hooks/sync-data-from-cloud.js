/**
 * Cursor sessionStart — auto npm install (if needed) + sync client-based data.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');

function ensureDependencies() {
  const nodeModules = path.join(ROOT, 'node_modules');
  const packageJson = path.join(ROOT, 'package.json');
  const packageLock = path.join(ROOT, 'package-lock.json');
  if (!fs.existsSync(packageJson)) return;

  let needsInstall = !fs.existsSync(nodeModules);
  if (!needsInstall && fs.existsSync(packageLock)) {
    try {
      needsInstall = fs.statSync(packageLock).mtimeMs > fs.statSync(nodeModules).mtimeMs;
    } catch {
      needsInstall = true;
    }
  }
  if (!needsInstall) return;

  try {
    execSync('npm install --no-audit --no-fund', {
      cwd: ROOT,
      stdio: 'pipe',
      windowsHide: true,
    });
  } catch {
    /* offline or npm missing — ignore */
  }
}

async function restoreFromGit() {
  try {
    execSync('git fetch origin main --quiet', { cwd: ROOT, stdio: 'pipe' });
    execSync(
      'git restore --source=origin/main es_private/client-based/data/bot-registry.json es_private/client-based/data/site-presets.json',
      { cwd: ROOT, stdio: 'pipe' }
    );
  } catch {
    /* offline or no git remote — ignore */
  }
}

async function syncClientData() {
  try {
    const dataFileSync = require(path.join(ROOT, 'es_private', 'lib', 'data-file-sync'));
    if (dataFileSync.useGcs() || dataFileSync.useGithub()) {
      await dataFileSync.pullAllForWorkspace();
      return;
    }
  } catch {
    /* fall through */
  }
  await restoreFromGit();
}

async function main() {
  ensureDependencies();
  await syncClientData();
}

main().catch(() => {});
