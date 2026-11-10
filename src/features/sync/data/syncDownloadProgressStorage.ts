import AsyncStorage from '@react-native-async-storage/async-storage';

import { StorageError, toStorageError } from '@/database/errors';
import type { SyncCheckpointFeed } from '@/database/schema';
import type { SyncDownloadProgressStore } from '@/features/sync/domain/syncDownloadProgressStore';

const KEY_PREFIX = 'caneguard.syncDownloadProgress.v1';

export function createSyncDownloadProgressStore(
  ownerIdentity: string,
  feed: SyncCheckpointFeed,
  isCurrent: () => boolean,
): SyncDownloadProgressStore {
  const key = `${KEY_PREFIX}.${requireOwner(ownerIdentity)}.${feed}`;

  return {
    async read(): Promise<string | null> {
      try {
        return await AsyncStorage.getItem(key);
      } catch (error: unknown) {
        throw toStorageError(error, 'QUERY_FAILED', 'Reading the sync download progress failed.');
      }
    },

    async save(payload: string): Promise<void> {
      if (!isCurrent()) return;
      try {
        await AsyncStorage.setItem(key, payload);
      } catch (error: unknown) {
        throw toStorageError(error, 'UPDATE_FAILED', 'Saving the sync download progress failed.');
      }
    },

    async clear(): Promise<void> {
      if (!isCurrent()) return;
      try {
        await AsyncStorage.removeItem(key);
      } catch (error: unknown) {
        throw toStorageError(error, 'DELETE_FAILED', 'Clearing the sync download progress failed.');
      }
    },
  };
}

/** Removes every stored download of one owner; the Settings clear actions own that boundary. */
export async function clearSyncDownloadProgress(ownerIdentity: string): Promise<void> {
  const prefix = `${KEY_PREFIX}.${requireOwner(ownerIdentity)}.`;
  try {
    const keys = await AsyncStorage.getAllKeys();
    const owned = keys.filter((key) => key.startsWith(prefix));
    if (owned.length > 0) {
      await AsyncStorage.multiRemove(owned);
    }
  } catch (error: unknown) {
    throw toStorageError(error, 'DELETE_FAILED', 'Clearing the sync download progress failed.');
  }
}

function requireOwner(value: string): string {
  const owner = value.trim();
  if (!owner) throw new StorageError('UPDATE_FAILED', 'The sync download progress owner is invalid.');
  return owner;
}
