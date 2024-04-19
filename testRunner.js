// @ts-check

const { RuleTester } = require('eslint')
const chalk = require('chalk')

const Exclusiveness = Symbol('exclusivenessToken')

/**
 * @param {Array<import('./types').TestCase> | import('./types').TestCase} item 
 */
function only(item) {
	// Disallow test case exclusiveness in CI
	if (!process.env.CI) {
		if (Array.isArray(item)) {
			// Support `valid: only([...])` and `invalid: only([...])`
			for (const listItem of item) {
				only(listItem)
			}
		} else if (typeof item === 'object' && item !== null) {
			item[Exclusiveness] = true
		}
	}

	return item
}

/**
 * @param {import('./types').Plugin['rules']} rules
 * @param {{ bail: boolean, log: (line: string) => void, err: (line: string) => void }} [options={ bail: false, log: console.log, err: console.error }]
 * @returns {number} number of error test cases
 */
function testRunner(
	rules,
	{ bail, log, err } = { bail: false, log: console.log, err: console.error }
) {
	// See https://eslint.org/docs/latest/integrate/nodejs-api#ruletester
	const tester = new RuleTester({ parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module',
	  }})

	const oneOrMoreTestCaseIsSkipped = Object.values(rules).some(ruleModule =>
		ruleModule.tests?.valid?.some(testCase => testCase[Exclusiveness]) ||
		ruleModule.tests?.invalid?.some(testCase => testCase[Exclusiveness])
	)

	const stats = { pass: 0, fail: 0, skip: 0 }
	for (const ruleName in rules) {
		const ruleModule = rules[ruleName]
		if (
			!ruleModule.tests ||
			typeof ruleModule.tests !== 'object' ||
			!ruleModule.tests.valid && !ruleModule.tests.invalid
		) {
			log('⚪ ' + ruleName)
			continue
		}

		for (const testCase of ruleModule.tests.invalid || []) {
			testCase.errors = testCase.errors ?? []
		}

		/**
		 * @type {Array<import('./types').TestCase>}
		 */
		const totalItems = [
			...(ruleModule.tests.valid || []).map(testCase => typeof testCase === 'string' ? { code: testCase } : testCase),
			...(ruleModule.tests.invalid || []),
		]
		const runningItems = totalItems.filter(testCase => oneOrMoreTestCaseIsSkipped ? !!testCase[Exclusiveness] : true)

		const errors = runningItems.reduce((results, testCase) => {
			try {
				tester.run(
					ruleName,
					ruleModule,
					'errors' in testCase ? { valid: [], invalid: [testCase] } : { valid: [testCase], invalid: [] }
				)

			} catch (error) {
				results.push({ testCase, error })
			}

			return results
		}, /** @type {Array<{ testCase: import('./types').TestCase, error: Error }>} */([]))

		stats.skip += totalItems.length - runningItems.length
		stats.fail += errors.length
		stats.pass += runningItems.length - errors.length

		if (errors.length > 0) {
			err('🔴 ' + ruleName)
			for (const { testCase, error } of errors) {
				err('')
				err(offset(getPrettyCode(testCase.code), chalk.bgRed))
				err('')
				err(offset(error.message, chalk.red))

				if (bail) {
					return 1
				}
			}

		} else if (totalItems.length === runningItems.length) {
			log('🟢 ' + ruleName)

		} else if (runningItems.length > 0) {
			log('🟡 ' + ruleName)

		} else {
			log('⏩ ' + ruleName)
		}
	}

	log('')
	log(chalk.bgGreen(chalk.bold(' PASS ')) + ' ' + stats.pass.toLocaleString())
	if (stats.fail > 0) {
		log(chalk.bgRed(chalk.bold(' FAIL ')) + ' ' + stats.fail.toLocaleString())
	}
	if (stats.skip > 0) {
		log(chalk.bgHex('#0CAAEE')(chalk.bold(' SKIP ')) + ' ' + stats.skip.toLocaleString())
	}

	return stats.fail
}

global.only = only
module.exports = testRunner
module.exports.only = only

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
