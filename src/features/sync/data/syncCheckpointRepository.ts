import { and, eq } from 'drizzle-orm';

import type { CaneGuardDatabase } from '@/database/database';
import { StorageError, toStorageError } from '@/database/errors';
import { syncCheckpoints, type SyncCheckpointFeed } from '@/database/schema';

export interface SyncCheckpoint {
  feed: SyncCheckpointFeed;
  /** The server's opaque version stamp; null for feeds the server does not version. */
  version: string | null;
  total: number;
  truncated: boolean;
  pageCount: number;
  syncBefore: string;
  fetchedAt: string;
}

/** Pages needed to download `rows` rows; zero rows need no page beyond the first answer. */
export function derivePageCount(rows: number, pageSize: number): number {
  if (!Number.isInteger(rows) || rows < 0 || !Number.isInteger(pageSize) || pageSize < 1) {
    throw new StorageError('UPDATE_FAILED', 'The sync checkpoint page count inputs are invalid.');
  }
  return Math.ceil(rows / pageSize);
}

export async function readSyncCheckpoint(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  feed: SyncCheckpointFeed,
): Promise<SyncCheckpoint | null> {
  const owner = requireOwner(ownerIdentity);
  try {
    const row = await database
      .select()
      .from(syncCheckpoints)
      .where(and(eq(syncCheckpoints.ownerIdentity, owner), eq(syncCheckpoints.feed, feed)))
      .get();
    if (!row) return null;
    const { ownerIdentity: _owner, ...checkpoint } = row;
    return checkpoint;
  } catch (error: unknown) {
    throw toStorageError(error, 'QUERY_FAILED', 'Reading the sync checkpoint failed.');
  }
}

/**
 * Synchronous so it can run inside the transaction that replaces a feed's
 * cached rows: the rows and the memory of having downloaded them commit together.
 */
export function writeSyncCheckpoint(
  executor: Pick<CaneGuardDatabase, 'insert'>,
  ownerIdentity: string,
  checkpoint: SyncCheckpoint,
): void {
  const owner = requireOwner(ownerIdentity);
  const { feed, ...values } = checkpoint;
  executor
    .insert(syncCheckpoints)
    .values({ ownerIdentity: owner, feed, ...values })
    .onConflictDoUpdate({
      target: [syncCheckpoints.ownerIdentity, syncCheckpoints.feed],
      set: values,
    })
    .run();
}

function requireOwner(value: string): string {
  const owner = value.trim();
  if (!owner) throw new StorageError('UPDATE_FAILED', 'The sync checkpoint owner is invalid.');
  return owner;
}
