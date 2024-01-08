#!/usr/bin/env node

// @ts-check

const fs = require('fs')
const path = require('path')

const rootPath = findRootPath()
if (!rootPath) {
	throw new Error('Could not find the root directory of the repository.')
}

const plugin = fs.readdirSync(rootPath, { withFileTypes: true })
	.find(item =>
		item.isFile() && /^\.eslint-plugin-local\.c?js$/.test(item.name) ||
		item.isDirectory() && item.name === '.eslint-plugin-local'
	)

if (!plugin) {
	throw new Error('Could not find ".eslint-plugin-local" file or directory.')
}

if (plugin.isDirectory()) {
	const index = fs.readdirSync(path.join(rootPath, plugin.name), { withFileTypes: true })
		.find(item => item.isFile() && /^index\.c?js$/.test(item.name))

	if (!index) {
		throw new Error('Could not find "index" file in ".eslint-plugin-local" directory.')
	}

	// Do not use `index.path` as it is only available starting from Node.js v18.17.0 but VSCode uses v18.15.0 as of writing
	module.exports = require(path.posix.join(rootPath, plugin.name, index.name))
} else {
	module.exports = require(path.posix.join(rootPath, plugin.name))
}

const { name, version } = require('./package.json')
module.exports.meta = module.exports.meta || {}
module.exports.meta.name = name
module.exports.meta.version = version

if (process.argv.includes('test')) {
	if (Object.keys(module.exports.rules || {}).length === 0) {
		throw new Error('Could not find any rules.')
	}

	const test = require('./test')
	if (test(module.exports.rules) === false) {
		process.exit(1)
	}
}

/**
 * Returns the root path of the project using the library by checking for a package.json file
 *
 * @returns {string | null}
 */
function findRootPath() {
  let currentDir = process.cwd();

  while (!hasPackageJson(currentDir)) {
    currentDir = path.resolve(currentDir, '..');

    if (currentDir === path.resolve(currentDir, '..')) {
      return null;
    }
  }

  return currentDir;
}

/**
 *
 * @param {string} dir
 * @returns {boolean}
 */
function hasPackageJson(dir) {
  const packageJsonPath = path.join(dir, 'package.json');
  return fs.existsSync(packageJsonPath);
}
