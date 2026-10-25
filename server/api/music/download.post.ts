import { jamendoService } from '../../services/music/jamendo.service';

export default defineEventHandler(async (event) => {
  const body = await readBody(event) || {};

  if (!body.audioUrl || !body.name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Faltan parámetros obligatorios: name y audioUrl.'
    });
  }

  try {
    const fileName = await jamendoService.downloadTrack({
      name: body.name,
      audioUrl: body.audioUrl
    });

    return {
      success: true,
      fileName
    };
  } catch (err: any) {
    console.error('Error al descargar música:', err);
    throw createError({
      statusCode: 500,
      statusMessage: err.message || 'Error descargando la pista musical.'
    });
  }
});
