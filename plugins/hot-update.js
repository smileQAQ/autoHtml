const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const Chalk = require('chalk');
const cheerio = require('cheerio');

const pcRadio = {
  // '4k': 3840 / 2048,
  '2560': 1,
  '1920': 1920 / 2560,
  '1280': 1280 / 2560,
}
const mbRadio = {
  '750': 1,
  '450': 450 / 750
}
const unit = {
  '2560': '_2x',
  '1920': '_x',
  '1280': '_sx',
  '750': '_y',
  '450': '_yy'
}

class HotUpdatePlugin {
  constructor(options) {
    this.options = options;
    this.ImageMap = [];
    this.deleteMap = [];
    this.addMap = [];
  }
  async apply(compiler) {
    compiler.hooks.emit.tap('HotUpdatePlugin', (compilation) => {
      this.$ = cheerio.load(compilation.assets['index.html'].source());
      this.imagePathsArray = this.getAllImages();
      this.searchCatalog();
    });
  }

  createImageLoop(){
    const outputDir = this.options.output;
    this.addMap.forEach(imagePath => {
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      if(imagePath.startsWith(path.join(this.options.dir, 'mobile'))){
        this.generateImg({imagePath, outputDir}, {quality: 90}, 'jpg', true);
      }else{
        this.generateImg({imagePath, outputDir}, {quality: 90}, 'jpg', false);
      }
    });
  }

  async generateImg(params, options, suffix, isPhone) {
    const {imagePath, outputDir} = params;

    try{
      const metaData = await sharp(imagePath).metadata();
      const basename = path.basename(imagePath, path.extname(imagePath));
      const {width, height} = metaData;

      if(this.fitImageCreate(basename, imagePath, outputDir, isPhone)) return;

      if(isPhone){
        for(const [key, ratio] of Object.entries(mbRadio)){
          const newWidth = Math.round(width * ratio);
          const newHeight = Math.round(height * ratio);

          sharp(imagePath)
          .resize({ width: newWidth, height: newHeight }) 
          .jpeg(options)
          .toFile(path.join(outputDir, path.basename(imagePath, path.extname(imagePath)) + unit[key] + path.extname(imagePath)))
          .catch(err => console.error(err));
          console.log(`生成${basename + unit[key]}图片成功`);
        }
      }else{
        for(const [key, ratio] of Object.entries(pcRadio)){
          const newWidth = Math.round(width * ratio);
          const newHeight = Math.round(height * ratio);

          sharp(imagePath)
          .resize({ width: newWidth, height: newHeight }) 
          .jpeg(options)
          .toFile(path.join(outputDir,basename + unit[key] + path.extname(imagePath)))
          .catch(err => console.error(err));
          console.log(`生成${basename + unit[key]}图片成功`);
        }
      }
    }catch(err){
      console.log(Chalk.red(err))
    }
  }

  fitImageCreate(basename, imagePath, outputDir, isPhone){
    let stat = false;
    this.$('img').each((i, el)=>{
      if(!this.$(el).prop('src').includes(basename)) return true;

      const ParentTagName = this.$(el).parent().prop('tagName').toLowerCase();
      const ParentClass = this.$(el).parent().prop('class');

      if(ParentTagName  == 'picture' && ParentClass.includes('auto-img')){
        return false;
      }else if(ParentTagName  == 'picture' && ParentClass.includes('fit-img')){
        if(isPhone){
          sharp(imagePath)
          .toFile(path.join(outputDir, basename + "_m"+ path.extname(imagePath)))
          .catch(err => console.error(err));
        }else{
          sharp(imagePath)
          .toFile(path.join(outputDir, basename + path.extname(imagePath)))
          .catch(err => console.error(err));
        }
        stat = true;
        return false;
      }else{
        sharp(imagePath)
        .toFile(path.join(outputDir, basename + path.extname(imagePath)))
        .catch(err => console.error(err));
        stat = true
        return false;
      }
    })
    return stat;
  }

  getAllImages(dir = this.options.dir){
    const files = fs.readdirSync(dir);
    let images = [];

    files.map((file)=>{
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        images = images.concat(this.getAllImages(filePath));
      }else if (stats.isFile() && /\.(png|jpe?g|gif)$/i.test(file)) {
        images.push(filePath);
      }
    })

    return images;
  }

  searchCatalog() {
    fs.readFile('imageMap.txt', 'utf8', (err, data) => {
      if (err) {
        this.writeTextMap(this.imagePathsArray);
        return
      }

      this.ImageMap = data.split('\n');
      this.deleteMap = this.ImageMap.filter(x => !this.imagePathsArray.includes(x));
      this.addMap = this.imagePathsArray.filter(x => !this.ImageMap.includes(x));
      this.deleteMap.length && this.updateTextMap('delete');
      this.addMap.length && this.updateTextMap('addition');
    })
  }
  writeTextMap(data){
    fs.writeFile('imageMap.txt', data.join('\n'), 'utf8',  (err) => {
      if (err) {
        console.error('写入文件时出错:', err);
      } else {
        console.log('文件写入成功');
      }
    })
  }

  updateTextMap(method){
    if(method === 'delete'){
      fs.readdir(this.options.output, (err, files) => {
        this.deleteMap.map(v => {
          if(v === '') return;
          const fileName = v.match(/[\w-]+\.(jpg|png)$/ig)[0];
          const name = fileName?.split('.')[0];
          const filesToDelete = files.filter(file => file.includes(name));

          filesToDelete.forEach(file => {
            const filePath = path.join(this.options.output, file);
    
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error(`删除文件 ${file} 时出错:`, err);
                } else {
                    console.log(`文件 ${file} 删除成功`);
                }
            });
          });

          const filteredLines = this.ImageMap.filter(line => !line.includes(name));
          this.writeTextMap(filteredLines);
        })
      })
    }else if(method === 'addition'){
      let textData = this.ImageMap.concat(this.addMap);
      this.writeTextMap(textData);
      this.createImageLoop();
    }
  }
}

module.exports = HotUpdatePlugin;