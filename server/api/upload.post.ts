import fs from 'fs';
import path from 'path';
import { paths } from '~~/scripts/config/assets.config';
import { ensureDirs } from '~~/scripts/tools/fs.tools';

export default defineEventHandler(async (event) => {
  ensureDirs();

  const formData = await readMultipartFormData(event);
  if (!formData || formData.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No se enviaron archivos en la solicitud.'
    });
  }

  const savedFiles: string[] = [];

  for (const part of formData) {
    if (!part.filename || !part.data) continue;

    // Sanear nombre de archivo
    const safeFilename = path.basename(part.filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    const ext = path.extname(safeFilename).toLowerCase();

    let targetDir = paths.images;

    if (/\.(mp4|mov|mkv|webm|avi)$/i.test(ext)) {
      targetDir = paths.videos;
    } else if (/\.(mp3|wav|ogg|flac|m4a|aac)$/i.test(ext)) {
      targetDir = paths.audios;
    } else if (/\.(srt|vtt)$/i.test(ext)) {
      targetDir = paths.audios; // Los subtítulos conviven con audios según assets.config
    } else if (/\.(ttf|otf|woff2?)$/i.test(ext)) {
      targetDir = paths.fonts;
    } else if (/\.(jpe?g|png|webp|gif|bmp)$/i.test(ext)) {
      targetDir = paths.images;
    }

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const destination = path.join(targetDir, safeFilename);
    fs.writeFileSync(destination, part.data);
    savedFiles.push(safeFilename);
  }

  return {
    success: true,
    uploaded: savedFiles
  };
});
