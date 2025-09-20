const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const { execSync } = require('child_process');
const { paths } = require('../config/assets.config');

function getAudioDuration(filePath) {
  const duration = parseFloat(
    execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`)
      .toString()
      .trim()
  );
  return duration;
}

/**
 * Filtra imágenes únicas comparando sus píxeles.
 * Muestra cuáles imágenes son duplicadas entre sí.
 * @param {string[]} imagePaths - Lista de rutas absolutas a imágenes.
 * @returns {Promise<string[]>} - Lista de rutas únicas.
 */
async function filterUniqueImagesByContent(imagePaths, seenHashes = new Map()) {
  const unique = [];

  for (const imgPath of imagePaths) {
    try {
      const buffer = await sharp(imgPath)
        .resize(256)
        .toFormat('png')
        .removeAlpha()
        .raw()
        .toBuffer();

      const hash = crypto.createHash('md5').update(buffer).digest('hex');

      if (seenHashes.has(hash)) {
        const original = seenHashes.get(hash);
        console.log(`🧹 Imagen duplicada detectada:`);
        console.log(`   👉 ${path.basename(imgPath)}`);
        console.log(`   🔁 misma que: ${path.basename(original)}\n`);
      } else {
        seenHashes.set(hash, imgPath);
        unique.push(imgPath);
      }
    } catch (err) {
      console.warn(`⚠️ No se pudo procesar ${imgPath}: ${err.message}`);
    }
  }

  return { unique, seenHashes };
}

async function createImageList(duration, imageDir, firstImages = []) {
  const allImageFiles = fs.readdirSync(imageDir).filter(f => /\.(jpe?g|png)$/i.test(f));
  const allImagePaths = allImageFiles.map(f => path.join(imageDir, f));

  const firstImagePaths = firstImages.map(f => path.join(imageDir, f));
  const restImagePaths = allImagePaths.filter(p => !firstImagePaths.includes(p));

  // Filtra duplicados, priorizando los primeros
  const { unique: firstUnique, seenHashes } = await filterUniqueImagesByContent(firstImagePaths);
  const { unique: restUnique } = await filterUniqueImagesByContent(restImagePaths, seenHashes);

  const shuffledRest = restUnique.sort(() => 0.5 - Math.random());
  const allUnique = firstUnique.concat(shuffledRest);
  const finalFilenames = allUnique.map(p => path.basename(p));
  const durationPerImage = duration / finalFilenames.length;

  const inputTxt = finalFilenames
    .map(name => `file '${path.join(imageDir, name)}'\nduration ${durationPerImage.toFixed(3)}`)
    .join('\n');

  const inputTxtPath = path.join(paths.tmp, 'input.txt');
  fs.writeFileSync(inputTxtPath, inputTxt + `\nfile '${path.join(imageDir, finalFilenames.at(-1))}'`);

  return inputTxtPath;
}


function createVideoList(videoDir, firstVideos = [], lastVideos = []) {
  const allVideos = fs.readdirSync(videoDir).filter(f => /\.(mp4|mov|mkv)$/i.test(f));
  const coreVideos = allVideos.filter(f => !firstVideos.includes(f) && !lastVideos.includes(f));
  const shuffledCore = coreVideos.sort(() => 0.5 - Math.random());
  const ordered = firstVideos.concat(shuffledCore, lastVideos);
  
  return ordered.map((filename, index) => ({
    index,
    filename,
    inputPath: path.join(videoDir, filename),
    outputPath: path.join(paths.tmp, `clip_${index}.mp4`)
  }));
}

function createVideoWithImages(imageListFile, output, onEnd, onError) {
  ffmpeg()
    .input(imageListFile)
    .inputOptions(['-f concat', '-safe 0'])
    .videoFilters(
      "scale=w=1920:h=1080:force_original_aspect_ratio=decrease," +
      "pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black"
    )
    .output(output)
    .on('end', onEnd)
    .on('error', onError)
    .run();
}

function createVideoWithVideos(videoPaths, output, onEnd, onError) {
  if (!Array.isArray(videoPaths) || videoPaths.length === 0) {
    return onError?.(new Error('No se proporcionó una lista válida de videos'));
  }

  const reencodedClips = videoPaths.map((input, index) => ({
    input,
    output: path.join(paths.tmp, `clip_${index}.mp4`)
  }));

  // === 1. Reencodear todos los videos ===
  const reencodeNext = (index = 0) => {
    if (index >= reencodedClips.length) {
      return generateConcatAndMerge();
    }

    const { input, output: outputPath } = reencodedClips[index];
    console.log(`🎞️  Reencodeando ${index + 1}/${reencodedClips.length}: ${path.basename(input)}`);

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
        '-movflags +faststart'
      ])
      .on('end', () => reencodeNext(index + 1))
      .on('error', err => {
        console.error(`❌ Error al reencodear clip ${index + 1}:`, err.message);
        onError?.(err);
      })
      .save(outputPath);
  };

  // === 2. Generar archivo concat.txt y hacer la unión final ===
  const generateConcatAndMerge = () => {
    const concatListPath = path.join(paths.tmp, 'concat.txt');
    const content = reencodedClips
      .map(({ output }) => `file '${output.replace(/\\/g, '/')}'`)
      .join('\n');
    fs.writeFileSync(concatListPath, content);

    console.log('📦 Concatenando clips...');

    ffmpeg()
      .input(concatListPath)
      .inputOptions(['-f concat', '-safe 0'])
      .outputOptions(['-c copy'])
      .output(output)
      .on('end', () => {
        console.log('✅ Video final generado:', output);
        onEnd?.();
      })
      .on('error', err => {
        console.error('❌ Error al concatenar:', err.message);
        onError?.(err);
      })
      .run();
  };

  // Iniciar proceso
  reencodeNext();
}

function addAudio(video, audio, output, onEnd, onError) {
  ffmpeg()
    .input(video)
    .input(audio)
    .audioCodec('aac')
    .videoCodec('copy')
    .outputOptions('-shortest')
    .output(output)
    .on('end', onEnd)
    .on('error', onError)
    .run();
}

function addSubs(video, subFile, fontFile, output, onEnd, onError) {
  ffmpeg()
    .input(video)
    .videoCodec('libx264')
    .audioCodec('aac')
    .videoFilters(
      `subtitles='${subFile}':force_style='FontName=${fontFile},FontSize=30,Outline=1,OutlineColour=&H000000&,Alignment=2'`
    )
    .outputOptions('-shortest')
    .output(output)
    .on('end', onEnd)
    .on('error', onError)
    .run();
}

module.exports = {
  getAudioDuration,
  createImageList,
  createVideoList,
  createVideoWithImages,
  createVideoWithVideos,
  addAudio,
  addSubs
};
