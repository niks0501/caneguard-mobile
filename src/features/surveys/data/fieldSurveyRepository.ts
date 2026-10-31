import { and, desc, eq } from 'drizzle-orm';

import type { CaneGuardDatabase } from '@/database/database';
import { StorageError, toStorageError } from '@/database/errors';
import { requireOwnerIdentity } from '@/database/ownerIdentity';
import { fieldSurveys, type FieldSurveyRow } from '@/database/schema';
import { measureAffectedAreas, validateAffectedAreaWaypoints, validateSurveyPolygon, type SurveyPolygon, type SurveyWaypoint } from '@/features/surveys/domain/fieldSurvey';

export interface FieldSurveyDraft {
  capturedAt: string;
  clientUuid: string;
  districtCode: string;
  ownerIdentity: string;
  waypoints: SurveyWaypoint[];
  affectedAreaPolygons?: SurveyPolygon[];
  affectedAreaWaypoints?: SurveyWaypoint[][];
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
  const canCorrectRejectedSurvey = existing?.status === 'failed' &&
    (existing.lastSyncErrorCode === 'VALIDATION_FAILED' || existing.lastSyncErrorCode === 'API_VALIDATION_FAILED');
  if (existing && existing.status !== 'draft' && !canCorrectRejectedSurvey) {
    throw new StorageError('UPDATE_FAILED', 'A submitted field survey cannot be edited.');
  }
  try {
    if (existing) {
      database.update(fieldSurveys).set({
        districtCode: input.districtCode,
        waypointsJson: JSON.stringify(input.waypoints),
        affectedAreaPolygonsJson: JSON.stringify(input.affectedAreaPolygons ?? []),
        affectedAreaWaypointsJson: JSON.stringify(input.affectedAreaWaypoints ?? []),
        updatedAt: new Date().toISOString(),
      }).where(and(eq(fieldSurveys.clientUuid, input.clientUuid), eq(fieldSurveys.ownerIdentity, owner))).run();
    } else {
      database.insert(fieldSurveys).values({
        clientUuid: input.clientUuid,
        ownerIdentity: owner,
        districtCode: input.districtCode,
        waypointsJson: JSON.stringify(input.waypoints),
        affectedAreaPolygonsJson: JSON.stringify(input.affectedAreaPolygons ?? []),
        affectedAreaWaypointsJson: JSON.stringify(input.affectedAreaWaypoints ?? []),
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
  affectedAreaPolygons: SurveyPolygon[] = [],
  affectedAreaSqm = 0,
  affectedAreaWaypoints: SurveyWaypoint[][] = [],
): void {
  const owner = requireOwnerIdentity(ownerIdentity);
  const row = findOwnedFieldSurvey(database, clientUuid, owner);
  if (!row) throw new StorageError('RECORD_NOT_FOUND', 'This boundary draft no longer exists.');
  if (row.status === 'synced' || row.remoteId) {
    throw new StorageError('UPDATE_FAILED', 'A synced field survey cannot be submitted again.');
  }
  if (row.lastSyncErrorCode === 'CLIENT_UUID_CONFLICT') {
    throw new StorageError('UPDATE_FAILED', 'Start a new boundary to submit with a fresh identity.');
  }
  const plotMeasurement = validateSurveyPolygon(polygon);
  if (!plotMeasurement.valid || !Number.isFinite(areaSqm) || areaSqm <= 0 || Math.abs(plotMeasurement.areaSqm - areaSqm) > Math.max(0.01, areaSqm * 1e-10)) {
    throw new StorageError('INVALID_FIELD_REPORT', 'The boundary has no valid measured area.');
  }
  const affectedMeasurement = measureAffectedAreas(polygon, affectedAreaPolygons);
  if (!affectedMeasurement.valid || !Number.isFinite(affectedAreaSqm) || affectedAreaSqm < 0 || Math.abs(affectedMeasurement.areaSqm - affectedAreaSqm) > Math.max(0.01, affectedAreaSqm * 1e-10)) {
    throw new StorageError('INVALID_FIELD_REPORT', affectedMeasurement.valid ? 'The affected-area measurement does not match its boundary.' : affectedMeasurement.error.message);
  }
  const provenanceCheck = validateAffectedAreaWaypoints(affectedAreaPolygons, affectedAreaWaypoints);
  if (!provenanceCheck.valid) {
    throw new StorageError('INVALID_FIELD_REPORT', provenanceCheck.error.message);
  }
  database.update(fieldSurveys).set({
    polygonJson: JSON.stringify(polygon),
    areaSqm,
    affectedAreaPolygonsJson: JSON.stringify(affectedAreaPolygons),
    affectedAreaSqm,
    affectedAreaWaypointsJson: JSON.stringify(affectedAreaWaypoints),
    measurementProvenanceJson: JSON.stringify(affectedMeasurement.provenance),
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
    lastSyncErrorCode: update.lastSyncErrorCode === undefined ? row.lastSyncErrorCode : update.lastSyncErrorCode,
    syncAttemptCount: row.syncAttemptCount + (update.status === 'syncing' ? 1 : 0),
    lastSyncedAt: update.status === 'synced' ? new Date().toISOString() : row.lastSyncedAt,
    updatedAt: new Date().toISOString(),
  }).where(and(eq(fieldSurveys.clientUuid, clientUuid), eq(fieldSurveys.ownerIdentity, owner))).run();
}
