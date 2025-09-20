const fs = require('fs');
const { paths } = require('../config/assets.config');

function ensureDirs() {
  [paths.output, paths.tmp].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  });
}

function cleanTmpDir() {
  fs.rmSync(paths.tmp, { recursive: true, force: true });
  console.log('🧹 Carpeta tmp eliminada');
}

module.exports = {
  ensureDirs,
  cleanTmpDir
};
