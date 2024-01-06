const { RuleTester } = require('eslint')
const chalk = require('chalk')

module.exports = function test(rules) {
	// See https://eslint.org/docs/latest/integrate/nodejs-api#ruletester
	const tester = new RuleTester()

	const exclusiveTestCases = []

	for (const name in rules) {
		const rule = rules[name]
		if (!rule.tests) {
			console.log('🟡 ' + name)
			continue
		}

		let skipped = false
		for (const type of ['valid', 'invalid']) {
			for (const test of rule.tests[type]) {
				if (test === null || typeof test !== 'object' || typeof test.code !== 'string') {
					continue
				}

				if (exclusiveTestCases.length > 0 && !exclusiveTestCases.includes(test)) {
					skipped = true
					continue
				}

				try {
					tester.run(name, rule, { valid: [], invalid: [], [type]: [test] })

				} catch (error) {
					console.log('🔴 ' + chalk.bold(name))

					console.log('')
					console.log(offset(getPrettyCode(test.code), chalk.bgRed))
					console.log('')

					console.error(offset(error.message, chalk.red))
					if (error.stack) {
						console.error(offset(error.stack, chalk.red))
					}

					return false
				}
			}
		}

		console.log((skipped ? '🟡' : '✅') + ' ' + name)
	}

	console.log('')
	console.log(`Done testing ${Object.keys(rules).length} rule${Object.keys(rules).length === 1 ? '' : 's'}.`)
}

global.only = function only(testCase) {
	exclusiveTestCases.push(testCase)
	return testCase
}

function offset(text, decorateLine = line => line) {
	return text.split('\n').map(line => '   ' + decorateLine(line)).join('\n')
}

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
