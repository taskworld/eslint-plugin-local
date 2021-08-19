const Path = require('path')
const appRoot = Path.resolve(__dirname).split('/node_modules')[0]
module.exports = require(appRoot + '/.eslintplugin')
