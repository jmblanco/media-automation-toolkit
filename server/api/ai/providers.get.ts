import { musicService } from '../../services/ai/music/music.service';

export default defineEventHandler(() => {
  return {
    musicProviders: musicService.getProvidersStatus()
  };
});
