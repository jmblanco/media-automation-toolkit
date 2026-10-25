const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const { execSync } = require('child_process');
const { paths } = require('../config/assets.config');

/**
 * Escapa rutas de archivos para filtros de FFmpeg (especialmente en Windows).
 * @param {string} rawPath
 * @returns {string}
 */
function escapeFilterPath(rawPath) {
  return rawPath.replace(/\\/g, '/').replace(/:/g, '\\:');
}

/**
 * Obtiene la duración de un archivo de audio en segundos.
 * @param {string} filePath
 * @returns {number}
 */
function getAudioDuration(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`El archivo de audio no existe: ${filePath}`);
  }
  const duration = parseFloat(
    execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`)
      .toString()
      .trim(),
  );
  if (isNaN(duration)) {
    throw new Error(`No se pudo determinar la duración de: ${filePath}`);
  }
  return duration;
}

/**
 * Filtra imágenes únicas comparando sus píxeles mediante un hash raw a 256x256.
 * @param {string[]} imagePaths
 * @param {Map<string, string>} seenHashes
 * @returns {Promise<{ unique: string[], duplicates: Array<{ file: string, original: string }>, seenHashes: Map<string, string> }>}
 */
async function filterUniqueImagesByContent(imagePaths, seenHashes = new Map()) {
  const unique = [];
  const duplicates = [];

  for (const imgPath of imagePaths) {
    try {
      const buffer = await sharp(imgPath)
        .resize(256, 256, { fit: 'cover' })
        .toFormat('png')
        .removeAlpha()
        .raw()
        .toBuffer();

      const hash = crypto.createHash('md5').update(buffer).digest('hex');

      if (seenHashes.has(hash)) {
        const original = seenHashes.get(hash);
        duplicates.push({ file: imgPath, original });
        console.log(
          `🧹 Imagen duplicada descartada: ${path.basename(imgPath)} (idéntica a ${path.basename(original)})`,
        );
      } else {
        seenHashes.set(hash, imgPath);
        unique.push(imgPath);
      }
    } catch (err) {
      console.warn(`⚠️ Error al procesar imagen ${imgPath}: ${err.message}`);
    }
  }

  return { unique, duplicates, seenHashes };
}

/**
 * Genera el archivo descriptor para concat demuxer con las imágenes sincronizadas a la duración.
 * @param {number} duration
 * @param {string} imageDir
 * @param {string[]} firstImages
 * @returns {Promise<{ inputTxtPath: string, totalImages: number, duplicates: Array<{ file: string, original: string }> }>}
 */
async function createImageList(duration, imageDir, firstImages = []) {
  if (!fs.existsSync(imageDir)) {
    throw new Error(`El directorio de imágenes no existe: ${imageDir}`);
  }

  const allImageFiles = fs.readdirSync(imageDir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  const allImagePaths = allImageFiles.map((f) => path.join(imageDir, f));

  const firstImagePaths = firstImages
    .map((f) => path.join(imageDir, f))
    .filter((p) => fs.existsSync(p));

  const restImagePaths = allImagePaths.filter((p) => !firstImagePaths.includes(p));

  // Filtra duplicados
  const {
    unique: firstUnique,
    duplicates: firstDupes,
    seenHashes,
  } = await filterUniqueImagesByContent(firstImagePaths);
  const { unique: restUnique, duplicates: restDupes } = await filterUniqueImagesByContent(
    restImagePaths,
    seenHashes,
  );

  const duplicates = [...firstDupes, ...restDupes];
  const shuffledRest = restUnique.sort(() => 0.5 - Math.random());
  const allUnique = firstUnique.concat(shuffledRest);

  if (allUnique.length === 0) {
    throw new Error('No se encontraron imágenes válidas para generar el collage.');
  }

  const finalFilenames = allUnique.map((p) => path.basename(p));
  const durationPerImage = duration / finalFilenames.length;

  const inputTxt = finalFilenames
    .map(
      (name) =>
        `file '${path.join(imageDir, name).replace(/\\/g, '/')}'\nduration ${durationPerImage.toFixed(3)}`,
    )
    .join('\n');

  const lastImage = finalFilenames[finalFilenames.length - 1];
  const finalContent = inputTxt + `\nfile '${path.join(imageDir, lastImage).replace(/\\/g, '/')}'`;

  const inputTxtPath = path.join(paths.tmp, 'input.txt');
  fs.writeFileSync(inputTxtPath, finalContent);

  return {
    inputTxtPath,
    totalImages: finalFilenames.length,
    duplicates,
  };
}

/**
 * Prepara la lista ordenada de vídeos (intro, centro aleatorio, outro).
 * @param {string} videoDir
 * @param {string[]} firstVideos
 * @param {string[]} lastVideos
 * @returns {Array<{ index: number, filename: string, inputPath: string, outputPath: string }>}
 */
function createVideoList(videoDir, firstVideos = [], lastVideos = []) {
  if (!fs.existsSync(videoDir)) {
    throw new Error(`El directorio de vídeos no existe: ${videoDir}`);
  }

  const allVideos = fs.readdirSync(videoDir).filter((f) => /\.(mp4|mov|mkv|webm)$/i.test(f));
  const validFirst = firstVideos.filter((f) => allVideos.includes(f));
  const validLast = lastVideos.filter((f) => allVideos.includes(f));
  const coreVideos = allVideos.filter((f) => !validFirst.includes(f) && !validLast.includes(f));

  const shuffledCore = coreVideos.sort(() => 0.5 - Math.random());
  const ordered = validFirst.concat(shuffledCore, validLast);

  return ordered.map((filename, index) => ({
    index,
    filename,
    inputPath: path.join(videoDir, filename),
    outputPath: path.join(paths.tmp, `clip_${index}.mp4`),
  }));
}

/**
 * Crea un vídeo base a partir del descriptor de imágenes.
 * Admite tanto Promesas como los callbacks tradicionales (onEnd, onError).
 * @param {string} imageListFile
 * @param {string} output
 * @param {object|function} optionsOrOnEnd
 * @param {function} [onError]
 * @returns {Promise<string>}
 */
function createVideoWithImages(imageListFile, output, optionsOrOnEnd, onError) {
  return new Promise((resolve, reject) => {
    let options = {};
    let onEndCallback = null;
    let onErrorCallback = null;

    if (typeof optionsOrOnEnd === 'function') {
      onEndCallback = optionsOrOnEnd;
      onErrorCallback = onError;
    } else if (typeof optionsOrOnEnd === 'object' && optionsOrOnEnd !== null) {
      options = optionsOrOnEnd;
    }

    const isVertical = options.aspect === '9:16';
    const width = isVertical ? 1080 : 1920;
    const height = isVertical ? 1920 : 1080;

    const filter = `scale=w=${width}:h=${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black`;

    const cmd = ffmpeg()
      .input(imageListFile)
      .inputOptions(['-f concat', '-safe 0'])
      .videoFilters(filter)
      .outputOptions(['-c:v libx264', '-pix_fmt yuv420p', '-r 30'])
      .output(output)
      .on('progress', (progress) => {
        if (options.onProgress) {
          options.onProgress({
            stage: 'images',
            percent: progress.percent ? Math.round(progress.percent) : null,
            message: 'Generando vídeo de imágenes...',
          });
        }
      })
      .on('end', () => {
        if (onEndCallback) onEndCallback();
        resolve(output);
      })
      .on('error', (err) => {
        if (onErrorCallback) onErrorCallback(err);
        reject(err);
      });

    cmd.run();
  });
}

/**
 * Reencodifica secuencialmente una lista de vídeos y los concatena en un archivo final.
 * Emite eventos de progreso para tracking en UI y soporta callbacks legados.
 * @param {string[]} videoPaths
 * @param {string} output
 * @param {function|object} onProgressOrEnd
 * @param {function} [legacyOnError]
 * @returns {Promise<string>}
 */
function createVideoWithVideos(videoPaths, output, onProgressOrEnd, legacyOnError) {
  return new Promise((resolve, reject) => {
    let onProgress = null;
    let legacyOnEnd = null;

    if (typeof onProgressOrEnd === 'function' && typeof legacyOnError === 'function') {
      legacyOnEnd = onProgressOrEnd;
    } else if (typeof onProgressOrEnd === 'function') {
      onProgress = onProgressOrEnd;
    } else if (typeof onProgressOrEnd === 'object' && onProgressOrEnd !== null) {
      onProgress = onProgressOrEnd.onProgress;
    }

    if (!Array.isArray(videoPaths) || videoPaths.length === 0) {
      const err = new Error('No se proporcionó una lista válida de vídeos para procesar.');
      if (legacyOnError) legacyOnError(err);
      return reject(err);
    }

    const reencodedClips = videoPaths.map((input, index) => ({
      input,
      output: path.join(paths.tmp, `clip_${index}.mp4`),
    }));

    const total = reencodedClips.length;

    // === 1. Transcodificación secuencial ===
    const reencodeNext = (index = 0) => {
      if (index >= total) {
        return generateConcatAndMerge();
      }

      const { input, output: outputPath } = reencodedClips[index];
      const filename = path.basename(input);
      console.log(`🎞️  Transcodificando clip ${index + 1}/${total}: ${filename}`);

      if (onProgress) {
        onProgress({
          stage: 'transcoding',
          current: index + 1,
          total,
          percent: Math.round((index / total) * 90),
          message: `Transcodificando clip ${index + 1} de ${total}: ${filename}`,
        });
      }

      ffmpeg(input)
        .outputOptions([
          '-map 0:v:0',
          '-map 0:a:0?',
          '-c:v libx264',
          '-preset veryfast',
          '-crf 23',
          '-r 30',
          '-c:a aac',
          '-b:a 192k',
          '-ac 2',
          '-ar 44100',
          '-af aresample=async=1',
          '-shortest',
          '-vsync 2',
          '-async 1',
          '-movflags +faststart',
        ])
        .on('end', () => reencodeNext(index + 1))
        .on('error', (err) => {
          console.error(`❌ Error al reencodear clip ${index + 1}:`, err.message);
          if (legacyOnError) legacyOnError(err);
          reject(err);
        })
        .save(outputPath);
    };

    // === 2. Concatenación rápida ===
    const generateConcatAndMerge = () => {
      const concatListPath = path.join(paths.tmp, 'concat.txt');
      const content = reencodedClips
        .map(({ output }) => `file '${output.replace(/\\/g, '/')}'`)
        .join('\n');
      fs.writeFileSync(concatListPath, content);

      console.log('📦 Concatenando clips...');
      if (onProgress) {
        onProgress({
          stage: 'concat',
          current: total,
          total,
          percent: 95,
          message: 'Concatenando clips normalizados en montaje final...',
        });
      }

      ffmpeg()
        .input(concatListPath)
        .inputOptions(['-f concat', '-safe 0'])
        .outputOptions(['-c copy'])
        .output(output)
        .on('end', () => {
          console.log('✅ Montaje final generado:', output);
          if (onProgress) {
            onProgress({
              stage: 'done',
              percent: 100,
              message: '¡Montaje final generado con éxito!',
            });
          }
          if (legacyOnEnd) legacyOnEnd();
          resolve(output);
        })
        .on('error', (err) => {
          console.error('❌ Error al concatenar clips:', err.message);
          if (legacyOnError) legacyOnError(err);
          reject(err);
        })
        .run();
    };

    reencodeNext();
  });
}

/**
 * Añade pista de audio a un vídeo cortando al stream más corto.
 * @param {string} video
 * @param {string} audio
 * @param {string} output
 * @param {function} [legacyOnEnd]
 * @param {function} [legacyOnError]
 * @returns {Promise<string>}
 */
function addAudio(video, audio, output, legacyOnEnd, legacyOnError) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(video)
      .input(audio)
      .audioCodec('aac')
      .videoCodec('copy')
      .outputOptions('-shortest')
      .output(output)
      .on('end', () => {
        if (legacyOnEnd) legacyOnEnd();
        resolve(output);
      })
      .on('error', (err) => {
        if (legacyOnError) legacyOnError(err);
        reject(err);
      })
      .run();
  });
}

/**
 * Incrusta subtítulos con estilo tipográfico forzado.
 * @param {string} video
 * @param {string} subFile
 * @param {string} fontFile
 * @param {string} output
 * @param {function} [legacyOnEnd]
 * @param {function} [legacyOnError]
 * @returns {Promise<string>}
 */
function addSubs(video, subFile, fontFile, output, legacyOnEnd, legacyOnError) {
  return new Promise((resolve, reject) => {
    const escapedSub = escapeFilterPath(subFile);
    const fontName = path.basename(fontFile, path.extname(fontFile));

    ffmpeg()
      .input(video)
      .videoCodec('libx264')
      .audioCodec('aac')
      .videoFilters(
        `subtitles='${escapedSub}':force_style='FontName=${fontName},FontSize=28,Outline=2,OutlineColour=&H000000&,Alignment=2'`,
      )
      .outputOptions('-shortest')
      .output(output)
      .on('end', () => {
        if (legacyOnEnd) legacyOnEnd();
        resolve(output);
      })
      .on('error', (err) => {
        if (legacyOnError) legacyOnError(err);
        reject(err);
      })
      .run();
  });
}

module.exports = {
  escapeFilterPath,
  getAudioDuration,
  filterUniqueImagesByContent,
  createImageList,
  createVideoList,
  createVideoWithImages,
  createVideoWithVideos,
  addAudio,
  addSubs,
};
