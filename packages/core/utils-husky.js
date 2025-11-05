import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { log, promptUser } from './utils.js';

/**
 * Checks if Husky package is installed in node_modules
 * @param {string} userRoot - The root directory of the user's project
 * @returns {boolean} - True if Husky is installed
 */
const isHuskyInstalled = (userRoot) => {
  const huskyPath = path.join(userRoot, 'node_modules', 'husky');
  return fs.existsSync(huskyPath);
};

/**
 * Checks if Husky has been initialized (.husky/_/husky.sh exists)
 * @param {string} userRoot - The root directory of the user's project
 * @returns {boolean} - True if Husky is initialized
 */
const isHuskyInitialized = (userRoot) => {
  const huskyInitFile = path.join(userRoot, '.husky', '_', 'husky.sh');
  return fs.existsSync(huskyInitFile);
};

/**
 * Checks if a specific Git hook exists
 * @param {string} userRoot - The root directory of the user's project
 * @param {string} hookName - Name of the hook (e.g., 'pre-commit', 'commit-msg')
 * @returns {boolean} - True if the hook file exists
 */
export const isHookInstalled = (userRoot, hookName) => {
  const hookPath = path.join(userRoot, '.husky', hookName);
  return fs.existsSync(hookPath);
};

/**
 * Checks if Git repository is initialized
 * @param {string} userRoot - The root directory of the user's project
 * @returns {boolean} - True if .git directory exists
 */
export const isGitInitialized = (userRoot) => {
  const gitPath = path.join(userRoot, '.git');
  return fs.existsSync(gitPath);
};

/**
 * Prompts user to install Husky
 * @returns {Promise<boolean>} - True if user confirms installation
 */
export const promptHuskyInstall = async () => {
  log.info('Husky is required to set up Git hooks.');
  return await promptUser('\nWould you like to install Husky? (Y/n): ');
};

/**
 * Prompts user to initialize Husky
 * @returns {Promise<boolean>} - True if user confirms initialization
 */
export const promptHuskyInit = async () => {
  return await promptUser('\nActivate Git hooks? (Y/n): ');
};

/**
 * Prompts user about overwriting existing hook
 * @param {string} hookName - Name of the hook
 * @returns {Promise<boolean>} - True if user confirms overwrite
 */
export const promptHookOverwrite = async (hookName) => {
  log.warn(`\nThe ${hookName} hook already exists.`);
  return await promptUser(`\nDo you want to overwrite it? (y/N): `);
};

/**
 * Installs Husky package via npm
 * @param {string} userRoot - The root directory of the user's project
 * @returns {boolean} - True if installation succeeded
 */
export const installHusky = (userRoot) => {
  try {
    execSync('npm install --save-dev husky', {
      stdio: 'inherit',
      cwd: userRoot,
    });
    return true;
  } catch (err) {
    log.error(`Failed to install Husky: ${err.message}`);
    return false;
  }
};

/**
 * Initializes Husky (creates .husky directory and internal files)
 * @param {string} userRoot - The root directory of the user's project
 * @returns {boolean} - True if initialization succeeded
 */
export const initializeHusky = (userRoot) => {
  try {
    execSync('npx husky', {
      stdio: 'inherit',
      cwd: userRoot,
    });
    return true;
  } catch (err) {
    log.error(`Failed to initialize Husky: ${err.message}`);
    return false;
  }
};

/**
 * Ensures Husky is both installed and initialized
 * Prompts user if either step is needed
 * @param {string} userRoot - The root directory of the user's project
 * @param {boolean} autoPrompt - If true, prompts user; if false, fails silently
 * @returns {Promise<boolean>} - True if Husky is ready to use
 */
export const ensureHuskyReady = async (userRoot, autoPrompt = true) => {
  if (!isGitInitialized(userRoot)) {
    log.error('Git repository not initialized. Run "git init" first.');
    return false;
  }

  if (!isHuskyInstalled(userRoot)) {
    if (autoPrompt) {
      const shouldInstall = await promptHuskyInstall();
      if (!shouldInstall) {
        log.warn('Husky installation skipped. Git hooks will not work.');
        return false;
      }
      if (!installHusky(userRoot)) return false;
    } else {
      log.error('Husky is not installed.');
      return false;
    }
  }

  if (!isHuskyInitialized(userRoot)) {
    if (autoPrompt) {
      const shouldInit = await promptHuskyInit();
      if (!shouldInit) {
        log.warn('Husky initialization skipped. Git hooks will not work.');
        return false;
      }
      if (!initializeHusky(userRoot)) return false;
    } else {
      log.error('Husky is not initialized.');
      return false;
    }
  }

  return true;
};

/**
 * Installs a Git hook with specified content
 * @param {string} userRoot - The root directory of the user's project
 * @param {string} hookName - Name of the hook (e.g., 'pre-commit', 'commit-msg')
 * @param {string} hookCommand - Command to execute in the hook
 * @param {boolean} overwrite - If true, overwrites existing hook without prompting
 * @returns {Promise<boolean>} - True if hook was installed successfully
 */
export const installHook = async (userRoot, hookName, hookCommand, overwrite = false) => {
  const hookPath = path.join(userRoot, '.husky', hookName);

  // Check if hook already exists
  if (isHookInstalled(userRoot, hookName)) {
    const existingContent = fs.readFileSync(hookPath, 'utf-8');

    // If the exact command already exists, skip
    if (existingContent.includes(hookCommand.trim())) {
      log.info(`${hookName} hook already configured with this command.`);
      return true;
    }

    // Prompt for overwrite if not auto-overwriting
    if (!overwrite) {
      const shouldOverwrite = await promptHookOverwrite(hookName);
      if (!shouldOverwrite) {
        log.info(`${hookName} hook installation skipped.`);
        return false;
      }
    }
  }

  try {
    // Create hook file with proper format
    const hookContent = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

${hookCommand}
`;

    fs.writeFileSync(hookPath, hookContent, { encoding: 'utf-8' });

    // Make executable on Unix systems
    if (process.platform !== 'win32') {
      fs.chmodSync(hookPath, '755');
    }

    log.success(`${hookName} hook installed successfully!`);
    return true;
  } catch (err) {
    log.error(`Failed to install ${hookName} hook: ${err.message}`);
    return false;
  }
};

/**
 * Adds a command to an existing hook (appends without overwriting)
 * @param {string} userRoot - The root directory of the user's project
 * @param {string} hookName - Name of the hook
 * @param {string} hookCommand - Command to add
 * @returns {boolean} - True if command was added successfully
 */
export const addToHook = (userRoot, hookName, hookCommand) => {
  const hookPath = path.join(userRoot, '.husky', hookName);

  if (!isHookInstalled(userRoot, hookName)) {
    log.error(`${hookName} hook does not exist. Use installHook instead.`);
    return false;
  }

  try {
    const existingContent = fs.readFileSync(hookPath, 'utf-8');

    // Check if command already exists
    if (existingContent.includes(hookCommand.trim())) {
      log.info(`Command already exists in ${hookName} hook.`);
      return true;
    }

    // Append command
    fs.appendFileSync(hookPath, `\n${hookCommand}\n`);
    log.success(`Command added to ${hookName} hook.`);
    return true;
  } catch (err) {
    log.error(`Failed to add command to ${hookName} hook: ${err.message}`);
    return false;
  }
};
