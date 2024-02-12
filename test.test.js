const { jest, afterEach, afterAll, it, expect } = require('@jest/globals')

jest.mock('chalk', () => ({
	bold: (text) => text,
	red: (text) => text,
	bgRed: (text) => text,
	bgGreen: (text) => text,
	bgHex: () => (text) => text,
}))

afterEach(() => {
	jest.clearAllMocks()
})

afterAll(() => {
	jest.restoreAllMocks()
})

const test = require('./test')

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
	const errorCount = test(rules, { log, err })

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
	const errorCount = test(rules, { log, err })

	expect(errorCount).toBe(1)
	expect(log.mock.calls.join('\n')).toMatchInlineSnapshot(`""`)
	expect(err.mock.calls.join('\n')).toMatchInlineSnapshot(`
"🔴 foo

   void(0)

   Should have no errors but had 1: [
     {
       ruleId: 'foo',
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
	const errorCount = test(rules, { log, err })

	expect(errorCount).toBe(0)
	expect(rules.foo.create).toHaveBeenCalled()
	expect(rules.loo.create).not.toHaveBeenCalled()
	expect(log.mock.calls.join('\n')).toMatchInlineSnapshot(`
"🟡 foo
⏩ loo

 PASS  1
 SKIP  3"
`)
})
