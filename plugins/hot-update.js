const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const Chalk = require('chalk');
const cheerio = require('cheerio');
var _ = require('lodash');

const pcRadio = {
  // '4k': 3840 / 2048,
  '2560': 1,
  '1920': 1920 / 2560,
  // '1280': 1280 / 2560,
  '100': 100 / 2560
}
const mbRadio = {
  '750': 1,
  '450': 450 / 750
}
const unit = {
  '2560': '_2x',
  '1920': '_x',
  // '1280': '_sx',
  '100': '_blur',
  '750': '_y',
  '450': '_sy'
}

class HotUpdatePlugin {
  constructor(options) {
    this.options = options;
    this.ImageMap = [];
    this.deleteMap = [];
    this.addMap = [];
    this.elementQuoteMap = [];
  }
  async apply(compiler) {
    compiler.hooks.emit.tap('HotUpdatePlugin', (compilation) => {
      this.$ = cheerio.load(compilation.assets['index.html'].source());
      this.imagePathsArray = this.getAllImages();
      this.searchCatalog();
    });
  }

  async createImageLoop(){
    const outputDir = this.options.output;

    for(let [index, imagePath] of this.addMap.entries()){
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      if(imagePath.startsWith(path.join(this.options.dir, 'mobile'))){
        await this.generateImg({imagePath, outputDir}, {quality: 90}, 'jpg', true);
      }else{
        await this.generateImg({imagePath, outputDir}, {quality: 90}, 'jpg', false);
      }
    }
  }

  async generateImg(params, options, suffix, isPhone) {
    const {imagePath, outputDir} = params;

    try{
      const metaData = await sharp(imagePath).metadata();
      const basename = path.basename(imagePath, path.extname(imagePath));
      const {width, height} = metaData;

      if(await this.fitImageCreate(basename, imagePath, outputDir, isPhone, metaData)) return;

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

  async fitImageCreate(basename, imagePath, outputDir, isPhone, metaData){
    let quoteStatus = this.elementQuoteMap.findIndex(v => v[1].replace('_blur', "").includes(path.basename(imagePath))); //新添加的图片是否在html中引用了
    if(quoteStatus > -1){
      let classN = this.elementQuoteMap[quoteStatus][0];
      if(classN.includes('auto-img')){
        this.ImageMap.push(imagePath);
        return false;
      }else if(classN.includes('fit-img')){
        this.ImageMap.push(imagePath);
        if(isPhone){
          await sharp(imagePath)
          .toFile(path.join(outputDir, basename + "_m"+ path.extname(imagePath)))
          .catch(err => console.error(err));
        }else{
          await sharp(imagePath)
          .toFile(path.join(outputDir, path.basename(imagePath)))
          .catch(err => console.error(err));
          await sharp(imagePath)
          .resize({ width: Math.round(metaData.width * 0.039), height:  Math.round(metaData.height * 0.039) }) 
          .toFile(path.join(outputDir, basename + "_blur" + path.extname(imagePath)))
        }
        return true;
      }else{
        this.ImageMap.push(imagePath)
        await sharp(imagePath)
        .toFile(path.join(outputDir, path.basename(imagePath)))
        .catch(err => console.error(err));
        return true;
      }
    }
    return true;
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
      this.originMap = data.split('\n');
      this.ImageMap = [...this.originMap];
      this.deleteMap = this.ImageMap.filter(x => !this.imagePathsArray.includes(x));
      this.addMap = _.difference(this.imagePathsArray, this.ImageMap);
      this.$('img').each((i, el)=>{
        this.elementQuoteMap.push([this.$(el).prop('class'), this.$(el).prop('src')]);
      })
      this.elementQuoteMap = _.uniqWith(this.elementQuoteMap, _.isEqual);
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

  async updateTextMap(method){
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
      await this.createImageLoop();
      this.ImageMap = _.compact(this.ImageMap);
      
      !_.isEqual(this.ImageMap, this.originMap) && this.writeTextMap(this.ImageMap);
    }
  }
}

module.exports = HotUpdatePlugin;