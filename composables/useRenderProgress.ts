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

export const useRenderProgress = () => {
  const state = useState<ProgressState>('render-progress', () => ({
    isRendering: false,
    type: null,
    stage: 'idle',
    percent: 0,
    message: 'Listo',
    error: null
  }));

  const isModalOpen = useState<boolean>('render-modal-open', () => false);

  const initProgressStream = () => {
    if (import.meta.server) return;

    try {
      const eventSource = new EventSource('/api/render/progress');

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          state.value = data;

          if (data.isRendering) {
            isModalOpen.value = true;
          }
        } catch (err) {
          console.error('Error parseando SSE:', err);
        }
      };

      eventSource.onerror = () => {
        // En caso de caída de conexión se reintenta automáticamente
      };
    } catch (err) {
      console.warn('EventSource no soportado o fallido:', err);
    }
  };

  return {
    state,
    isModalOpen,
    initProgressStream
  };
};
