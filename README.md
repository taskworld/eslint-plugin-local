This ESLint plugin allows you to implement a custom ESLint plugin including custom rules in your repository without installing them as a dependency.

Originally inspired by [cletusw/eslint-plugin-local-rules](https://github.com/cletusw/eslint-plugin-local-rules).

## Installation

```sh
npm install --save-dev eslint-plugin-local
```

## Usage

Create a new file at _.eslint-plugin-local.js_ or _.eslint-plugin-local/index.js_ or use _.cjs_ file extension, which has the content of an [ESLint plugin](https://eslint.org/docs/latest/extend/plugins). For example:

```js
module.exports = {
  rules: {
    sample: {
      create: function (context) {
        // Implementation goes here
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

