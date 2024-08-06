const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

class LiquidTemplatePlugin {
    constructor(options) {
        this.options = options;
    }

    apply(compiler) {
        compiler.hooks.emit.tapAsync('LiquidTemplatePlugin', (compilation, callback) => {
            const assets = compilation.assets;
            const output = {};

            for(const assetName in assets){
                if (assetName.endsWith('.css') || assetName.endsWith('.html') || assetName.endsWith('.js')) {
                    const assetSource = assets[assetName].source();
                    output[assetName] = assetSource;
                }
            }
            console.log(output)

            const $ = cheerio.load(output['index.html']);
            let content;
            content = `
                <style>${output['main.css']}</style>
                ${$('body').html()}
                <script>${output['main.js']}</script>
                {% schema %}
                {
                    "name": "template",
                    "settings": [],
                    "presets": [
                        {
                            "name": "template"
                        }
                    ]
                }
                {% endschema %}
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
