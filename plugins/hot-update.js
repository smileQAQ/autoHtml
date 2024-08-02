const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const Chalk = require('chalk');

class HotUpdatePlugin {
  constructor(options) {
    this.options = options;
    this.imagePathsArray = this.getAllImages();
  }
  async apply(compiler) {
    compiler.hooks.emit.tapAsync('HotUpdatePlugin', (compilation, cb) => {
      const outputDir = this.options.output;
      this.imagePathsArray.forEach(imagePath => {
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
      
        sharp(imagePath)
          .resize({ width: 1920 }) // 更改为你想要的尺寸
          .jpeg({
            quality: 80,
          })
          .toFile(path.join(outputDir, path.basename(imagePath, path.extname(imagePath)) + '_1920' + path.extname(imagePath)))
          .catch(err => console.error(err));

        sharp(imagePath)
          .resize({ width: 2560 }) // 更改为你想要的尺寸
          .webp({
            quality: 100,
            smartSubsample: true
          })
          .toFile(path.join(outputDir, path.basename(imagePath, path.extname(imagePath)) + '_1920' + '.webp'))
          .catch(err => console.error(err));
      });
      console.log(Chalk.greenBright('图片生成完成！'));
      cb();
    });
  }


  getAllImages(){
    const {dir} = this.options;
    const files = fs.readdirSync(dir);
    const images = files.map((file)=>{
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        return getAllImages(filePath);
      }else if (stats.isFile() && /\.(png|jpe?g|gif)$/i.test(file)) {
        return filePath;
      } else {
        return null;
      }
    })
    return images.filter((image) => image !== null);
  }
}

module.exports = HotUpdatePlugin;