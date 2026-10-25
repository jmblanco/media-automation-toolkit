import { createEventStream } from 'h3';
import { mediaService } from '../../services/media.service';

export default defineEventHandler(async (event) => {
  const eventStream = createEventStream(event);

  // Enviar inmediatamente el estado actual
  await eventStream.push(JSON.stringify(mediaService.getState()));

  const onProgress = async (state: any) => {
    try {
      await eventStream.push(JSON.stringify(state));
    } catch {
      // Ignorar desconexión del cliente
    }
  };

  mediaService.on('progress', onProgress);

  eventStream.onClosed(() => {
    mediaService.off('progress', onProgress);
  });

  return eventStream.send();
});
