import fs from 'fs';
import path from 'path';
import readline from 'readline';

//* ============================================================================
//* LOGGING UTILITIES
//* ============================================================================

const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[36m',
  reset: '\x1b[0m',
};

/**
 * Centralized logging utilities with color coding
 */

export const log = {
  success: (msg) => console.log(`${colors.green}✔ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  error: (msg) => console.error(`${colors.red}✘ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}${msg}${colors.reset}`),
};

//* ============================================================================
//* JSON UTILITIES
//* ============================================================================

/**
 * Read and parse JSON file with error handling
 * @param {string} filePath - Path to JSON file
 * @param {string} errorMsg - Custom error message
 * @returns {Object} Parsed JSON object
 */
export const readJSON = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (err) {
    log.error(`Failed to read ${path.basename(filePath)}: ${err.message}`);
    process.exit(1);
  }
};

/**
 * Write object to JSON file with formatting
 * @param {string} filePath - Destination file path
 * @param {Object} data - Data to write
 */
export const writeJSON = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
    log.success(`${path.basename(filePath)} updated`);
  } catch (err) {
    log.error(`Failed to write ${path.basename(filePath)}: ${err.message}`);
    process.exit(1);
  }
};

//* ============================================================================
//* FILE OPERATIONS
//* ============================================================================

/**
 * Prompt user for yes/no confirmation
 * @param {string} question - Question to ask
 * @returns {Promise<boolean>} User's response
 */
const promptUser = (question) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${question} (Y/n): `, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      resolve(normalized === 'y' || normalized === 'yes' || normalized === '');
    });
  });
};

/**
 * Copy file with validation and error handling
 * @param {string} src - Source file path
 * @param {string} dest - Destination file path
 * @param {string} description - File description for logging
 * @param {boolean} allowOverwrite - Whether to prompt for overwriting existing files
 * @returns {Promise<boolean>} Success status
 */
export const copyFile = async (src, dest, description, allowOverwrite = false) => {
  const fileName = path.basename(dest);

  if (!fs.existsSync(src)) {
    log.error(`Source ${description} not found: ${fileName}`);
    return false;
  }

  if (fs.existsSync(dest)) {
    if (allowOverwrite) {
      const shouldOverwrite = await promptUser(`⚠ ${fileName} already exists. Overwrite?`);

      if (!shouldOverwrite) {
        log.info(`Skipped ${fileName}`);
        return false;
      }
    } else {
      log.warning(`Skipping ${fileName} (already exists)`);
      return false;
    }
  }

  try {
    fs.copyFileSync(src, dest);
    log.success(`Created ${fileName}`);
    return true;
  } catch (err) {
    log.error(`Failed to copy ${fileName}: ${err.message}`);
    return false;
  }
};

/**
 * Copy multiple config files from source directory to destination
 * @param {string} srcDir - Source directory containing config files
 * @param {string} destDir - Destination directory (usually project root)
 * @param {string[]} files - Array of file names to copy
 * @param {boolean} allowOverwrite - Whether to prompt for overwriting
 * @returns {Promise<Object>} Results object with success/failure counts
 */
export const copyConfigFiles = async (srcDir, destDir, files, allowOverwrite = false) => {
  const results = { success: 0, skipped: 0, failed: 0 };

  for (const file of files) {
    const src = path.join(srcDir, file);
    const dest = path.join(destDir, file);

    const copied = await copyFile(src, dest, 'config file', allowOverwrite);

    if (copied) {
      results.success++;
    } else if (fs.existsSync(dest)) {
      results.skipped++;
    } else {
      results.failed++;
    }
  }

  return results;
};

//* ============================================================================
//* PACKAGE.JSON UTILITIES
//* ============================================================================

/**
 * Validate existence of package.json
 * @param {string} pkgPath - Path to package.json
 * @returns {Object} - Validated package.json content
 */
export const validatePackageJson = (pkgPath) => {
  if (!fs.existsSync(pkgPath)) {
    log.error('No package.json found! Please run `npm init -y` first.');
    process.exit(1);
  }
  return readJSON(pkgPath);
};

/**
 * Merge scripts into package.json
 * @param {Object} pkg - Parsed package.json object
 * @param {Object} newScripts - Scripts to add/merge
 * @param {boolean} overwrite - Whether to overwrite existing scripts
 * @returns {Object} Updated package.json object
 */
export const mergeScripts = (pkg, newScripts, overwrite = false) => {
  pkg.scripts = pkg.scripts ?? {};

  Object.entries(newScripts).forEach(([key, value]) => {
    if (!pkg.scripts[key] || overwrite) {
      pkg.scripts[key] = value;
    } else {
      log.warning(`Script "${key}" already exists, skipping`);
    }
  });

  return pkg;
};

/**
 * Merge configuration object into package.json
 * @param {Object} pkg - Parsed package.json object
 * @param {string} configKey - Key name (e.g., "lint-staged", "commitizen")
 * @param {Object} configValue - Configuration object to add
 * @param {boolean} merge - Whether to merge with existing config or replace
 * @returns {Object} Updated package.json object
 */
export const mergePackageConfig = (pkg, configKey, configValue, merge = true) => {
  if (!pkg[configKey] || !merge) {
    pkg[configKey] = configValue;
    log.success(`Added ${configKey} configuration`);
  } else {
    pkg[configKey] = { ...pkg[configKey], ...configValue };
    log.success(`Merged ${configKey} configuration`);
  }

  return pkg;
};
