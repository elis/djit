'use strict';

const path = require('path');
const base = {
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      }
    ]
  }
}

const cjs = {
  entry: {
    djit: path.resolve('./src/index.js')
  },
  output: {
    libraryTarget: 'commonjs2',
    filename: '[name].js',
    path: path.resolve('./cjs')
  },
}
const umd = {
  entry: {
    djit: path.resolve('./src/index.js')
  },
  output: {
    libraryTarget: 'umd',
    filename: '[name].js',
    path: path.resolve('./umd')
  }
}
module.exports = [Object.assign({}, base, cjs), Object.assign({}, base, umd)];
