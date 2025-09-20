const path = require('path');
const {
    paths,
    firstVideos,
    lastVideos
} = require('./config/assets.config');

const { ensureDirs, cleanTmpDir } = require('./tools/fs.tools');
const {
    createVideoList,
    createVideoWithVideos
} = require('./tools/media.tools');

// === Preparar carpetas necesarias ===
ensureDirs();

// === Generar lista ordenada de vídeos ===
const videoList = createVideoList(paths.videos, firstVideos, lastVideos);

if (!videoList.length) {
    console.warn('⚠️ No se encontraron videos para procesar en', paths.videos);
    process.exit(0);
}

const orderedInputPaths = videoList.map(v => v.inputPath);

// === Definir salida final ===
const outputPath = path.join(paths.output, 'montaje_final.mp4');

// === Ejecutar reencodeo y concatenación final ===
createVideoWithVideos(
    orderedInputPaths,
    outputPath,
    () => {
        console.log('🎉 Montaje final generado correctamente.');
        cleanTmpDir(); // ✅ limpieza aquí, controlada por el script
    },
    (err) => {
        console.error('💥 Error durante la creación del video:', err.message)
        cleanTmpDir();
    }
);