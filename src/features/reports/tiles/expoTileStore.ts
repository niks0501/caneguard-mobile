import { Directory, File, Paths } from 'expo-file-system';

import type { TileStore } from './tileCache';

const INDEX_FILE = 'index.json';
const INDEX_TEMP_FILE = 'index.json.tmp';
/** The only names this cache ever writes, so cleanup can never touch anything else. */
const TILE_FILE_PATTERN = /^[0-9a-f]{8}-\d+-\d+-\d+-[0-9a-z]+\.tile$/;

/**
 * Tiles live in the OS cache directory, apart from the SQLite database and the
 * managed scan images, so clearing or evicting them can never remove GPS
 * coordinates, polygons, Scan Records or Field Reports. The OS may purge this
 * directory under storage pressure; the cache treats that as a plain miss.
 */
function directory() {
  const dir = new Directory(Paths.cache, 'map-tiles');
  if (!dir.exists) dir.create({ idempotent: true, intermediates: true });
  return dir;
}

export const expoTileStore: TileStore = {
  freeDiskBytes() {
    try {
      const free = Paths.availableDiskSpace;
      return Number.isFinite(free) ? free : null;
    } catch {
      return null;
    }
  },
  listTileFiles() {
    try {
      return directory()
        .list()
        .filter((item) => item instanceof File && TILE_FILE_PATTERN.test(item.name))
        .map((item) => item.name);
    } catch {
      return [];
    }
  },
  async loadIndex() {
    const file = new File(directory(), INDEX_FILE);
    return file.exists ? file.text() : null;
  },
  removeTileFile(name) {
    if (!TILE_FILE_PATTERN.test(name)) return;
    try {
      const file = new File(directory(), name);
      if (file.exists) file.delete();
    } catch {
      // Best effort: an orphan is removed on the next start.
    }
  },
  async saveIndex(json) {
    const temporary = new File(directory(), INDEX_TEMP_FILE);
    if (temporary.exists) temporary.delete();
    temporary.create();
    await temporary.write(json);
    await temporary.move(new File(directory(), INDEX_FILE), { overwrite: true });
  },
  tileFileSize(name) {
    if (!TILE_FILE_PATTERN.test(name)) return null;
    try {
      const file = new File(directory(), name);
      return file.exists ? file.size : null;
    } catch {
      return null;
    }
  },
  uri(name) {
    return new File(directory(), name).uri;
  },
  async writeTileFile(name, bytes) {
    const file = new File(directory(), name);
    if (file.exists) file.delete();
    file.create();
    await file.write(bytes);
  },
};
