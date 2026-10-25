import { mediaService } from '../../services/media.service';

export default defineEventHandler(async (event) => {
  const body = await readBody(event) || {};

  try {
    const result = await mediaService.startVideoRender({
      firstVideos: body.firstVideos,
      lastVideos: body.lastVideos,
      outputName: body.outputName
    });
    return { success: true, ...result };
  } catch (err: any) {
    throw createError({
      statusCode: 400,
      statusMessage: err.message || 'Error al iniciar renderizado de vídeo.'
    });
  }
});
