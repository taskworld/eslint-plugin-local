This ESLint plugin allows you to implement a custom ESLint plugin including custom rules in your repository without installing them as a dependency.

Originally inspired by [cletusw/eslint-plugin-local-rules](https://github.com/cletusw/eslint-plugin-local-rules).

## Installation

```sh
npm install --save-dev eslint-plugin-local
```

## Usage

The JavaScript file named _eslint.local.js_ or _eslint-plugin-local.js_ or _.eslint-plugin-local/index.js_ must be created at the root of your repository, which the file has the content of an [ESLint plugin](https://eslint.org/docs/latest/extend/plugins). The extension _.cjs_ can be used in place of _.js_ in case ES module is not supported. For example:

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

Then add the plugin to your _eslint.config.js_ file:

```js
const local = require('eslint-plugin-local')

module.exports = [{
  plugins: {
    local
  },
  rules: {
    'local/sample': 'error'
  }
}]
```

Additionally, this package provides `eslint-plugin-local test` command out of the box, which it scans for `tests: { valid: [], invalid: [] }` field in each rule and runs [`RuleTester`](https://eslint.org/docs/latest/extend/custom-rules#rule-unit-tests) internally.

To make it easy to debug your test cases, wrap one or more test objects inside the global `only()` function. Given the example below, **only the first test case and every invalid case** will be run.

```js
module.exports = {
  rules: {
    sample: {
      tests: {
        valid: [
          only({
            code: 'var foo = 1',
          }),
          {
            code: 'var foo = 2',
          }
        ],
        invalid: only([...]),
      }
    }
  }
}
```