import fs from 'fs';
import path from 'path';
import { paths } from '~~/scripts/config/assets.config';

export default defineEventHandler((event) => {
  const fileName = getRouterParam(event, 'file');
  if (!fileName) {
    throw createError({ statusCode: 400, statusMessage: 'Nombre de archivo requerido' });
  }

  const safeFile = path.basename(decodeURIComponent(fileName));
  const filePath = path.join(paths.output, safeFile);

  if (!fs.existsSync(filePath)) {
    throw createError({ statusCode: 404, statusMessage: `Archivo no encontrado: ${safeFile}` });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const ext = path.extname(safeFile).toLowerCase();

  const contentType = ext === '.mp4' ? 'video/mp4' :
                      ext === '.webm' ? 'video/webm' :
                      ext === '.mp3' ? 'audio/mpeg' :
                      ext === '.wav' ? 'audio/wav' : 'application/octet-stream';

  const range = getHeader(event, 'range');

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = (end - start) + 1;

    setResponseStatus(event, 206);
    setHeaders(event, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });

    return fs.createReadStream(filePath, { start, end });
  } else {
    setHeaders(event, {
      'Content-Length': fileSize,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Access-Control-Allow-Origin': '*'
    });

    return fs.createReadStream(filePath);
  }
});
