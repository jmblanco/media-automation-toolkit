const path = require('path');
const { paths, firstVideos, lastVideos } = require('./config/assets.config');
const { ensureDirs, cleanTmpDir } = require('./tools/fs.tools');
const { createVideoList, createVideoWithVideos } = require('./tools/media.tools');

async function main() {
  try {
    ensureDirs();

    const videoList = createVideoList(paths.videos, firstVideos, lastVideos);
    if (!videoList.length) {
      console.warn('⚠️ No se encontraron vídeos para procesar en:', paths.videos);
      return;
    }

    const orderedInputPaths = videoList.map((v) => v.inputPath);
    const outputPath = path.join(paths.output, 'montaje_final.mp4');

    console.log(`🎬 Iniciando montaje de ${orderedInputPaths.length} clips...`);

    await createVideoWithVideos(orderedInputPaths, outputPath, ({ percent, message }) => {
      if (percent !== undefined) {
        process.stdout.write(`\r⏳ [${percent}%] ${message}`);
      }
    });

    console.log('\n🎉 ¡Montaje final generado con éxito en:', outputPath);
  } catch (err) {
    console.error('\n💥 Error durante la creación del vídeo:', err.message);
    process.exitCode = 1;
  } finally {
    cleanTmpDir();
  }
}

main();
