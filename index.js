#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const rootPath = findRootPath(__dirname)
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
	const index = fs.readdirSync(path.join(plugin.path, plugin.name), { withFileTypes: true })
		.find(item => item.isFile() && /^index\.c?js$/.test(item.name))

	if (!index) {
		throw new Error('Could not find "index" file in ".eslint-plugin-local" directory.')
	}

	module.exports = require(path.join(index.path || '', index.name))
} else {
	module.exports = require(path.join(plugin.path || '', plugin.name))
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
 * Returns the current dependent repository path which `.git` directory resides.
 * 
 * Do not write `require('../../package.json')` which might break when using PNPM.
 */
function findRootPath(workPath) {
	if (workPath === path.dirname(workPath)) {
		return null
	}

	const testPath = path.join(workPath, '.git')
	if (fs.existsSync(testPath) && fs.lstatSync(testPath).isDirectory()) {
		return workPath
	}

	return findRootPath(path.dirname(workPath))
}
