const fs = require('fs');
const path = require('path');
const {
  paths,
  firstImages,
  getAudioFile,
  getSubsFile,
  getFontFile
} = require('./config/assets.config');
const {
  getAudioDuration,
  createImageList,
  createVideoWithImages,
  addAudio,
  addSubs
} = require('./tools/media.tools');

const { ensureDirs, cleanTmpDir } = require('./tools/fs.tools');

// === Preparar carpetas ===
ensureDirs();
// if (!fs.existsSync(paths.output)) fs.mkdirSync(paths.output);
// if (!fs.existsSync(paths.tmp)) fs.mkdirSync(paths.tmp);

// === Archivos usados ===
const audioFile = getAudioFile('valentin_megamix.mp3');
const subsFile = getSubsFile('valentin_megamix.srt');
const fontFile = getFontFile('LuckiestGuy-Regular.ttf');

// === Archivos intermedios ===
const tempVideo = path.join(paths.tmp, 'video_temp.mp4');
const tempAudioVideo = path.join(paths.tmp, 'video_temp_audio.mp4');
const finalVideo = path.join(paths.output, 'video_final.mp4');

// === Obtener duración del audio ===
const audioDuration = getAudioDuration(audioFile);
console.log(`🎵 Duración del audio: ${audioDuration.toFixed(2)} segundos`);

(async () => {
  // === Crear lista de imágenes ===
  const inputList = await createImageList(audioDuration, paths.images, firstImages);

  // === Proceso encadenado ===
  createVideoWithImages(inputList, tempVideo,
    () => {
      console.log('🎞️ Video base generado');

      addAudio(tempVideo, audioFile, tempAudioVideo,
        () => {
          console.log('🎧 Audio añadido');

          addSubs(tempAudioVideo, subsFile, fontFile, finalVideo,
            () => {
              console.log('✅ Video final generado con subtítulos 🎉');
              cleanTmpDir();
            },
            err => console.error('❌ Error al añadir subtítulos:', err.message)
          );
        },
        err => console.error('❌ Error al añadir audio:', err.message)
      );
    },
    err => console.error('❌ Error al generar video base:', err.message)
  );

})();

