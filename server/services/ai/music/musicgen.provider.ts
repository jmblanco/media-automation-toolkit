import fs from 'fs';
import path from 'path';
import { paths } from '~~/scripts/config/assets.config';
import { GenerateMusicOptions, GenerateMusicResult, IMusicProvider } from './music.interface';

export class MusicGenProvider implements IMusicProvider {
  readonly id = 'musicgen' as const;
  readonly name = 'Meta MusicGen (Fondo Instrumental Oficial)';

  private get apiToken(): string | undefined {
    return process.env.REPLICATE_API_TOKEN;
  }

  isConfigured(): boolean {
    return Boolean(this.apiToken && this.apiToken.trim().length > 0);
  }

  async generate(options: GenerateMusicOptions): Promise<GenerateMusicResult> {
    if (!this.isConfigured()) {
      throw new Error(
        'El proveedor MusicGen no está configurado. Por favor añade REPLICATE_API_TOKEN en tu archivo .env'
      );
    }

    const title = options.title || `musicgen_${Date.now()}`;
    const safeTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    const fileName = `${safeTitle}.mp3`;
    const targetPath = path.join(paths.audios, fileName);

    console.log(`[MusicGenProvider] Creando predicción en Replicate: "${options.prompt}"...`);

    const res = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        Prefer: 'wait' // Intenta resolver sincrónicamente si es rápido
      },
      body: JSON.stringify({
        version: '671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb', // meta/musicgen
        input: {
          prompt: options.prompt,
          duration: options.durationSeconds || 30,
          model_version: 'stereo-melody-large',
          output_format: 'mp3'
        }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Error en API Replicate (${res.status}): ${errText}`);
    }

    let prediction = (await res.json()) as any;

    // Si aún está procesando, hacer polling
    while (prediction.status !== 'succeeded' && prediction.status !== 'failed' && prediction.status !== 'canceled') {
      await new Promise(resolve => setTimeout(resolve, 2500));
      const pollRes = await fetch(prediction.urls.get, {
        headers: {
          Authorization: `Bearer ${this.apiToken}`
        }
      });
      if (pollRes.ok) {
        prediction = await pollRes.json();
      }
    }

    if (prediction.status !== 'succeeded') {
      throw new Error(`Generación de MusicGen falló con estado: ${prediction.status}`);
    }

    const audioUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
    if (!audioUrl) {
      throw new Error('MusicGen no devolvió una URL de audio válida.');
    }

    console.log(`[MusicGenProvider] Descargando audio desde: ${audioUrl}`);
    const downloadRes = await fetch(audioUrl);
    if (!downloadRes.ok) {
      throw new Error(`Error descargando audio de MusicGen desde ${audioUrl}`);
    }

    const arrayBuffer = await downloadRes.arrayBuffer();
    fs.writeFileSync(targetPath, Buffer.from(arrayBuffer));

    console.log(`[MusicGenProvider] Audio guardado con éxito en: ${targetPath}`);

    return {
      title: options.title || fileName,
      fileName,
      filePath: targetPath,
      audioUrl,
      duration: options.durationSeconds || 30,
      provider: 'musicgen',
      metadata: { prompt: options.prompt }
    };
  }
}
