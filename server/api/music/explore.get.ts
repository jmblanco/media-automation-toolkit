import { jamendoService } from '../../services/music/jamendo.service';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const search = query.search ? String(query.search) : undefined;
  const tag = query.tag ? String(query.tag) : undefined;

  const tracks = await jamendoService.searchTracks(search, tag);
  return {
    isJamendoConfigured: jamendoService.isConfigured(),
    tracks
  };
});
