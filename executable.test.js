const { jest, describe, it, expect } = require('@jest/globals')

describe('test', () => {
	it('calls testRunner given the supplied arguments', () => {
		const rules = {
			'rule-name': {
				create() { },
				tests: { valid: [], invalid: [] }
			}
		}
		jest.mock('./index', () => ({ rules }))
		jest.replaceProperty(process, 'argv', ['node', 'execiuatable.js', 'test', '--bail', '--silent'])
		jest.mock('./testRunner', () => jest.fn(() => 0))
		jest.spyOn(process, 'exit').mockImplementation(() => { })

		require('./executable')
		const testRunner = require('./testRunner')

		expect(testRunner).toHaveBeenCalledWith(rules, { bail: true, log: expect.any(Function), err: console.error })
		expect(process.exit).toHaveBeenCalledWith(0)
	})
})
