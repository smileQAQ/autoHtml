
const axios = require('axios');
const fs = require('fs');
require('dotenv').config();
const args = process.argv.slice(2); 
function handle (name) {
    axios.request({
        method: 'get',
        maxBodyLength: Infinity,
        url: 'https://creality.myshoplaza.com/admin/api/file/groups/list',
        headers: { 
          'cookie': process.env.SHOPLAZAA_AUTH_COOKIE
        }
      })
    .then((response) => {
      let menuData = response.data.data;
      let target = menuData.filter(v => v.name == name);
      loadIamge(target[0])
    })
    .catch((error) => {
      console.log(error);
    });
}

function loadIamge(target){
    axios.request({
        method: 'get',
        maxBodyLength: Infinity,
        url: `https://creality.myshoplaza.com/admin/api/file/list?group_id=${target.id}&page=1&folder=upload,url_upload,cloudflare_video,canva&limit=200`,
        headers: { 
          'cookie': process.env.SHOPLAZAA_AUTH_COOKIE
        }
      })
    .then((response) => {
      let shoplazzaJSON = {};
      response.data.data.map(v=>{
        shoplazzaJSON[v.filename] = v.url
      })
      const jsonData = JSON.stringify(shoplazzaJSON, null, 2); // 第二个参数用于格式化输出
      fs.writeFile('shoplazzaImage.json', jsonData, (err) => {
          if (err) {
              console.error('保存文件时发生错误:', err);
          } else {
              console.log('文件已成功保存为 shoplazzaImage.json');
          }
      });
    })
    .catch((error) => {
      console.log(error);
    });
    
}

handle(args[0])