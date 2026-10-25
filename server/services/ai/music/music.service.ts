import fs from 'fs';
import path from 'path';
import { paths } from '~~/scripts/config/assets.config';
import { ensureDirs } from '~~/scripts/tools/fs.tools';
import { GenerateMusicOptions, GenerateMusicResult, IMusicProvider } from './music.interface';
import { SunoMusicProvider } from './suno.provider';
import { MusicGenProvider } from './musicgen.provider';

class MusicService {
  private providers: Map<string, IMusicProvider> = new Map();

  constructor() {
    const suno = new SunoMusicProvider();
    const musicgen = new MusicGenProvider();

    this.providers.set(suno.id, suno);
    this.providers.set(musicgen.id, musicgen);
  }

  getProvidersStatus() {
    return Array.from(this.providers.values()).map(provider => ({
      id: provider.id,
      name: provider.name,
      configured: provider.isConfigured()
    }));
  }

  async generate(options: GenerateMusicOptions & { provider?: 'suno' | 'musicgen' }): Promise<GenerateMusicResult> {
    ensureDirs();

    const providerId = options.provider || 'suno';
    const provider = this.providers.get(providerId);

    if (!provider) {
      throw new Error(`Proveedor de música '${providerId}' no reconocido.`);
    }

    // Si el proveedor está configurado con su clave, ejecutar llamada real
    if (provider.isConfigured()) {
      return provider.generate(options);
    }

    // Si no está configurado, informar al usuario con instrucciones claras
    const envVar = providerId === 'suno' ? 'SUNO_API_KEY' : 'REPLICATE_API_TOKEN';
    throw new Error(
      `El proveedor ${provider.name} requiere configurar la variable ${envVar} en el archivo .env`
    );
  }
}

export const musicService = new MusicService();
