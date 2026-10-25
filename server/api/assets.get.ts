import { mediaService } from '../services/media.service';

export default defineEventHandler(() => {
  return mediaService.listAssets();
});
