// @ts-check

const { RuleTester } = require('eslint')
const chalk = require('chalk')

const gray = chalk.hex('#BDBDBD')

/**
 * @param {{ valid?: Array<import('./types').TestCase>, invalid?: Array<import('./types').TestCase> } | Array<import('./types').TestCase> | import('./types').TestCase} testCaseOrGroup
 */
function only(testCaseOrGroup) {
	// Disallow test case exclusiveness in CI
	if (!process.env.CI) {
		if (typeof testCaseOrGroup === 'string') {
			// Not support
		} else if (Array.isArray(testCaseOrGroup)) {
			// Support `valid: only([...])` and `invalid: only([...])`
			for (const listItem of testCaseOrGroup) {
				only(listItem)
			}
		} else if (typeof testCaseOrGroup === 'object' && testCaseOrGroup !== null) {
			if ('code' in testCaseOrGroup) {
				testCaseOrGroup.only = true
			} else {
				if ('valid' in testCaseOrGroup && Array.isArray(testCaseOrGroup.valid)) {
					only(testCaseOrGroup.valid)
				}
				if ('invalid' in testCaseOrGroup && Array.isArray(testCaseOrGroup.invalid)) {
					only(testCaseOrGroup.invalid)
				}
			}
		}
	}

	return testCaseOrGroup
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
	const tester = new RuleTester({
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
		}
	})

	const oneOrMoreTestCaseIsSkipped = Object.values(rules).some(ruleModule =>
		ruleModule.tests?.valid?.some(testCase =>
			typeof testCase === 'object' && testCase.only
		) ||
		ruleModule.tests?.invalid?.some(testCase =>
			testCase.only
		)
	)

	const ruleList = Object.entries(rules).map(([ruleName, ruleModule]) => {
		/**
		 * @type {Array<import('./types').TestCase>}
		 */
		const totalTestCases = [
			...(ruleModule.tests?.valid || []).map(testCase =>
				typeof testCase === 'string' ? { code: testCase } : testCase
			),
			...(ruleModule.tests?.invalid || []),
		]

		const selectTestCases = totalTestCases.filter(testCase =>
			oneOrMoreTestCaseIsSkipped ? testCase.only : true
		)

		return {
			ruleName,
			ruleModule,
			totalTestCases,
			selectTestCases,
		}
	})

	// Put rules that have zero and all-skipped test cases at the top respectively
	ruleList.sort((left, right) => {
		if (left.totalTestCases.length === 0 && right.totalTestCases.length === 0) {
			return 0
		} else if (left.totalTestCases.length === 0) {
			return -1
		} else if (right.totalTestCases.length === 0) {
			return 1
		}

		if (left.selectTestCases.length === 0 && right.selectTestCases.length === 0) {
			return 0
		} else if (left.selectTestCases.length === 0) {
			return -1
		} else if (right.selectTestCases.length === 0) {
			return 1
		}

		return 0
	})

	const stats = { pass: 0, fail: 0, skip: 0 }

	for (const { ruleName, ruleModule, totalTestCases, selectTestCases } of ruleList) {
		if (totalTestCases.length === 0) {
			log('⚪ ' + ruleName)
			continue
		}

		stats.skip += totalTestCases.length - selectTestCases.length

		if (selectTestCases.length === 0) {
			log('⏩ ' + ruleName)
			continue
		}

		const failingTestResults = selectTestCases.reduce(
			/** 
			 * @param {Array<import('./types').TestCase & { error: Error }>} results
			 */
			(results, { only, ...testCase }) => {
				try {
					tester.run(
						ruleName,
						ruleModule,
						// Run one test case at a time
						'errors' in testCase
							? { valid: [], invalid: [testCase] }
							: { valid: [testCase], invalid: [] }
					)

				} catch (error) {
					results.push({ ...testCase, error })
				}

				return results
			}, [])

		if (failingTestResults.length > 0) {
			log('🔴 ' + ruleName)
			for (const failingTestCase of failingTestResults) {
				if (failingTestCase !== failingTestResults[0]) {
					// Add a blank line between test cases
					log('')
				}

				log(offset(failingTestCase.code, true, chalk.bgHex('#E0E0E0')))

				// See https://eslint.org/docs/latest/integrate/nodejs-api#ruletester
				if (failingTestCase.name !== undefined) {
					log(gray('   name: ') + failingTestCase.name)
				}
				if (failingTestCase.filename !== undefined) {
					log(gray('   filename: ') + failingTestCase.filename)
				}
				if (failingTestCase.options !== undefined) {
					log(gray('   options: ') + offset(JSON.stringify(failingTestCase.options, null, 2)).replace(/^\s*/, ''))
				}

				err(offset(failingTestCase.error.message))

				if (bail) {
					return 1
				}
			}

		} else if (totalTestCases.length === selectTestCases.length) {
			log('🟢 ' + ruleName)

		} else {
			log('🟡 ' + ruleName)
		}

		stats.pass += selectTestCases.length - failingTestResults.length
		stats.fail += failingTestResults.length
	}

	log('')

	if (stats.skip > 0) {
		log(chalk.bgHex('#0CAAEE')(chalk.white.bold(' SKIP ')) + ' ' + stats.skip.toLocaleString())
	}

	log(chalk.bgGreen(chalk.white.bold(' PASS ')) + ' ' + stats.pass.toLocaleString())

	if (stats.fail > 0) {
		log(chalk.bgRed(chalk.white.bold(' FAIL ')) + ' ' + stats.fail.toLocaleString())
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
function offset(text, lineNumberVisible = false, decorateLine = line => line) {
	const lines = text.split('\n')
	const lastLineDigitCount = Math.max(lines.length.toString().length, 2)
	return lines.map((line, lineIndex) => {
		const lineNumber = gray(
			(lineIndex + 1).toString().padStart(lastLineDigitCount, ' ')
		)
		return (lineNumberVisible ? lineNumber : '  ') + ' ' + decorateLine(line)
	}).join('\n')
}
