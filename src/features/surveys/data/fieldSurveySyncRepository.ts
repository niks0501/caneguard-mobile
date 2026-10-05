import { and, asc, eq, inArray, isNull, lt, or, sql } from 'drizzle-orm';

import type { CaneGuardDatabase } from '@/database/database';
import { toStorageError } from '@/database/errors';
import { requireOwnerIdentity } from '@/database/ownerIdentity';
import { fieldSurveys } from '@/database/schema';
import { AUTO_RETRYABLE_SYNC_ERROR_CODES } from '@/features/sync/errors/syncErrors';
import { emitSyncRecordsChanged } from '@/features/sync/services/syncEvents';
import { isUploadableSubmissionArtifact } from '@/features/sync/domain/submissionArtifacts';
import { SYNC_RETRY_COOLDOWN_MS } from '@/features/reports/data/fieldReportSyncRepository';

export function findFieldSurveySyncCandidates(
  database: CaneGuardDatabase,
  ownerIdentity: string,
  limit: number,
  options: { failedBefore?: string; includeRetryableFailed?: boolean } = {},
) {
  const owner = requireOwnerIdentity(ownerIdentity);
  const failedBefore = options.failedBefore ?? new Date(Date.now() - SYNC_RETRY_COOLDOWN_MS).toISOString();
  const eligible = options.includeRetryableFailed
    ? or(
        eq(fieldSurveys.status, 'pending'),
        and(
          eq(fieldSurveys.status, 'failed'),
          inArray(fieldSurveys.lastSyncErrorCode, AUTO_RETRYABLE_SYNC_ERROR_CODES),
          lt(fieldSurveys.updatedAt, failedBefore),
        ),
      )
    : eq(fieldSurveys.status, 'pending');
  try {
    return database.select({ clientUuid: fieldSurveys.clientUuid, status: fieldSurveys.status })
      .from(fieldSurveys)
      .where(and(eq(fieldSurveys.ownerIdentity, owner), eligible))
      .orderBy(asc(fieldSurveys.capturedAt), asc(fieldSurveys.createdAt))
      .limit(Math.min(Math.max(Math.trunc(limit), 1), 100))
      .all()
      .filter((survey) => isUploadableSubmissionArtifact('field_survey', { status: survey.status }));
  } catch (error: unknown) {
    throw toStorageError(error, 'QUERY_FAILED', 'Reading pending field surveys failed.');
  }
}

export function countUnsyncedFieldSurveys(database: CaneGuardDatabase, ownerIdentity: string): number {
  const owner = requireOwnerIdentity(ownerIdentity);
  try {
    const row = database.select({ count: sql<number>`count(*)` }).from(fieldSurveys)
      .where(and(eq(fieldSurveys.ownerIdentity, owner), inArray(fieldSurveys.status, ['pending', 'syncing', 'failed'])))
      .get();
    return Number(row?.count ?? 0);
  } catch (error: unknown) {
    throw toStorageError(error, 'QUERY_FAILED', 'Counting pending field surveys failed.');
  }
}

export function findLastSuccessfulFieldSurveySyncAt(database: CaneGuardDatabase, ownerIdentity: string): string | null {
  const owner = requireOwnerIdentity(ownerIdentity);
  const row = database.select({ value: sql<string | null>`max(${fieldSurveys.lastSyncedAt})` })
    .from(fieldSurveys).where(eq(fieldSurveys.ownerIdentity, owner)).get();
  return row?.value ?? null;
}

export function resetStaleSyncingFieldSurveys(database: CaneGuardDatabase, ownerIdentity: string, staleBefore: string): void {
  const owner = requireOwnerIdentity(ownerIdentity);
  try {
    database.update(fieldSurveys).set({
      status: 'pending', lastSyncErrorCode: 'STALE_SYNC_RECOVERED', updatedAt: new Date().toISOString(),
    }).where(and(
      eq(fieldSurveys.ownerIdentity, owner), eq(fieldSurveys.status, 'syncing'),
      or(isNull(fieldSurveys.updatedAt), lt(fieldSurveys.updatedAt, staleBefore)),
    )).run();
    emitSyncRecordsChanged();
  } catch (error: unknown) {
    throw toStorageError(error, 'UPDATE_FAILED', 'Recovering interrupted field survey uploads failed.');
  }
}
