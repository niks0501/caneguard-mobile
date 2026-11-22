import { expoTileStore } from './expoTileStore';
import { TileCache } from './tileCache';

/** One cache per app process so the 3-request limit and the index are shared. */
export const tileCache = new TileCache(expoTileStore);
