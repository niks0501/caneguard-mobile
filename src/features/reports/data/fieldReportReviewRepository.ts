import { and, asc, eq, isNotNull, isNull, lt, or, sql } from 'drizzle-orm';

import type { CaneGuardDatabase } from '@/database/database';
import { StorageError, toStorageError } from '@/database/errors';
import { fieldReports } from '@/database/schema';
import type { AuthorityReviewStatusUpdate } from '@/features/reports/domain/reportReviewTypes';

export interface ApplyAuthorityReviewResult {
  applied: number;
  eligible: number;
}

export async function findLastAuthorityReviewFetchedAt(
  database: CaneGuardDatabase,
  submitterIdentity: string,
): Promise<string | null> {
  try {
    const row = await database
      .select({ value: sql<string | null>`max(${fieldReports.authorityFetchedAt})` })
      .from(fieldReports)
      .where(
        and(
          eq(fieldReports.submitterIdentity, submitterIdentity.trim()),
          eq(fieldReports.authoringState, 'finalized'),
          eq(fieldReports.syncStatus, 'synced'),
          isNotNull(fieldReports.remoteId),
        ),
      )
      .get();
    return row?.value ?? null;
  } catch (error: unknown) {
    throw toStorageError(
      error,
      'QUERY_FAILED',
      'Reading authority review refresh state failed.',
    );
  }
}

export async function hasStaleAuthorityReviewCache(
  database: CaneGuardDatabase,
  submitterIdentity: string,
  staleBefore: string,
): Promise<boolean> {
  try {
    const row = await database
      .select({ id: fieldReports.id })
      .from(fieldReports)
      .where(
        and(
          eq(fieldReports.submitterIdentity, submitterIdentity.trim()),
          eq(fieldReports.authoringState, 'finalized'),
          eq(fieldReports.syncStatus, 'synced'),
          isNotNull(fieldReports.remoteId),
          or(
            isNull(fieldReports.authorityFetchedAt),
            lt(fieldReports.authorityFetchedAt, staleBefore),
          ),
        ),
      )
      .limit(1)
      .get();
    return Boolean(row);
  } catch (error: unknown) {
    throw toStorageError(
      error,
      'QUERY_FAILED',
      'Reading authority review cache freshness failed.',
    );
  }
}

export async function findLatestAuthorityReviewUpdatedAt(
  database: CaneGuardDatabase,
  submitterIdentity: string,
): Promise<string | null> {
  try {
    const row = await database
      .select({ value: sql<string | null>`max(${fieldReports.authorityUpdatedAt})` })
      .from(fieldReports)
      .where(
        and(
          eq(fieldReports.submitterIdentity, submitterIdentity.trim()),
          eq(fieldReports.authoringState, 'finalized'),
          eq(fieldReports.syncStatus, 'synced'),
          isNotNull(fieldReports.remoteId),
        ),
      )
      .get();
    return row?.value ?? null;
  } catch (error: unknown) {
    throw toStorageError(
      error,
      'QUERY_FAILED',
      'Reading the latest authority review update failed.',
    );
  }
}

export async function applyAuthorityReviewUpdates(
  database: CaneGuardDatabase,
  submitterIdentity: string,
  updates: AuthorityReviewStatusUpdate[],
  fetchedAt: string,
): Promise<ApplyAuthorityReviewResult> {
  const owner = submitterIdentity.trim();
  if (!owner || !fetchedAt || Number.isNaN(Date.parse(fetchedAt))) {
    throw new StorageError(
      'UPDATE_FAILED',
      'The authority review cache boundary is invalid.',
    );
  }

  const clientUuids = new Set<string>();
  const remoteUuids = new Set<string>();
  for (const update of updates) {
    if (
      !update.clientUuid.trim() ||
      !update.remoteUuid.trim() ||
      !update.rawStatus.trim() ||
      Number.isNaN(Date.parse(update.statusUpdatedAt))
    ) {
      throw new StorageError(
        'UPDATE_FAILED',
        'The authority review cache item is invalid.',
      );
    }
    if (clientUuids.has(update.clientUuid) || remoteUuids.has(update.remoteUuid)) {
      throw new StorageError(
        'UPDATE_FAILED',
        'The authority review cache contains duplicate identities.',
      );
    }
    clientUuids.add(update.clientUuid);
    remoteUuids.add(update.remoteUuid);
  }

  try {
    return database.transaction((transaction) => {
      const eligibleRows = transaction
        .select({
          authorityUpdatedAt: fieldReports.authorityUpdatedAt,
          id: fieldReports.id,
          remoteId: fieldReports.remoteId,
        })
        .from(fieldReports)
        .where(
          and(
            eq(fieldReports.submitterIdentity, owner),
            eq(fieldReports.authoringState, 'finalized'),
            eq(fieldReports.syncStatus, 'synced'),
            isNotNull(fieldReports.remoteId),
          ),
        )
        .orderBy(asc(fieldReports.id))
        .all();

      const eligibleWithIdentity = eligibleRows.filter(
        (row): row is typeof row & { remoteId: string } => Boolean(row.remoteId),
      );
      const eligibleByClient = new Map(
        eligibleWithIdentity.map((row) => [row.id, row]),
      );
      let applied = 0;

      // Stamp every eligible local report only after the complete server feed has
      // been validated. This gives an owner with no status row a durable refresh
      // boundary without fabricating an authority status.
      transaction
        .update(fieldReports)
        .set({ authorityFetchedAt: fetchedAt })
        .where(
          and(
            eq(fieldReports.submitterIdentity, owner),
            eq(fieldReports.authoringState, 'finalized'),
            eq(fieldReports.syncStatus, 'synced'),
            isNotNull(fieldReports.remoteId),
          ),
        )
        .run();

      for (const update of updates) {
        const local = eligibleByClient.get(update.clientUuid);
        if (!local || local.remoteId !== update.remoteUuid) {
          continue;
        }
        if (
          local.authorityUpdatedAt &&
          !isAtLeastAsNew(update.statusUpdatedAt, local.authorityUpdatedAt)
        ) {
          continue;
        }

        transaction
          .update(fieldReports)
          .set({
            authorityFeedback: update.feedback,
            authorityReferenceCode: update.referenceCode,
            authorityReviewedAt: update.reviewedAt,
            authorityStatusRaw: update.rawStatus,
            authorityUpdatedAt: update.statusUpdatedAt,
            authorityFetchedAt: fetchedAt,
          })
          .where(
            and(
              eq(fieldReports.id, update.clientUuid),
              eq(fieldReports.submitterIdentity, owner),
              eq(fieldReports.authoringState, 'finalized'),
              eq(fieldReports.syncStatus, 'synced'),
              eq(fieldReports.remoteId, update.remoteUuid),
            ),
          )
          .run();
        applied += 1;
      }

      return { applied, eligible: eligibleWithIdentity.length };
    });
  } catch (error: unknown) {
    throw toStorageError(
      error,
      'UPDATE_FAILED',
      'Applying authority review updates failed.',
    );
  }
}

function isAtLeastAsNew(incoming: string, cached: string): boolean {
  const incomingTime = Date.parse(incoming);
  const cachedTime = Date.parse(cached);
  return (
    !Number.isNaN(incomingTime) &&
    (Number.isNaN(cachedTime) || incomingTime >= cachedTime)
  );
}
