const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const sj = require('../shoplazzaImage.json');
require('dotenv').config()

class LiquidTemplatePlugin {
    constructor(options) {
        this.options = options;
    }

    apply(compiler) {
        compiler.hooks.emit.tapAsync('LiquidTemplatePlugin', (compilation, callback) => {
            const assets = compilation.assets;
            const output = {};
            let schema;
            
            for(const assetName in assets){
                if (assetName.endsWith('.css') || assetName.endsWith('.html') || assetName.endsWith('.js')) {
                    const assetSource = assets[assetName].source();
                    output[assetName] = assetSource;
                }
            }
            const $ = cheerio.load(output['index.html']);
            if(this.options.type == 'shoplazza'){
                $('picture').each((i, el) => {
                    $(el).children().each((j, child) => {
                        const tagName = $(child).prop('tagName').toLowerCase();
                        if(tagName == 'source'){
                            let m_imgName = $(child).attr('srcset').split('/').pop();
                            sj[m_imgName] && $(child).attr('data-srcset', sj[m_imgName]);
                            sj[m_imgName] && $(child).attr('srcset', sj[m_imgName]);
                        }else if(tagName == 'img'){
                            let imgName = $(child).attr('src').split('/').pop();
                            sj[imgName] && $(child).attr('src', sj[imgName]);
                        }
                    })
                })
                $('img').each((i, el)=>{
                    const tagName = $(el).parent().prop('tagName').toLowerCase();
                    if(tagName != 'picture'){
                        let imgName = $(el).attr('src').split('/').pop();
                        sj[imgName] && $(el).attr('src', sj[imgName]);
                    }
                })
                schema = `
                    {% schema %}
                        {
                            "name": "${process.env.LIQUID_NAME}",
                            "settings": [],
                            "presets": [
                                {
                                    "name": "${process.env.LIQUID_NAME}",
                                    "cname": {
                                    "en-US": "Cart",
                                    "zh-CN": "卡片"
                                    },
                                    "category": {
                                    "en-US": "Page",
                                    "zh-CN": "页面"
                                    },
                                    "ccategory": {
                                    "en-US": "Page",
                                    "zh-CN": "页面"
                                    },
                                    "display": true,
                                    "blocks": []
                                }
                            ]
                        }
                        {% endschema %}
                `;
            }else{
                $('picture').each((i, el) => {
                    $(el).children().each((j, child) => {
                        const tagName = $(child).prop('tagName').toLowerCase();
                        if(tagName == 'source'){
                            let ImageName = $(child).attr('srcset').split('/').pop();
                            $(child).attr('srcset', process.env.CDN_IMAGE_URL + ImageName)
                            $(child).attr('data-srcset', process.env.CDN_IMAGE_URL + ImageName);
                        }else if(tagName == 'img'){
                            let imgName = $(child).attr('src').split('/').pop();
                            $(child).attr('src', process.env.CDN_IMAGE_URL + imgName);
                        }
                    })
                })
                $('img').each((i, child)=>{
                    const tagName = $(child).parent().prop('tagName').toLowerCase();
                    if(tagName != 'picture'){
                        let imgName = $(child).attr('src').split('/').pop();
                        $(child).attr('src', process.env.CDN_IMAGE_URL + imgName);
                    }
                })
                schema = `
                    {% schema %}
                        {
                            "name": "${process.env.LIQUID_NAME}",
                            "settings": [],
                            "presets": [
                                {
                                    "name": "${process.env.LIQUID_NAME}"
                                }
                            ]
                        }
                    {% endschema %}
                `
            }

            let content = `
                <style>${output['main.css']}</style>
                ${$('body').html()}
                <script>${output['bundle.js']} </script>
                ${schema}
            `
            const outputPath = path.resolve(compiler.options.output.path, this.options.filename);
            fs.writeFile(outputPath, content, (err) => {
                if (err) throw err;
                callback();
            });
        });
    }
}

module.exports = LiquidTemplatePlugin;
