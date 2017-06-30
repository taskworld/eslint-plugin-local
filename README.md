# eslint-plugin-local

This ESLint plugin allows you to implement a custom ESLint plugin (including custom rules) for your project. For more information see [this issue](https://github.com/eslint/eslint/issues/8769).

Inspired by [cletusw/eslint-plugin-local-rules](https://github.com/cletusw/eslint-plugin-local-rules).

## Usage

Installation:

```
npm install --save-dev eslint-plugin-local
```

Create a custom plugin at `.eslintplugin.js` or `.eslintplugin/index.js` (refer to [ESLint’s official guide](http://eslint.org/docs/developer-guide/working-with-plugins)):

```js
exports.rules = {
  'thou-shalt-use-only-string-literals-in-l10n-functions': {
    create: function (context) {
      return { ... }
    }
  }
}
```

Add the plugin:

```yml
plugins:
  - local
rules:
  - local/thou-shalt-use-only-string-literals-in-l10n-functions: error
```

