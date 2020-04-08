'use strict';

const [commonCjs, commonUmd] = require('./webpack.config.common');

console.log('[Webpack] Use prod configuration\n');
const common = {
  mode: 'production',
}
module.exports = [Object.assign({}, commonCjs, common), Object.assign({}, commonUmd, common)];
