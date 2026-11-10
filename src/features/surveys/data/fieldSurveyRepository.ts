import { and, desc, eq, inArray } from 'drizzle-orm';

import type { CaneGuardDatabase } from '@/database/database';
import { StorageError, toStorageError } from '@/database/errors';
import { requireOwnerIdentity } from '@/database/ownerIdentity';
import { fieldSurveys, type FieldSurveyRow, type FieldSurveyStatus } from '@/database/schema';
import type { MobileUserRole } from '@/features/auth/types';
import { boundaryCanDelete, boundaryCanEdit, boundaryCanSubmit, boundaryState } from '@/features/surveys/domain/boundaryState';
import { emitSyncRecordsChanged } from '@/features/sync/services/syncEvents';
import { measureAffectedAreas, validateAffectedAreaWaypoints, validateSurveyPolygon, type SurveyPolygon, type SurveyWaypoint } from '@/features/surveys/domain/fieldSurvey';

export interface FieldSurveyDraft {
  authorRole: MobileUserRole;
  capturedAt: string;
  clientUuid: string;
  districtCode: string;
  ownerIdentity: string;
  waypoints: SurveyWaypoint[];
  affectedAreaPolygons?: SurveyPolygon[];
  affectedAreaWaypoints?: SurveyWaypoint[][];
  activeAffectedWaypoints?: SurveyWaypoint[];
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
  if (existing && !boundaryCanEdit(boundaryState(existing))) {
    throw new StorageError('UPDATE_FAILED', 'A submitted field survey cannot be edited.');
  }
  try {
    if (existing) {
      database.update(fieldSurveys).set({
        authorRole: input.authorRole,
        districtCode: input.districtCode,
        waypointsJson: JSON.stringify(input.waypoints),
        affectedAreaPolygonsJson: JSON.stringify(input.affectedAreaPolygons ?? []),
        affectedAreaWaypointsJson: JSON.stringify(input.affectedAreaWaypoints ?? []),
        activeAffectedWaypointsJson: JSON.stringify(input.activeAffectedWaypoints ?? []),
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
        activeAffectedWaypointsJson: JSON.stringify(input.activeAffectedWaypoints ?? []),
        capturedAt: input.capturedAt,
        status: 'draft',
        authorRole: input.authorRole,
        createdAt: input.capturedAt,
        updatedAt: input.capturedAt,
      }).run();
    }
    emitSyncRecordsChanged();
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
  const state = boundaryState(row);
  if (state === 'sent' || row.remoteId) {
    throw new StorageError('UPDATE_FAILED', 'A synced field survey cannot be submitted again.');
  }
  if (state === 'identity_rejected') {
    throw new StorageError('UPDATE_FAILED', 'Start a new boundary to submit with a fresh identity.');
  }
  if (!boundaryCanSubmit(state)) {
    throw new StorageError('UPDATE_FAILED', 'This boundary cannot be submitted from its current state. Start a new boundary.');
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
    activeAffectedWaypointsJson: JSON.stringify([]),
    measurementProvenanceJson: JSON.stringify(affectedMeasurement.provenance),
    capturedAt,
    status: 'pending',
    fieldErrorsJson: null,
    lastSyncErrorCode: null,
    updatedAt: new Date().toISOString(),
  }).where(and(eq(fieldSurveys.clientUuid, clientUuid), eq(fieldSurveys.ownerIdentity, owner))).run();
  emitSyncRecordsChanged();
}

/** Statuses each sync write may start from; a row in any other status is left untouched. */
export const TRANSITIONS = {
  pending: ['syncing', 'failed'],
  syncing: ['pending', 'failed'],
  synced: ['syncing'],
  failed: ['pending', 'syncing', 'failed'],
} as const satisfies Record<'pending' | 'syncing' | 'synced' | 'failed', readonly FieldSurveyStatus[]>;

/** Returns the number of rows changed; 0 means the guard refused the write. */
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
): number {
  const owner = requireOwnerIdentity(ownerIdentity);
  const row = findOwnedFieldSurvey(database, clientUuid, owner);
  if (!row) throw new StorageError('RECORD_NOT_FOUND', 'This field survey no longer exists.');
  const result = database.update(fieldSurveys).set({
    status: update.status,
    ...(update.remoteId === undefined ? {} : { remoteId: update.remoteId }),
    ...(update.fieldErrors === undefined ? {} : { fieldErrorsJson: update.fieldErrors ? JSON.stringify(update.fieldErrors) : null }),
    lastSyncErrorCode: update.lastSyncErrorCode === undefined ? row.lastSyncErrorCode : update.lastSyncErrorCode,
    syncAttemptCount: row.syncAttemptCount + (update.status === 'syncing' ? 1 : 0),
    lastSyncedAt: update.status === 'synced' ? new Date().toISOString() : row.lastSyncedAt,
    updatedAt: new Date().toISOString(),
  }).where(and(
    eq(fieldSurveys.clientUuid, clientUuid),
    eq(fieldSurveys.ownerIdentity, owner),
    inArray(fieldSurveys.status, [...TRANSITIONS[update.status]]),
  )).run();
  if (result.changes > 0) emitSyncRecordsChanged();
  return result.changes;
}

/** Removes a draft boundary. Returns false when the row is missing, already queued, or already sent. */
export function deleteOwnedFieldSurvey(
  database: CaneGuardDatabase,
  clientUuid: string,
  ownerIdentity: string,
): boolean {
  const owner = requireOwnerIdentity(ownerIdentity);
  const row = findOwnedFieldSurvey(database, clientUuid, owner);
  if (!row || !boundaryCanDelete(boundaryState(row))) return false;
  try {
    const result = database.delete(fieldSurveys)
      .where(and(
        eq(fieldSurveys.clientUuid, clientUuid),
        eq(fieldSurveys.ownerIdentity, owner),
        eq(fieldSurveys.status, row.status),
      )).run();
    emitSyncRecordsChanged();
    return result.changes > 0;
  } catch (error: unknown) {
    throw toStorageError(error, 'UPDATE_FAILED', 'Deleting this boundary failed.');
  }
}
