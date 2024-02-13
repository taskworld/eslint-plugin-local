// @ts-check

const fs = require('fs')
const path = require('path')

const rulePath = findRulePath(__dirname)
if (!rulePath) {
	throw new Error('Expected ".eslint-plugin-local" file or directory.')
}

const { name, version } = require('./package.json')

/**
 * @type {import('./types').Plugin}
 */
module.exports = {
	meta: {
		name,
		version,
	},
	rules: {},
	...require(rulePath),
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
