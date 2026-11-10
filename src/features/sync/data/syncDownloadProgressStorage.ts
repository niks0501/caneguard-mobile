import AsyncStorage from '@react-native-async-storage/async-storage';

import { StorageError, toStorageError } from '@/database/errors';
import { SYNC_CHECKPOINT_FEEDS, type SyncCheckpointFeed } from '@/database/schema';
import type { SyncDownloadProgressStore } from '@/features/sync/domain/syncDownloadProgressStore';

const KEY_PREFIX = 'caneguard.syncDownloadProgress.v1';
const keyOperations = new Map<string, Promise<unknown>>();

function progressKey(owner: string, feed: SyncCheckpointFeed): string {
  return `${KEY_PREFIX}.${owner}.${feed}`;
}

export function createSyncDownloadProgressStore(
  ownerIdentity: string,
  feed: SyncCheckpointFeed,
  isCurrent: () => boolean,
): SyncDownloadProgressStore {
  const key = progressKey(requireOwner(ownerIdentity), feed);

  return {
    async read(): Promise<string | null> {
      try {
        return await enqueue(key, () => AsyncStorage.getItem(key));
      } catch (error: unknown) {
        throw toStorageError(error, 'QUERY_FAILED', 'Reading the sync download progress failed.');
      }
    },

    async save(payload: string): Promise<void> {
      if (!isCurrent()) return;
      try {
        await enqueue(key, () => AsyncStorage.setItem(key, payload));
      } catch (error: unknown) {
        throw toStorageError(error, 'UPDATE_FAILED', 'Saving the sync download progress failed.');
      }
    },

    async clear(): Promise<void> {
      if (!isCurrent()) return;
      try {
        await enqueue(key, async () => {
          if (!isCurrent()) return;
          await AsyncStorage.removeItem(key);
        });
      } catch (error: unknown) {
        throw toStorageError(error, 'DELETE_FAILED', 'Clearing the sync download progress failed.');
      }
    },
  };
}

/** Removes every stored download of one owner; the Settings clear actions own that boundary. */
export async function clearSyncDownloadProgress(ownerIdentity: string): Promise<void> {
  const owner = requireOwner(ownerIdentity);
  const keys = SYNC_CHECKPOINT_FEEDS.map((feed) => progressKey(owner, feed));
  try {
    await settleKeyOperations(keys);
    const stored = await AsyncStorage.getAllKeys();
    const owned = stored.filter((key) => keys.includes(key));
    if (owned.length > 0) {
      await AsyncStorage.multiRemove(owned);
    }
  } catch (error: unknown) {
    throw toStorageError(error, 'DELETE_FAILED', 'Clearing the sync download progress failed.');
  }
}

/** One stored download is only ever mutated by the operation queued before it. */
async function enqueue<T>(key: string, operation: () => Promise<T>): Promise<T> {
  const current = (keyOperations.get(key) ?? Promise.resolve()).then(operation);
  const tail = current.then(
    () => undefined,
    () => undefined,
  );
  keyOperations.set(key, tail);
  void tail.then(() => {
    if (keyOperations.get(key) === tail) keyOperations.delete(key);
  });
  return current;
}

async function settleKeyOperations(keys: readonly string[]): Promise<void> {
  const pending = keys.flatMap((key) => {
    const operation = keyOperations.get(key);
    return operation ? [operation] : [];
  });
  if (pending.length === 0) return;
  await Promise.allSettled(pending);
}

function requireOwner(value: string): string {
  const owner = value.trim();
  if (!owner) throw new StorageError('UPDATE_FAILED', 'The sync download progress owner is invalid.');
  return owner;
}
