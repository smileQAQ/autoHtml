const { merge } = require('webpack-merge');
const common = require('./webpack.config.js');

module.exports = merge(common, {
  mode: 'development',
  devServer: {
    static: "./src",
    client: {
      progress: true,
    },
    hot: true,
    port: 9000,
  },
});