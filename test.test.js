const { jest, afterEach, afterAll, it, expect } = require('@jest/globals')

jest.mock('chalk', () => ({
	bold: (text) => text,
	red: (text) => text,
	bgRed: (text) => text,
}))

jest.spyOn(console, 'log').mockImplementation(() => { })
jest.spyOn(console, 'error').mockImplementation(() => { })

afterEach(() => {
	jest.clearAllMocks()
})

afterAll(() => {
	jest.restoreAllMocks()
})

const test = require('./test')

it('does not return false, given no failing test case', () => {
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

	expect(test(rules)).not.toBe(false)
	expect(console.log).toHaveBeenCalledWith(expect.stringMatching(/Done testing 1 rule/))
	expect(console.error).not.toHaveBeenCalled()
})

it('returns false, given a failing test case', () => {
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

	expect(test(rules)).toBe(false)
	expect(console.log).toHaveBeenCalledWith('🔴 foo')
	expect(console.error).toHaveBeenCalledWith(expect.stringMatching(/Should have no errors but had 1/))
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

	expect(test(rules)).not.toBe(false)
	expect(console.error).not.toHaveBeenCalled()
	expect(rules.foo.create).toHaveBeenCalled()
	expect(rules.loo.create).not.toHaveBeenCalled()
})
