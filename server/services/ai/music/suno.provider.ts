import fs from 'fs';
import path from 'path';
import { paths } from '~~/scripts/config/assets.config';
import { GenerateMusicOptions, GenerateMusicResult, IMusicProvider } from './music.interface';

export class SunoMusicProvider implements IMusicProvider {
  readonly id = 'suno' as const;
  readonly name = 'Suno AI (Canción Completa / Vocal o Instrumental)';

  private get apiKey(): string | undefined {
    return process.env.SUNO_API_KEY;
  }

  private get baseUrl(): string {
    return process.env.SUNO_API_URL || 'https://api.aimusicapi.ai/api/v1';
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async generate(options: GenerateMusicOptions): Promise<GenerateMusicResult> {
    if (!this.isConfigured()) {
      throw new Error(
        'El proveedor Suno AI no está configurado. Por favor añade SUNO_API_KEY en tu archivo .env'
      );
    }

    const title = options.title || `suno_${Date.now()}`;
    const safeTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    const fileName = `${safeTitle}.mp3`;
    const targetPath = path.join(paths.audios, fileName);

    console.log(`[SunoProvider] Solicitando generación musical: "${options.prompt}"...`);

    // 1. Iniciar tarea de generación
    const createRes = await fetch(`${this.baseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        prompt: options.prompt,
        make_instrumental: options.instrumental ?? false,
        title: options.title || 'Canción Toolkit',
        tags: options.tags || 'soundtrack, montage'
      })
    });

    if (!createRes.ok) {
      const errorText = await createRes.text();
      throw new Error(`Error en la API de Suno (${createRes.status}): ${errorText}`);
    }

    const createData = (await createRes.json()) as any;
    const taskId = createData.taskId || createData.task_id || createData.id || createData.workId;

    if (!taskId) {
      // Algunos wrappers devuelven directamente el audioUrl si es sincrónico
      if (createData.audio_url || createData.audioUrl) {
        return this.downloadAndSave(createData.audio_url || createData.audioUrl, fileName, targetPath, options);
      }
      throw new Error('La API de Suno no devolvió un identificador de tarea válido.');
    }

    console.log(`[SunoProvider] Tarea creada con ID ${taskId}. Esperando composición...`);

    // 2. Polling hasta completar la pista
    const maxAttempts = 30; // 30 intentos * 3s = 90 segundos máximo
    let audioUrl: string | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 3000));

      const pollRes = await fetch(`${this.baseUrl}/feed?taskId=${encodeURIComponent(taskId)}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`
        }
      });

      if (!pollRes.ok) continue;

      const pollData = (await pollRes.json()) as any;
      const status = pollData.status || pollData.state;

      console.log(`[SunoProvider] Intento ${attempt}/${maxAttempts} - Estado: ${status}`);

      if (status === 'completed' || status === 'SUCCESS' || status === 'ready') {
        audioUrl = pollData.audio_url || pollData.audioUrl || (pollData.data && pollData.data[0]?.audio_url);
        break;
      }

      if (status === 'failed' || status === 'ERROR') {
        throw new Error(`La generación de Suno falló: ${pollData.message || 'Error desconocido'}`);
      }
    }

    if (!audioUrl) {
      throw new Error('Tiempo de espera agotado esperando a que Suno termine de generar el audio.');
    }

    return this.downloadAndSave(audioUrl, fileName, targetPath, options);
  }

  private async downloadAndSave(
    audioUrl: string,
    fileName: string,
    targetPath: string,
    options: GenerateMusicOptions
  ): Promise<GenerateMusicResult> {
    console.log(`[SunoProvider] Descargando audio desde: ${audioUrl}`);
    const downloadRes = await fetch(audioUrl);
    if (!downloadRes.ok) {
      throw new Error(`Error descargando el audio generado desde ${audioUrl}`);
    }

    const arrayBuffer = await downloadRes.arrayBuffer();
    fs.writeFileSync(targetPath, Buffer.from(arrayBuffer));

    console.log(`[SunoProvider] Audio guardado con éxito en: ${targetPath}`);

    return {
      title: options.title || fileName,
      fileName,
      filePath: targetPath,
      audioUrl,
      provider: 'suno',
      metadata: { prompt: options.prompt, instrumental: options.instrumental }
    };
  }
}
