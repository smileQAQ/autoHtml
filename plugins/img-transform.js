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
                  const src = this.options.mode == 'dev' ? $(el).attr('src').replace('./assets', './dist') : $(el).attr('src').replace('/assets', '');
                  const suffix = src.match(/.[a-zA-Z]+$/ig);
                  const s2560 = src.replace(suffix, `_2x${suffix}`);
                  const s1920 = src.replace(suffix, `_x${suffix}`);
                  const s950 = src.replace(suffix, `_y${suffix}`);
                  const s450 = src.replace(suffix, `_yy${suffix}`);
                  $(el).replaceWith(`
                    <div class='auto-img'>
                      <picture>
                        <source srcset="${s450}" data-srcset="${s450}" media="(max-width: 450px)" >
                        <source srcset="${s950}" data-srcset="${s950}" media="(max-width: 950px)" >
                        <source srcset="${s1920}" data-srcset="${s1920}" media="(max-width: 1920px)">
                        <source srcset="${s2560}" data-srcset="${s2560}">
                        <img class="lozad" src="${s1920}" alt="" />
                      </picture>
                    </div>
                  `);
                }else if($(el).attr('class')?.match("fit-img")){
                  const elClass = $(el).attr('class');
                  let src =  $(el).attr('src');
                  $(el).addClass('lozad');
                  $(el).removeClass('fit-img');

                  if(this.options.mode == 'dev'){
                    const mSrc = src.replace("images/", `images/mobile/`);
                    $(el).replaceWith(`
                      <picture class="${elClass}">
                        <source srcset="${mSrc}" data-srcset="${mSrc}" media="(max-width: 950px)" >
                        ${$(el).toString()}
                      </picture>
                    `);
                  }else{
                    const ImageName = src.match(/[^\/]+\.[a-zA-Z]+$/ig)[0];
                    const suffix = ImageName.match(/.[a-zA-Z]+$/ig);
                    const mSrc =  ImageName.replace(suffix, `_m${suffix}`);
                    $(el).replaceWith(`
                      <picture class="${elClass}">
                        <source srcset="${mSrc}" data-srcset="${mSrc}" media="(max-width: 950px)" >
                        ${$(el).toString()}
                      </picture>
                    `);
                  }
                } else {
                  $(el).addClass('lozad');
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