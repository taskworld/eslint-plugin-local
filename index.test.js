const fs = require('fs')
const path = require('path')
const { jest, afterEach, it, expect } = require('@jest/globals')

jest.mock('@thisismanta/pessimist', () => ({ parseArguments: () => ({}) }))

afterEach(() => {
	jest.resetModules()

	for (const item of [
		'.eslint.local.js',
		'.eslint.local.cjs',
		'.eslint-plugin-local.js',
		'.eslint-plugin-local.cjs',
		'.eslint-plugin-local',
		'.eslint-plugin-local/index.js',
		'.eslint-plugin-local/index.cjs',
	]) {
		if (fs.existsSync(item)) {
			fs.rmSync(item, { recursive: true })
		}
	}
})

it('throws when ".eslint-plugin-local" is missing', () => {
	expect(() => {
		require('./index')
	}).toThrow(/\.eslint-plugin-local/)
})

it('throws when ".eslint-plugin-local/index" is missing', () => {
	fs.mkdirSync('.eslint-plugin-local')

	expect(() => {
		require('./index')
	}).toThrow(/\.eslint-plugin-local/)
})

it('exports meta', () => {
	fs.writeFileSync('.eslint-plugin-local.js', 'module.exports = {}')

	const { meta } = require('./index')

	expect(meta).toMatchObject({
		name: 'eslint-plugin-local',
		version: expect.stringMatching(/\d+\.\d+\.\d+/),
	})
})

it.each([
	['.eslint.local.js'],
	['.eslint.local.cjs'],
	['.eslint-plugin-local.js'],
	['.eslint-plugin-local.cjs'],
])('exports "%s"', (item) => {
	fs.writeFileSync(item, 'module.exports = { data: 123 }')

	const { data } = require('./index')

	expect(data).toBe(123)
})

it.each([
	['.eslint-plugin-local/index.js'],
	['.eslint-plugin-local/index.cjs'],
])('exports "%s"', (item) => {
	fs.mkdirSync(path.dirname(item))
	fs.writeFileSync(item, 'module.exports = { data: 123 }')

	const { data } = require('./index')

	expect(data).toBe(123)
})
