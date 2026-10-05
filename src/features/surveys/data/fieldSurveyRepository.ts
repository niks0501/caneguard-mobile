import { and, desc, eq } from 'drizzle-orm';

import type { CaneGuardDatabase } from '@/database/database';
import { StorageError, toStorageError } from '@/database/errors';
import { requireOwnerIdentity } from '@/database/ownerIdentity';
import { fieldSurveys, type FieldSurveyRow } from '@/database/schema';
import type { SurveyPolygon, SurveyWaypoint } from '@/features/surveys/domain/fieldSurvey';

export interface FieldSurveyDraft {
  capturedAt: string;
  clientUuid: string;
  districtCode: string;
  ownerIdentity: string;
  waypoints: SurveyWaypoint[];
}

export async function saveFieldSurveyDraft(
  database: CaneGuardDatabase,
  input: FieldSurveyDraft,
): Promise<FieldSurveyRow> {
  const owner = requireOwnerIdentity(input.ownerIdentity);
  const existing = database
    .select()
    .from(fieldSurveys)
    .where(and(eq(fieldSurveys.clientUuid, input.clientUuid), eq(fieldSurveys.ownerIdentity, owner)))
    .get();
  if (existing && existing.status !== 'draft' && existing.status !== 'failed') {
    throw new StorageError('UPDATE_FAILED', 'A submitted field survey cannot be edited.');
  }
  try {
    if (existing) {
      database.update(fieldSurveys).set({
        districtCode: input.districtCode,
        waypointsJson: JSON.stringify(input.waypoints),
        updatedAt: new Date().toISOString(),
      }).where(and(eq(fieldSurveys.clientUuid, input.clientUuid), eq(fieldSurveys.ownerIdentity, owner))).run();
    } else {
      database.insert(fieldSurveys).values({
        clientUuid: input.clientUuid,
        ownerIdentity: owner,
        districtCode: input.districtCode,
        waypointsJson: JSON.stringify(input.waypoints),
        capturedAt: input.capturedAt,
        status: 'draft',
        createdAt: input.capturedAt,
        updatedAt: input.capturedAt,
      }).run();
    }
    return findOwnedFieldSurvey(database, input.clientUuid, owner)!;
  } catch (error: unknown) {
    throw toStorageError(error, 'SAVE_TRANSACTION_FAILED', 'Saving this offline boundary failed.');
  }
}

export function findOwnedFieldSurvey(
  database: CaneGuardDatabase,
  clientUuid: string,
  ownerIdentity: string,
): FieldSurveyRow | null {
  const owner = requireOwnerIdentity(ownerIdentity);
  return database.select().from(fieldSurveys)
    .where(and(eq(fieldSurveys.clientUuid, clientUuid), eq(fieldSurveys.ownerIdentity, owner)))
    .get() ?? null;
}

export function listOwnedFieldSurveys(
  database: CaneGuardDatabase,
  ownerIdentity: string,
): FieldSurveyRow[] {
  const owner = requireOwnerIdentity(ownerIdentity);
  return database.select().from(fieldSurveys)
    .where(eq(fieldSurveys.ownerIdentity, owner))
    .orderBy(desc(fieldSurveys.updatedAt))
    .limit(20)
    .all();
}

export function markFieldSurveyPending(
  database: CaneGuardDatabase,
  clientUuid: string,
  ownerIdentity: string,
  polygon: SurveyPolygon,
  areaSqm: number,
  capturedAt: string,
): void {
  const owner = requireOwnerIdentity(ownerIdentity);
  const row = findOwnedFieldSurvey(database, clientUuid, owner);
  if (!row) throw new StorageError('RECORD_NOT_FOUND', 'This boundary draft no longer exists.');
  if (row.status === 'synced' || row.remoteId) {
    throw new StorageError('UPDATE_FAILED', 'A synced field survey cannot be submitted again.');
  }
  if (!Number.isFinite(areaSqm) || areaSqm <= 0) {
    throw new StorageError('INVALID_FIELD_REPORT', 'The boundary has no valid measured area.');
  }
  database.update(fieldSurveys).set({
    polygonJson: JSON.stringify(polygon),
    areaSqm,
    capturedAt,
    status: 'pending',
    fieldErrorsJson: null,
    lastSyncErrorCode: null,
    updatedAt: new Date().toISOString(),
  }).where(and(eq(fieldSurveys.clientUuid, clientUuid), eq(fieldSurveys.ownerIdentity, owner))).run();
}

export function updateFieldSurveySyncResult(
  database: CaneGuardDatabase,
  clientUuid: string,
  ownerIdentity: string,
  update: {
    fieldErrors?: Record<string, string[]> | null;
    lastSyncErrorCode?: string | null;
    remoteId?: string | null;
    status: 'pending' | 'syncing' | 'synced' | 'failed';
  },
): void {
  const owner = requireOwnerIdentity(ownerIdentity);
  const row = findOwnedFieldSurvey(database, clientUuid, owner);
  if (!row) throw new StorageError('RECORD_NOT_FOUND', 'This field survey no longer exists.');
  database.update(fieldSurveys).set({
    status: update.status,
    ...(update.remoteId === undefined ? {} : { remoteId: update.remoteId }),
    ...(update.fieldErrors === undefined ? {} : { fieldErrorsJson: update.fieldErrors ? JSON.stringify(update.fieldErrors) : null }),
    lastSyncErrorCode: update.lastSyncErrorCode ?? null,
    syncAttemptCount: row.syncAttemptCount + (update.status === 'syncing' ? 1 : 0),
    lastSyncedAt: update.status === 'synced' ? new Date().toISOString() : row.lastSyncedAt,
    updatedAt: new Date().toISOString(),
  }).where(and(eq(fieldSurveys.clientUuid, clientUuid), eq(fieldSurveys.ownerIdentity, owner))).run();
}
