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

  // Proves: a superseded download cannot erase the pages a newer one stored.
  it('refuses to clear pages once the download was superseded', async () => {
    const superseded = createSyncDownloadProgressStore(
      'owner-1',
      'authority_status',
      () => false,
    );
    await storeFor('owner-1').save('{"page":3}');

    await superseded.clear();

    await expect(storeFor('owner-1').read()).resolves.toBe('{"page":3}');
  });

  // Proves: a write that was still running cannot outlive the owner's clear.
  it('removes a page whose write was pending when the owner clear began', async () => {
    const setItem = AsyncStorage.setItem;
    let finishWrite!: () => void;
    const writeGate = new Promise<void>((resolve) => {
      finishWrite = resolve;
    });
    const delayed = jest
      .spyOn(AsyncStorage, 'setItem')
      .mockImplementationOnce(async (key, value) => {
        await writeGate;
        await setItem.call(AsyncStorage, key, value);
      });

    let current = true;
    const store = createSyncDownloadProgressStore(
      'owner-1',
      'authority_status',
      () => current,
    );
    const write = store.save('{"page":2}');
    current = false;
    const clear = clearSyncDownloadProgress('owner-1');
    finishWrite();
    await clear;
    await write;

    delayed.mockRestore();
    await expect(storeFor('owner-1').read()).resolves.toBeNull();
  });

  // Proves: a scoped clear also waits out a write it did not start.
  it('removes a page whose write was pending for another store of the same owner', async () => {
    const setItem = AsyncStorage.setItem;
    let finishWrite!: () => void;
    const writeGate = new Promise<void>((resolve) => {
      finishWrite = resolve;
    });
    const delayed = jest
      .spyOn(AsyncStorage, 'setItem')
      .mockImplementationOnce(async (key, value) => {
        await writeGate;
        await setItem.call(AsyncStorage, key, value);
      });

    const write = storeFor('owner-1').save('{"page":2}');
    const clear = storeFor('owner-1').clear();
    finishWrite();
    await clear;
    await write;

    delayed.mockRestore();
    await expect(storeFor('owner-1').read()).resolves.toBeNull();
  });

  // Proves: a clear that waited for a write leaves the pages to the download that replaced it.
  it('leaves the stored pages when the download was superseded while the clear waited', async () => {
    const setItem = AsyncStorage.setItem;
    let finishWrite!: () => void;
    const writeGate = new Promise<void>((resolve) => {
      finishWrite = resolve;
    });
    const delayed = jest
      .spyOn(AsyncStorage, 'setItem')
      .mockImplementationOnce(async (key, value) => {
        await writeGate;
        await setItem.call(AsyncStorage, key, value);
      });

    let current = true;
    const store = createSyncDownloadProgressStore(
      'owner-1',
      'authority_status',
      () => current,
    );
    const write = store.save('{"page":2}');
    const clear = store.clear();
    current = false;
    finishWrite();
    await clear;
    await write;

    delayed.mockRestore();
    await expect(storeFor('owner-1').read()).resolves.toBe('{"page":2}');
  });

  // Proves: a write from a superseded download cannot land on top of a newer download's pages.
  it('stores a newer download after a superseded write that was still pending', async () => {
    const setItem = AsyncStorage.setItem;
    let finishWrite!: () => void;
    const writeGate = new Promise<void>((resolve) => {
      finishWrite = resolve;
    });
    const delayed = jest
      .spyOn(AsyncStorage, 'setItem')
      .mockImplementationOnce(async (key, value) => {
        await writeGate;
        await setItem.call(AsyncStorage, key, value);
      });

    let supersededCurrent = true;
    const superseded = createSyncDownloadProgressStore(
      'owner-1',
      'authority_status',
      () => supersededCurrent,
    );
    const pending = superseded.save('{"page":1}');
    supersededCurrent = false;

    const newer = storeFor('owner-1');
    const write = newer.save('{"page":2}');
    finishWrite();
    await Promise.all([pending, write]);

    delayed.mockRestore();
    await expect(storeFor('owner-1').read()).resolves.toBe('{"page":2}');
  });

  // Proves: an owner whose identity extends another's keeps its pages through that owner's clear.
  it('keeps the pages of an owner whose identity extends another owner', async () => {
    await storeFor('a').save('{"page":2}');
    await storeFor('a.authority_status').save('{"page":3}');

    await clearSyncDownloadProgress('a');

    await expect(storeFor('a').read()).resolves.toBeNull();
    await expect(storeFor('a.authority_status').read()).resolves.toBe('{"page":3}');
  });

  it('refuses an owner that cannot scope stored pages', () => {
    expect(() => storeFor('   ')).toThrow(StorageError);
  });
});
