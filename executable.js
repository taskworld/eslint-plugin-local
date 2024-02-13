#!/usr/bin/env node

// @ts-check

const { parseArguments } = require('@thisismanta/pessimist')

if (process.argv[2] === 'test') {
	const { bail, silent } = parseArguments(process.argv.slice(2), {
		bail: false,
		silent: false,
	})

	// Do not move this below as `global.only` must be injected before anything
	const testRunner = require('./testRunner')

	const { rules } = require('./index')
	if (!rules || typeof rules !== 'object' || Object.keys(rules).length === 0) {
		throw new Error('Expected non-empty `rules` to be exported. See https://eslint.org/docs/latest/extend/plugins#rules-in-plugins')
	}

	const errorCount = testRunner(rules, {
		bail,
		log: silent ? () => { } : console.log,
		err: console.error,
	})

	process.exit(errorCount)
}
