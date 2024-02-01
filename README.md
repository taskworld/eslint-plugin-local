This ESLint plugin allows you to implement a custom ESLint plugin including custom rules in your repository without installing them as a dependency.

Originally inspired by [cletusw/eslint-plugin-local-rules](https://github.com/cletusw/eslint-plugin-local-rules).

## Installation

```sh
npm install --save-dev eslint-plugin-local
```

## Usage

The JavaScript file named _.eslint-plugin-local.js_ or _.eslint-plugin-local/index.js_ or use _.cjs_ file extension must be created at the root of your repository, which the file has the content of an [ESLint plugin](https://eslint.org/docs/latest/extend/plugins). For example:

```js
module.exports = {
  rules: {
    sample: {
      // Optional
      meta: {
        // See https://eslint.org/docs/latest/extend/custom-rules#rule-structure
      },

      // Mandatory
      create: function (context) {
        // Implementation goes here
        // See https://eslint.org/docs/latest/extend/custom-rules
      },

      // Optional
      // Unit test can be triggered by `eslint-plugin-local test` command
      // See https://eslint.org/docs/latest/integrate/nodejs-api#ruletester
      tests: {
        valid: [...],
        invalid: [...],
      }
    }
  }
}
```

Then apply the plugin to your _.eslintrc_ file:

```yml
plugins:
  - local
rules:
  - local/sample: error
```

Additionally, this package provides `eslint-plugin-local test` command out of the box, which it scans for `tests: { valid: [], invalid: [] }` field in each rule and runs [`RuleTester`](https://eslint.org/docs/latest/extend/custom-rules#rule-unit-tests) internally.
