import { and, eq } from 'drizzle-orm';

import type { CaneGuardDatabase } from '@/database/database';
import { StorageError, toStorageError } from '@/database/errors';
import { syncDownloadProgresses, type SyncCheckpointFeed } from '@/database/schema';
import type { SyncDownloadProgressStore } from '@/features/sync/domain/syncDownloadProgressStore';

export function createSyncDownloadProgressStore(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  feed: SyncCheckpointFeed,
): SyncDownloadProgressStore {
  const owner = requireOwner(ownerIdentity);
  const scope = and(
    eq(syncDownloadProgresses.ownerIdentity, owner),
    eq(syncDownloadProgresses.feed, feed),
  );

  return {
    async read(): Promise<string | null> {
      try {
        const row = await database
          .select({ payload: syncDownloadProgresses.payload })
          .from(syncDownloadProgresses)
          .where(scope)
          .get();
        return row?.payload ?? null;
      } catch (error: unknown) {
        throw toStorageError(error, 'QUERY_FAILED', 'Reading the sync download progress failed.');
      }
    },

    async save(payload: string): Promise<void> {
      try {
        database
          .insert(syncDownloadProgresses)
          .values({ ownerIdentity: owner, feed, payload })
          .onConflictDoUpdate({
            target: [syncDownloadProgresses.ownerIdentity, syncDownloadProgresses.feed],
            set: { payload },
          })
          .run();
      } catch (error: unknown) {
        throw toStorageError(error, 'UPDATE_FAILED', 'Saving the sync download progress failed.');
      }
    },

    async clear(): Promise<void> {
      try {
        database.delete(syncDownloadProgresses).where(scope).run();
      } catch (error: unknown) {
        throw toStorageError(error, 'DELETE_FAILED', 'Clearing the sync download progress failed.');
      }
    },
  };
}

function requireOwner(value: string): string {
  const owner = value.trim();
  if (!owner) throw new StorageError('UPDATE_FAILED', 'The sync download progress owner is invalid.');
  return owner;
}
