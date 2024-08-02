const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.config.js');
const HotUpdatePlugin = require("./plugins/hot-update");
const ImageTransformPlugin = require("./plugins/img-transform");


module.exports = merge(common, {
    mode: 'production',
    output: {
      filename: 'bundle.[contenthash].js',
    },
    plugins:[
        new ImageTransformPlugin(),
        new HotUpdatePlugin({
            dir: path.resolve(__dirname, "src/assets/images"),
            output: path.resolve(__dirname, "dist/images/"),
        }),
    ]
});