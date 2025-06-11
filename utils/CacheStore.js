const fs = require('fs');
const path = require('path');
const { cacheFile } = require('../config');

function save(data) {
  fs.writeFileSync(cacheFile, JSON.stringify(data, null, 2));
}

function load() {
  try {
    const content = fs.readFileSync(cacheFile);
    return JSON.parse(content);
  } catch (e) {
    console.log(e)
    return null;
  }
}

module.exports = { save, load };