import type * as ESLint from 'eslint'

export type Plugin = Omit<ESLint.ESLint.Plugin, 'rules'> & {
	rules: Record<string, Rule>
}

export interface Rule extends ESLint.Rule.RuleModule {
	tests?: Parameters<ESLint.RuleTester['run']>['2']
}

export type TestCase = ESLint.RuleTester.ValidTestCase | ESLint.RuleTester.InvalidTestCase

export type Node = ESLint.Rule.Node
