const { jest, afterEach, afterAll, it, expect } = require('@jest/globals')

jest.mock('chalk', () => ({
	red: (text) => text,
	bgRed: (text) => text,
	bgGreen: (text) => text,
	hex: () => (text) => text,
	bgHex: () => (text) => text,
	white: {
		bold: (text) => text
	}
}))

afterEach(() => {
	jest.clearAllMocks()
})

afterAll(() => {
	jest.restoreAllMocks()
})

const testRunner = require('./testRunner')

it('returns zero errors, given no failing test case', () => {
	const rules = {
		foo: {
			create(context) {
				return {
					Program(node) {
						if (node.body.length > 0) {
							context.report({
								node,
								message: 'bar'
							})
						}
					}
				}
			},
			tests: {
				valid: [{ code: '' }],
				invalid: [{ code: 'void(0)', errors: [{ message: 'bar' }] }],
			}
		}
	}

	const log = jest.fn()
	const err = jest.fn()
	const errorCount = testRunner(rules, { log, err })

	expect(errorCount).toBe(0)
	expect(log.mock.calls.join('\n')).toMatchInlineSnapshot(`
"🟢 foo

 PASS  2"
`)
	expect(err).not.toHaveBeenCalled()
})

it('returns non-zero errors, given any failing test case', () => {
	const rules = {
		foo: {
			create(context) {
				return {
					Program(node) {
						if (node.body.length > 0) {
							context.report({
								node,
								message: 'bar'
							})
						}
					}
				}
			},
			tests: {
				valid: [{ code: 'void(0)' }],
				invalid: [{ code: '', errors: [{ message: 'bar' }] }],
			}
		}
	}

	const log = jest.fn()
	const err = jest.fn()
	const errorCount = testRunner(rules, { log, err })

	expect(errorCount).toBe(2)
	expect(log.mock.calls.join('\n')).toMatchInlineSnapshot(`
"🔴 foo
 1 void(0)

 1 

 PASS  0
 FAIL  2"
`)
	expect(err.mock.calls.join('\n')).toMatchInlineSnapshot(`
"   Should have no errors but had 1: [
     {
       ruleId: 'rule-to-test/foo',
       severity: 1,
       message: 'bar',
       line: 1,
       column: 1,
       nodeType: 'Program',
       endLine: 1,
       endColumn: 8
     }
   ] (1 strictEqual 0)
   Should have 1 error but had 0: [] (0 strictEqual 1)"
`)
})

it('returns at most one error, given bailing out', () => {
	const rules = {
		foo: {
			create(context) {
				return {
					Program(node) {
						if (node.body.length > 0) {
							context.report({
								node,
								message: 'bar'
							})
						}
					}
				}
			},
			tests: {
				valid: [{ code: 'void(0)' }],
				invalid: [{ code: '', errors: [{ message: 'bar' }] }],
			}
		}
	}

	const log = jest.fn()
	const err = jest.fn()
	const errorCount = testRunner(rules, { bail: true, log, err })

	expect(errorCount).toBe(1)
	expect(log.mock.calls.join('\n')).toMatchInlineSnapshot(`
"🔴 foo
 1 void(0)"
`)
	expect(err.mock.calls.join('\n')).toMatchInlineSnapshot(`
"   Should have no errors but had 1: [
     {
       ruleId: 'rule-to-test/foo',
       severity: 1,
       message: 'bar',
       line: 1,
       column: 1,
       nodeType: 'Program',
       endLine: 1,
       endColumn: 8
     }
   ] (1 strictEqual 0)"
`)
})

it('runs only the test case wrapped with `only` function', () => {
	const rules = {
		foo: {
			create: jest.fn((context) => {
				return {
					Program(node) {
						if (node.body.length > 0) {
							context.report({
								node,
								message: 'bar'
							})
						}
					}
				}
			}),
			tests: {
				valid: [only({ code: '' }), { code: 'void(0)' }],
				invalid: [],
			}
		},
		loo: {
			create: jest.fn(),
			tests: {
				valid: [{ code: '' }, { code: 'void(0)' }],
				invalid: [],
			}
		}
	}

	const log = jest.fn()
	const err = jest.fn()
	const errorCount = testRunner(rules, { log, err })

	expect(errorCount).toBe(0)
	expect(rules.foo.create).toHaveBeenCalled()
	expect(rules.loo.create).not.toHaveBeenCalled()
	expect(log.mock.calls.join('\n')).toMatchInlineSnapshot(`
"⏩ loo
🟡 foo

 SKIP  3
 PASS  1"
`)
})

it('supports string in valid test cases', () => {
	const rules = {
		foo: {
			create(context) {
				return {
					Program(node) {
						if (node.body.length > 0) {
							context.report({
								node,
								message: 'bar'
							})
						}
					}
				}
			},
			tests: {
				valid: [
					'',
					{ code: '' }
				],
			}
		}
	}

	const log = jest.fn()
	const err = jest.fn()
	const errorCount = testRunner(rules, { log, err })

	expect(errorCount).toBe(0)
	expect(log.mock.calls.join('\n')).toMatchInlineSnapshot(`
"🟢 foo

 PASS  2"
`)
	expect(err).not.toHaveBeenCalled()
})
