import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { paths } from '~~/scripts/config/assets.config';
import { ensureDirs } from '~~/scripts/tools/fs.tools';

export interface MusicTrack {
  id: string;
  name: string;
  artist: string;
  duration: number;
  audioUrl: string;
  shareUrl?: string;
  tags: string[];
  cover?: string;
  source: 'jamendo' | 'curated';
}

// Colección curada de pistas de estudio Creative Commons (alta fidelidad y 100% gratuitas)
const CURATED_TRACKS: MusicTrack[] = [
  {
    id: 'curated-1',
    name: 'Coffee & Dreams (Chill Lofi)',
    artist: 'Purrple Cat',
    duration: 154,
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
    tags: ['lofi', 'chill', 'relax', 'study', 'coffee'],
    source: 'curated'
  },
  {
    id: 'curated-2',
    name: 'Summer Acoustic Walk',
    artist: 'LesFM',
    duration: 142,
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3',
    tags: ['acoustic', 'summer', 'happy', 'guitar', 'family'],
    source: 'curated'
  },
  {
    id: 'curated-3',
    name: 'Cinematic Inspiring Moment',
    artist: 'ZakharValaha',
    duration: 178,
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3',
    tags: ['cinematic', 'epic', 'inspiring', 'strings', 'travel'],
    source: 'curated'
  },
  {
    id: 'curated-4',
    name: 'Uplifting Pop Celebration',
    artist: 'Music_Unlimited',
    duration: 135,
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f792cb.mp3',
    tags: ['pop', 'celebration', 'party', 'fun', 'happy'],
    source: 'curated'
  },
  {
    id: 'curated-5',
    name: 'Peaceful Piano Memory',
    artist: 'Olexy',
    duration: 160,
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/04/27/audio_67bcf729cf.mp3',
    tags: ['piano', 'nostalgic', 'peaceful', 'emotional'],
    source: 'curated'
  }
];

class JamendoService {
  private get clientId(): string | undefined {
    return process.env.JAMENDO_CLIENT_ID;
  }

  isConfigured(): boolean {
    return Boolean(this.clientId && this.clientId.trim().length > 0);
  }

  /**
   * Explora canciones por género o texto. Si hay JAMENDO_CLIENT_ID busca en Jamendo;
   * de lo contrario, filtra la colección curada gratuita de estudio.
   */
  async searchTracks(query?: string, tag?: string): Promise<MusicTrack[]> {
    if (this.isConfigured()) {
      try {
        const params = new URLSearchParams({
          client_id: this.clientId!,
          format: 'json',
          limit: '15',
          order: 'popularity_total',
          audioformat: 'mp32'
        });

        if (tag) params.append('fuzzytags', tag);
        if (query) params.append('search', query);

        const res = await fetch(`https://api.jamendo.com/v3.0/tracks/?${params.toString()}`);
        if (res.ok) {
          const data = (await res.json()) as any;
          if (data?.results && Array.isArray(data.results)) {
            return data.results.map((t: any) => ({
              id: t.id,
              name: t.name,
              artist: t.artist_name,
              duration: t.duration,
              audioUrl: t.audio,
              shareUrl: t.shareurl,
              tags: t.musicinfo?.tags?.genres || [],
              cover: t.image,
              source: 'jamendo'
            }));
          }
        }
      } catch (err) {
        console.warn('[JamendoService] Falló consulta a Jamendo API, usando colección curada:', err);
      }
    }

    // Filtrar colección curada
    const term = (query || tag || '').toLowerCase().trim();
    if (!term) return CURATED_TRACKS;

    return CURATED_TRACKS.filter(t =>
      t.name.toLowerCase().includes(term) ||
      t.artist.toLowerCase().includes(term) ||
      t.tags.some(tagItem => tagItem.toLowerCase().includes(term))
    );
  }

  /**
   * Descarga un archivo de música y lo guarda en assets/audios/
   */
  async downloadTrack(track: { name: string; audioUrl: string }): Promise<string> {
    ensureDirs();

    const safeName = track.name
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
    const fileName = `${safeName}.mp3`;
    const destination = path.join(paths.audios, fileName);

    console.log(`[JamendoService] Descargando pista "${track.name}" desde ${track.audioUrl}...`);

    return new Promise((resolve, reject) => {
      const download = (targetUrl: string, redirects = 0) => {
        if (redirects > 5) {
          return reject(new Error('Demasiadas redirecciones intentando descargar audio.'));
        }

        const client = targetUrl.startsWith('https') ? https : http;
        const req = client.get(
          targetUrl,
          {
            rejectUnauthorized: false,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          },
          (res) => {
            if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
              const redirectUrl = new URL(res.headers.location, targetUrl).toString();
              return download(redirectUrl, redirects + 1);
            }

            if (res.statusCode !== 200) {
              return reject(new Error(`Error descargando audio (HTTP ${res.statusCode})`));
            }

            const fileStream = fs.createWriteStream(destination);
            res.pipe(fileStream);

            fileStream.on('finish', () => {
              fileStream.close();
              console.log(`[JamendoService] Audio guardado con éxito en: ${destination}`);
              resolve(fileName);
            });

            fileStream.on('error', (err) => {
              fs.unlink(destination, () => {});
              reject(err);
            });
          }
        );

        req.on('error', (err) => reject(err));
      };

      download(track.audioUrl);
    });
  }
}

export const jamendoService = new JamendoService();
