const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.config.js');
const ImageTransformPlugin = require('./plugins/img-transform.js');
const HotUpdatePlugin = require("./plugins/hot-update");

const config = merge(common, {
  mode: 'development',
  devServer: {
    static: "./src",
    client: {
      progress: true,
    },
    hot: true,
    port: 9000,
  },
  plugins:[
    new ImageTransformPlugin({mode: 'dev'}),
    new HotUpdatePlugin({
      dir: path.resolve(__dirname, "src/assets/images"),
      output: path.resolve(__dirname, "src/dist/images/"),
    }),
  ]
});

module.exports = config;
