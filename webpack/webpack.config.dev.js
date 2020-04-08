'use strict';

const [commonCjs, commonUmd] = require('./webpack.config.common');

console.log('[Webpack] Use dev configuration\n');

const common = {
  mode: 'development',
  devtool: '#source-map',
}
module.exports = [Object.assign({}, commonCjs, common),
Object.assign({}, commonUmd, common)];
