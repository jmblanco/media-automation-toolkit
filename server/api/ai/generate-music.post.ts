import { musicService } from '../../services/ai/music/music.service';

export default defineEventHandler(async (event) => {
  const body = await readBody(event) || {};

  if (!body.prompt || typeof body.prompt !== 'string' || body.prompt.trim().length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'El campo "prompt" con la descripción de la música es obligatorio.'
    });
  }

  try {
    const result = await musicService.generate({
      prompt: body.prompt.trim(),
      title: body.title,
      instrumental: body.instrumental ?? true,
      provider: body.provider || 'suno',
      durationSeconds: body.durationSeconds || 30
    });

    return {
      success: true,
      result
    };
  } catch (err: any) {
    console.error('Error generando música con IA:', err);
    throw createError({
      statusCode: 500,
      statusMessage: err.message || 'Error desconocido generando música.'
    });
  }
});
