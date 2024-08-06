const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.config.js');
const HotUpdatePlugin = require("./plugins/hot-update");
const ImageTransformPlugin = require("./plugins/img-transform");
const CopyWebpackPlugin = require('copy-webpack-plugin');
const LiquidTemplatePlugin = require('./plugins/liquidTemplatePlugin.js');


module.exports = merge(common, {
    mode: 'production',
    output: {
      filename: 'bundle.js',
    },
    plugins:[
        new ImageTransformPlugin({mode: 'prod'}),
        new HotUpdatePlugin({
            dir: path.resolve(__dirname, "src/assets/images"),
            output: path.resolve(__dirname, "src/dist/images/"),
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: 'src/assets/fonts', to: 'assets/fonts' }
            ]
        }),
        new LiquidTemplatePlugin({
            filename: 'template.liquid' 
        })
    ]
});