import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { paths } from '~~/scripts/config/assets.config';
import { ensureDirs, cleanTmpDir } from '~~/scripts/tools/fs.tools';
import {
  getAudioDuration,
  createImageList,
  createVideoList,
  createVideoWithImages,
  createVideoWithVideos,
  addAudio,
  addSubs
} from '~~/scripts/tools/media.tools';

export interface ProgressState {
  isRendering: boolean;
  type: 'video' | 'collage' | null;
  stage: string;
  percent: number;
  message: string;
  current?: number;
  total?: number;
  outputFile?: string;
  error?: string | null;
}

class MediaService extends EventEmitter {
  private state: ProgressState = {
    isRendering: false,
    type: null,
    stage: 'idle',
    percent: 0,
    message: 'Listo para procesar',
    error: null
  };

  getState(): ProgressState {
    return { ...this.state };
  }

  private updateProgress(patch: Partial<ProgressState>) {
    this.state = { ...this.state, ...patch };
    this.emit('progress', this.getState());
  }

  /**
   * Lista todos los assets organizados por categoría.
   */
  listAssets() {
    ensureDirs();

    const getFolderFiles = (dir: string) => {
      if (!fs.existsSync(dir)) return [];
      return fs.readdirSync(dir)
        .filter(f => !f.startsWith('.') && !f.includes(':Zone.Identifier'))
        .map(file => {
          const fullPath = path.join(dir, file);
          const stats = fs.statSync(fullPath);
          return {
            name: file,
            size: stats.size,
            updatedAt: stats.mtime
          };
        });
    };

    const outputDir = paths.output;
    const outputFiles = fs.existsSync(outputDir)
      ? fs.readdirSync(outputDir)
          .filter(f => /\.(mp4|webm|mkv)$/i.test(f))
          .map(file => {
            const stats = fs.statSync(path.join(outputDir, file));
            return {
              name: file,
              size: stats.size,
              updatedAt: stats.mtime,
              url: `/api/media/${encodeURIComponent(file)}`
            };
          })
      : [];

    return {
      images: getFolderFiles(paths.images).filter(f => /\.(jpe?g|png|webp)$/i.test(f.name)),
      videos: getFolderFiles(paths.videos).filter(f => /\.(mp4|mov|mkv|webm)$/i.test(f.name)),
      audios: getFolderFiles(paths.audios).filter(f => /\.(mp3|wav|ogg|flac|m4a)$/i.test(f.name)),
      subtitles: getFolderFiles(paths.audios).filter(f => /\.(srt|vtt)$/i.test(f.name)),
      fonts: getFolderFiles(paths.fonts).filter(f => /\.(ttf|otf|woff2?)$/i.test(f.name)),
      outputs: outputFiles
    };
  }

  /**
   * Ejecuta el pipeline de unión de vídeos en segundo plano.
   */
  async startVideoRender(params: {
    firstVideos?: string[];
    lastVideos?: string[];
    outputName?: string;
  }) {
    if (this.state.isRendering) {
      throw new Error('Ya hay un renderizado en curso. Por favor espera a que finalice.');
    }

    ensureDirs();
    const firstVideos = params.firstVideos || [];
    const lastVideos = params.lastVideos || [];
    const outputFileName = params.outputName || 'montaje_final.mp4';
    const outputPath = path.join(paths.output, outputFileName);

    const videoList = createVideoList(paths.videos, firstVideos, lastVideos);
    if (!videoList.length) {
      throw new Error(`No se encontraron vídeos válidos para procesar en ${paths.videos}`);
    }

    const orderedInputPaths = videoList.map((v: { inputPath: string }) => v.inputPath);

    this.updateProgress({
      isRendering: true,
      type: 'video',
      stage: 'transcoding',
      percent: 5,
      message: `Iniciando montaje de ${orderedInputPaths.length} clips...`,
      current: 0,
      total: orderedInputPaths.length,
      outputFile: undefined,
      error: null
    });

    (async () => {
      try {
        await createVideoWithVideos(
          orderedInputPaths,
          outputPath,
          (progress: { percent?: number; stage?: string; message?: string; current?: number; total?: number }) => {
            this.updateProgress({
              stage: progress.stage || 'transcoding',
              percent: progress.percent ?? this.state.percent,
              message: progress.message || 'Procesando clips...',
              current: progress.current,
              total: progress.total
            });
          }
        );

        this.updateProgress({
          isRendering: false,
          stage: 'done',
          percent: 100,
          message: '¡Montaje final generado con éxito!',
          outputFile: `/api/media/${encodeURIComponent(outputFileName)}`
        });
      } catch (err: any) {
        console.error('Error en render de video:', err);
        this.updateProgress({
          isRendering: false,
          stage: 'error',
          error: err.message || 'Error desconocido al procesar vídeos.'
        });
      } finally {
        cleanTmpDir();
      }
    })();

    return { started: true, totalClips: orderedInputPaths.length };
  }

  /**
   * Ejecuta el pipeline de collage fotográfico con música y subtítulos en segundo plano.
   */
  async startCollageRender(params: {
    audioName: string;
    subsName?: string;
    fontName?: string;
    firstImages?: string[];
    aspect?: '16:9' | '9:16';
    outputName?: string;
  }) {
    if (this.state.isRendering) {
      throw new Error('Ya hay un renderizado en curso. Por favor espera a que finalice.');
    }

    ensureDirs();
    const audioPath = path.join(paths.audios, params.audioName);
    if (!fs.existsSync(audioPath)) {
      throw new Error(`El archivo de audio no existe: ${params.audioName}`);
    }

    const outputFileName = params.outputName || 'video_final.mp4';
    const finalOutputPath = path.join(paths.output, outputFileName);
    const aspect = params.aspect || '16:9';

    this.updateProgress({
      isRendering: true,
      type: 'collage',
      stage: 'analyzing',
      percent: 5,
      message: 'Analizando pista de audio y midiendo duración...',
      error: null,
      outputFile: undefined
    });

    (async () => {
      try {
        const audioDuration = getAudioDuration(audioPath);

        this.updateProgress({
          stage: 'images',
          percent: 15,
          message: `Deduplicando imágenes para ${audioDuration.toFixed(1)}s de audio...`
        });

        const { inputTxtPath, totalImages, duplicates } = await createImageList(
          audioDuration,
          paths.images,
          params.firstImages || []
        );

        const tempVideo = path.join(paths.tmp, 'video_temp.mp4');
        const tempAudioVideo = path.join(paths.tmp, 'video_temp_audio.mp4');

        this.updateProgress({
          stage: 'rendering_images',
          percent: 30,
          message: `Renderizando ${totalImages} fotos (${duplicates.length} duplicadas descartadas)...`
        });

        await createVideoWithImages(inputTxtPath, tempVideo, { aspect });

        this.updateProgress({
          stage: 'adding_audio',
          percent: 70,
          message: 'Sincronizando pista de audio...'
        });

        await addAudio(tempVideo, audioPath, tempAudioVideo);

        // Si se especificó subtítulos y tipografía
        if (params.subsName && params.fontName) {
          const subsPath = path.join(paths.audios, params.subsName);
          const fontPath = path.join(paths.fonts, params.fontName);

          if (fs.existsSync(subsPath) && fs.existsSync(fontPath)) {
            this.updateProgress({
              stage: 'subtitles',
              percent: 85,
              message: 'Incrustando subtítulos tipográficos...'
            });
            await addSubs(tempAudioVideo, subsPath, fontPath, finalOutputPath);
          } else {
            fs.copyFileSync(tempAudioVideo, finalOutputPath);
          }
        } else {
          fs.copyFileSync(tempAudioVideo, finalOutputPath);
        }

        this.updateProgress({
          isRendering: false,
          stage: 'done',
          percent: 100,
          message: '¡Collage de vídeo completado con éxito!',
          outputFile: `/api/media/${encodeURIComponent(outputFileName)}`
        });
      } catch (err: any) {
        console.error('Error en collage render:', err);
        this.updateProgress({
          isRendering: false,
          stage: 'error',
          error: err.message || 'Error desconocido al crear collage.'
        });
      } finally {
        cleanTmpDir();
      }
    })();

    return { started: true };
  }
}

export const mediaService = new MediaService();
