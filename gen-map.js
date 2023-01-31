// nodejs
const fs = require('fs');
const path = require('path');
// 1. list all json names in ./lib-json exclude map.json
const dir = './lib-json';
const files = fs.readdirSync(dir);
const jsons = files.filter((file) => {
    return file !== 'map.json' && path.extname(file) === '.json';
})
// 2. put all json names into map.json
const map = []
jsons.forEach((json) => {
    map.push(json);
})
fs.writeFileSync('./lib-json/map.json', JSON.stringify(map, null, 4));