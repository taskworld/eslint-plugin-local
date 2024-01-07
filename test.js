// @ts-check

const { RuleTester } = require('eslint')
const chalk = require('chalk')

/**
 * @typedef {{
 * 	valid: Array<import('eslint').RuleTester.ValidTestCase>
 * 	invalid: Array<import('eslint').RuleTester.InvalidTestCase>
 * }} TestCases
 */

/**
 * @param {Record<string, import('eslint').Rule.RuleModule & { tests?: TestCases }>} rules
 * @returns {void | false}
 */
module.exports = function test(rules) {
	// See https://eslint.org/docs/latest/integrate/nodejs-api#ruletester
	const tester = new RuleTester()

	const exclusiveTestCases = []
	global.only = function only(testCase) {
		exclusiveTestCases.push(testCase)
		return testCase
	}

	for (const ruleName in rules) {
		const ruleModule = rules[ruleName]
		if (!ruleModule.tests || typeof ruleModule.tests !== 'object') {
			console.log('⚪ ' + ruleName)
			continue
		}

		let skipped = false

		const validItems = ruleModule.tests.valid.map(testCase => (
			{ testCase, valid: [testCase], invalid: [] }
		))
		const invalidItems = ruleModule.tests.invalid.map(testCase => (
			{ testCase, valid: [], invalid: [testCase] }
		))

		for (const { testCase, valid, invalid } of [...validItems, ...invalidItems]) {
			if (exclusiveTestCases.length > 0 && !exclusiveTestCases.includes(testCase)) {
				skipped = true
				continue
			}

			try {
				tester.run(ruleName, ruleModule, { valid, invalid })

			} catch (error) {
				console.log('🔴 ' + chalk.bold(ruleName))

				console.log('')
				console.log(offset(getPrettyCode(testCase.code), chalk.bgRed))
				console.log('')

				console.error(offset(error.message, chalk.red))
				if (error.stack) {
					console.error(offset(error.stack, chalk.red))
				}

				return false
			}
		}

		console.log((skipped ? '🟡' : '✅') + ' ' + ruleName)
	}

	console.log('')
	console.log(`Done testing ${Object.keys(rules).length} rule${Object.keys(rules).length === 1 ? '' : 's'}.`)
}

/**
 * @param {string} text 
 * @param {(line: string) => string} [decorateLine=line => line]
 */
function offset(text, decorateLine = line => line) {
	return text.split('\n').map(line => '   ' + decorateLine(line)).join('\n')
}

/**
 * @param {string} text
 * @returns {string}
 */
function getPrettyCode(text) {
	const trimmedCode = text.split('\n').filter((line, rank, list) =>
		(rank === 0 || rank === list.length - 1) ? line.trim().length > 0 : true
	)

	const indent = trimmedCode
		.filter(line => line.trim().length > 0)
		.map(line => line.match(/^(\t|\s)+/)?.at(0) || '')
		.reduce((output, indent) => indent.length < output.length ? indent : output, '')

	return trimmedCode.map(line => line
		.replace(new RegExp('^' + indent), '')
		.replace(/^\t+/, tabs => '  '.repeat(tabs.length))
	).join('\n')
}
