import { mediaService } from '../../services/media.service';

export default defineEventHandler(async (event) => {
  const body = await readBody(event) || {};

  if (!body.audioName) {
    throw createError({
      statusCode: 400,
      statusMessage: 'El nombre de la pista de audio (audioName) es obligatorio.'
    });
  }

  try {
    const result = await mediaService.startCollageRender({
      audioName: body.audioName,
      subsName: body.subsName,
      fontName: body.fontName,
      firstImages: body.firstImages,
      aspect: body.aspect || '16:9',
      outputName: body.outputName
    });
    return { success: true, ...result };
  } catch (err: any) {
    throw createError({
      statusCode: 400,
      statusMessage: err.message || 'Error al iniciar collage.'
    });
  }
});
