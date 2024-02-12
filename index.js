#!/usr/bin/env node

// @ts-check

const fs = require('fs')
const path = require('path')
const test = require('./test')
const { parseArguments } = require('@thisismanta/pessimist')

const rulePath = findRulePath(__dirname)
if (!rulePath) {
	throw new Error('Could not find ".eslint-plugin-local" file or directory.')
}

module.exports = require(rulePath) || {}

const { name, version } = require('./package.json')
module.exports.meta = module.exports.meta || {}
module.exports.meta.name = name
module.exports.meta.version = version
module.exports.rules = module.exports.rules || {}

const { bail, silent, ...args } = parseArguments(process.argv.slice(2), {
	bail: false,
	silent: false,
})

if (args[0] === 'test') {
	if (Object.keys(module.exports.rules).length === 0) {
		throw new Error('Could not find any rules.')
	}

	const errorCount = test(module.exports.rules, {
		bail,
		log: silent ? () => { } : console.log,
		err: console.error,
	})
	if (errorCount > 0) {
		process.exit(errorCount)
	}
}

/**
 * Returns the file path representing `.eslint-plugin-local` or `null` if not found.
 * @param {string} workPath
 * @returns {string | null}
 */
function findRulePath(workPath) {
	if (workPath === path.dirname(workPath)) {
		return null
	}

	const item = fs.readdirSync(workPath, { withFileTypes: true })
		.find(item =>
			item.isFile() && /^\.eslint-plugin-local\.c?js$/.test(item.name) ||
			item.isDirectory() && item.name === '.eslint-plugin-local'
		)

	if (item?.isFile()) {
		// Do not write `item.path` as it is only available starting from Node.js v18.17.0 but VSCode uses v18.15.0 as of writing
		return path.join(workPath, item.name)
	}

	if (item?.isDirectory()) {
		for (const file of ['index.cjs', 'index.js']) {
			const testPath = path.join(workPath, item.name, file)
			if (fs.existsSync(testPath)) {
				return testPath
			}
		}

		return null
	}

	return findRulePath(path.dirname(workPath))
}
