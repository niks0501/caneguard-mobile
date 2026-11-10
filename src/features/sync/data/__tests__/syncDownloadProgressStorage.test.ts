import AsyncStorage from '@react-native-async-storage/async-storage';

import type { SyncCheckpointFeed } from '@/database/schema';
import { StorageError } from '@/database/errors';
import {
  clearSyncDownloadProgress,
  createSyncDownloadProgressStore,
} from '@/features/sync/data/syncDownloadProgressStorage';

function storeFor(owner: string, feed: SyncCheckpointFeed = 'authority_status') {
  return createSyncDownloadProgressStore(owner, feed, () => true);
}

describe('sync download progress storage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('returns the stored pages only to the owner and feed that saved them', async () => {
    await storeFor('owner-1').save('{"page":2}');

    await expect(storeFor('owner-1').read()).resolves.toBe('{"page":2}');
    await expect(storeFor('owner-2').read()).resolves.toBeNull();
    await expect(storeFor('owner-1', 'notifications').read()).resolves.toBeNull();
  });

  it('replaces the stored pages with the latest continuation', async () => {
    const store = storeFor('owner-1');

    await store.save('{"page":2}');
    await store.save('{"page":3}');

    await expect(store.read()).resolves.toBe('{"page":3}');
  });

  it('clears only the progress it was scoped to', async () => {
    const first = storeFor('owner-1');
    const second = storeFor('owner-2');
    await first.save('{"page":2}');
    await second.save('{"page":2}');

    await first.clear();

    await expect(first.read()).resolves.toBeNull();
    await expect(second.read()).resolves.toBe('{"page":2}');
  });

  it('removes every stored download of one owner and leaves other owners alone', async () => {
    await storeFor('owner-1').save('{"page":2}');
    await storeFor('owner-1', 'notifications').save('{"page":4}');
    await storeFor('owner-2').save('{"page":2}');

    await clearSyncDownloadProgress('owner-1');

    await expect(storeFor('owner-1').read()).resolves.toBeNull();
    await expect(storeFor('owner-1', 'notifications').read()).resolves.toBeNull();
    await expect(storeFor('owner-2').read()).resolves.toBe('{"page":2}');
  });

  // Proves: a download that outlives its owner's clear cannot recreate the cleared pages.
  it('refuses to store pages once the download was superseded', async () => {
    let current = true;
    const store = createSyncDownloadProgressStore(
      'owner-1',
      'authority_status',
      () => current,
    );
    await store.save('{"page":2}');

    current = false;
    await clearSyncDownloadProgress('owner-1');
    await store.save('{"page":3}');

    await expect(storeFor('owner-1').read()).resolves.toBeNull();
  });

  it('refuses an owner that cannot scope stored pages', () => {
    expect(() => storeFor('   ')).toThrow(StorageError);
  });
});
