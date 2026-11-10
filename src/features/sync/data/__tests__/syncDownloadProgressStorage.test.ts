import AsyncStorage from '@react-native-async-storage/async-storage';

import { StorageError } from '@/database/errors';
import {
  clearSyncDownloadProgress,
  createSyncDownloadProgressStore,
} from '@/features/sync/data/syncDownloadProgressStorage';

describe('sync download progress storage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('returns the stored pages only to the owner and feed that saved them', async () => {
    await createSyncDownloadProgressStore('owner-1', 'authority_status').save('{"page":2}');

    await expect(
      createSyncDownloadProgressStore('owner-1', 'authority_status').read(),
    ).resolves.toBe('{"page":2}');
    await expect(
      createSyncDownloadProgressStore('owner-2', 'authority_status').read(),
    ).resolves.toBeNull();
    await expect(
      createSyncDownloadProgressStore('owner-1', 'notifications').read(),
    ).resolves.toBeNull();
  });

  it('replaces the stored pages with the latest continuation', async () => {
    const store = createSyncDownloadProgressStore('owner-1', 'authority_status');

    await store.save('{"page":2}');
    await store.save('{"page":3}');

    await expect(store.read()).resolves.toBe('{"page":3}');
  });

  it('clears only the progress it was scoped to', async () => {
    const first = createSyncDownloadProgressStore('owner-1', 'authority_status');
    const second = createSyncDownloadProgressStore('owner-2', 'authority_status');
    await first.save('{"page":2}');
    await second.save('{"page":2}');

    await first.clear();

    await expect(first.read()).resolves.toBeNull();
    await expect(second.read()).resolves.toBe('{"page":2}');
  });

  it('removes every stored download of one owner and leaves other owners alone', async () => {
    await createSyncDownloadProgressStore('owner-1', 'authority_status').save('{"page":2}');
    await createSyncDownloadProgressStore('owner-1', 'notifications').save('{"page":4}');
    await createSyncDownloadProgressStore('owner-2', 'authority_status').save('{"page":2}');

    await clearSyncDownloadProgress('owner-1');

    await expect(
      createSyncDownloadProgressStore('owner-1', 'authority_status').read(),
    ).resolves.toBeNull();
    await expect(
      createSyncDownloadProgressStore('owner-1', 'notifications').read(),
    ).resolves.toBeNull();
    await expect(
      createSyncDownloadProgressStore('owner-2', 'authority_status').read(),
    ).resolves.toBe('{"page":2}');
  });

  it('refuses an owner that cannot scope stored pages', () => {
    expect(() => createSyncDownloadProgressStore('   ', 'authority_status')).toThrow(StorageError);
  });
});
