const cheerio = require('cheerio');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Chalk = require('chalk');

class ImageTransformPlugin {
  constructor(options){
    this.options = options;
  }
    apply(compiler){
        compiler.hooks.compilation.tap('ImageTransformPlugin', (compilation) => {
            HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync('ImageTransformPlugin', (data, cb) => {
              const $ = cheerio.load(data.html);
              $('img').each((i, el) => {
                if($(el).attr('class')?.match("auto-img")){
                  const elClass = $(el).attr('class');
                  const src = this.options.mode == 'dev' ? $(el).attr('src').replace('./assets', './dist') : $(el).attr('src').replace('/assets', '');
                  const suffix = src.match(/.[a-zA-Z]+$/ig);
                  const s2560 = src.replace(suffix, `_2x${suffix}`);
                  const s1920 = src.replace(suffix, `_x${suffix}`);
                  const s950 = src.replace(suffix, `_y${suffix}`);
                  const s450 = src.replace(suffix, `_sy${suffix}`);
                  const blur = src.replace(suffix, `_blur${suffix}`);
                  $(el).attr('data-src', blur);
                  $(el).replaceWith(`
                    <picture class="${elClass} lozad">
                      <source data-srcset="${s450}" media="(max-width: 450px)" >
                      <source data-srcset="${s950}" media="(max-width: 950px)" >
                      <source data-srcset="${s1920}" media="(max-width: 1920px)">
                      <source data-srcset="${s2560} 2x">
                      ${$(el).toString()}
                    </picture>
                  `);
                }else if($(el).attr('class')?.match("fit-img")){
                  let src = $(el).attr('src').replace('./assets', './dist');
                  const elClass = $(el).attr('class');
                  const suffix = src.match(/.[a-zA-Z]+$/ig);
                  const blur = src.replace(suffix, `_blur${suffix}`);
                  $(el).attr('src', blur);

                  const ImageName = src.match(/[^\/]+\.[a-zA-Z]+$/ig)[0];
                  const mSrc =  ImageName.replace(suffix, `_m${suffix}`);
                  $(el).replaceWith(`
                    <picture class="${elClass} lozad">
                      <source data-srcset="${mSrc}" media="(max-width: 950px)">
                      <source data-srcset="${src}">
                      ${$(el).toString()}
                    </picture>
                  `);
                } else {
                  // $(el).addClass('lozad');
                }
              })
              data.html = $.html();
              console.log(Chalk.greenBright('Img标签转换picture完成！'))
              cb(null, data);
            })
        })
    }
}

module.exports = ImageTransformPlugin;