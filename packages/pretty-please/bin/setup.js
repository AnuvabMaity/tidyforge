#!/usr/bin/env node
import {
  copyConfigFiles,
  copyFile,
  log,
  mergePackageConfig,
  validatePackageJson,
  mergeScripts,
  readJSON,
  writeJSON,
} from '@tidyforge/core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const userRoot = process.cwd();

const packageRoot = path.resolve(__dirname, '..');
const configsDir = path.join(packageRoot, 'configs');
const huskyDir = path.join(packageRoot, 'hooks');

const CONFIGS = ['eslint.config.mjs', '.prettierrc'];

const setupScriptsStep = (pkg) => {
  const scriptsPath = path.join(configsDir, 'scripts.json');

  if (!fs.existsSync(scriptsPath)) {
    log.error('scripts.json not found in configs directory');
    return;
  }

  try {
    const scriptsConfig = readJSON(scriptsPath);

    if (!scriptsConfig.scripts || typeof scriptsConfig.scripts !== 'object') {
      log.error("Invalid scripts.json format: missing 'scripts' object");
      return;
    }

    mergeScripts(pkg, scriptsConfig.scripts);

    if (scriptsConfig['lint-staged'])
      mergePackageConfig(pkg, 'lint-staged', scriptsConfig['lint-staged']);
  } catch (err) {
    log.error(`Failed to process scripts.json: ${err.message}`);
  }
};

const setupHuskyStep = async (pkg) => {
  try {
    const userHuskyDir = path.join(userRoot, '.husky');
    fs.mkdirSync(userHuskyDir, { recursive: true });

    const hookFiles = fs.readdirSync(huskyDir);

    for (const hookFile of hookFiles) {
      const src = path.join(huskyDir, hookFile);
      const dest = path.join(userHuskyDir, hookFile);

      if (fs.statSync(src).isDirectory()) continue;

      const copied = await copyFile(src, dest, 'git hook', true);

      if (copied && process.platform !== 'win32') fs.chmodSync(dest, '755');
    }

    mergeScripts(pkg, { prepare: 'husky' });
  } catch (err) {
    log.error(`Husky setup failed: ${err.message}`);
  }
};

const main = async () => {
  log.info('Pretty Please • Setting up...\n');
  const pkgPath = path.join(userRoot, 'package.json');
  const pkg = validatePackageJson(pkgPath);

  log.info('[1/4] • Preparing configuration files...');
  await copyConfigFiles(configsDir, userRoot, CONFIGS, true);

  log.info('\n[2/4] • Configuring package scripts...');
  setupScriptsStep(pkg);

  log.info('\n[3/4] • Installing Git hooks...');
  await setupHuskyStep(pkg);

  log.info('\n[4/4] • Finalizing setup...');
  writeJSON(pkgPath, pkg);

  log.info('\nSetup success! Happy coding!');
};

main().catch((err) => {
  log.error(`Setup failed: ${err.message}`);
  process.exit(1);
});
