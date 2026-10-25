const path = require('path');
const {
  paths,
  firstImages,
  getAudioFile,
  getSubsFile,
  getFontFile,
} = require('./config/assets.config');
const {
  getAudioDuration,
  createImageList,
  createVideoWithImages,
  addAudio,
  addSubs,
} = require('./tools/media.tools');
const { ensureDirs, cleanTmpDir } = require('./tools/fs.tools');

async function main() {
  try {
    ensureDirs();

    const audioFile = getAudioFile('valentin_megamix.mp3');
    const subsFile = getSubsFile('valentin_megamix.srt');
    const fontFile = getFontFile('LuckiestGuy-Regular.ttf');

    const tempVideo = path.join(paths.tmp, 'video_temp.mp4');
    const tempAudioVideo = path.join(paths.tmp, 'video_temp_audio.mp4');
    const finalVideo = path.join(paths.output, 'video_final.mp4');

    console.log('🎵 Leyendo duración del audio...');
    const audioDuration = getAudioDuration(audioFile);
    console.log(`🎵 Duración del audio: ${audioDuration.toFixed(2)} segundos`);

    console.log('🖼️ Procesando y deduplicando imágenes...');
    const { inputTxtPath, totalImages, duplicates } = await createImageList(
      audioDuration,
      paths.images,
      firstImages,
    );
    console.log(
      `📸 Imágenes listas: ${totalImages} únicas (${duplicates.length} duplicadas descartadas)`,
    );

    console.log('🎞️ Generando vídeo base con imágenes...');
    await createVideoWithImages(inputTxtPath, tempVideo, { aspect: '16:9' });

    console.log('🎧 Añadiendo pista de audio...');
    await addAudio(tempVideo, audioFile, tempAudioVideo);

    console.log('💬 Quemando subtítulos con tipografía...');
    await addSubs(tempAudioVideo, subsFile, fontFile, finalVideo);

    console.log('🎉 ¡Vídeo final generado con éxito en:', finalVideo);
  } catch (err) {
    console.error('💥 Error durante el collage:', err.message);
    process.exitCode = 1;
  } finally {
    cleanTmpDir();
  }
}

main();
