const cheerio = require('cheerio');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Chalk = require('chalk');

class ImageTransformPlugin {
    apply(compiler){
        compiler.hooks.compilation.tap('ImageTransformPlugin', (compilation) => {
            HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync('ImageTransformPlugin', (data, cb) => {
              const $ = cheerio.load(data.html);
              $('img').each((i, el) => {
                const src = $(el).attr('src').replace('/assets', '');
                const suffix = src.match(/.[a-zA-Z]+$/ig);
                const s1920 = src.replace(suffix, `_1920${suffix},`);
                const s750 = src.replace(suffix, `_750${suffix}`);
                $(el).replaceWith(`<picture>
                  <source srcset="${s1920}" data-srcset="${s1920}" media="(min-width: 1440px)" >
                  <source srcset="${s750}" data-srcset="${s750}" media="(min-width: 950px)" >
                  <source srcset="${s1920}" data-srcset="${s1920}" >
                  <img src="${s1920}" alt="">
                </picture>`);
              })
              data.html = $.html();
              console.log(Chalk.greenBright('Img标签转换picture完成！'))
              cb(null, data);
            })
        })
    }
}

module.exports = ImageTransformPlugin;