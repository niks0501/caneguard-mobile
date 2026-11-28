import { and, desc, eq, inArray } from 'drizzle-orm';

import type { CaneGuardDatabase } from '@/database/database';
import { StorageError, toStorageError } from '@/database/errors';
import { requireOwnerIdentity } from '@/database/ownerIdentity';
import { fieldReports, fieldSurveys, type FieldSurveyRow } from '@/database/schema';
import type { AuthoringProvenance } from '@/features/auth/domain/sessionState';
import type { MobileUserRole } from '@/features/auth/types';
import {
  deriveReportMeasurementsFromSurvey,
  planAttachedBoundarySend,
  UNMEASURED_REPORT_MEASUREMENTS,
} from '@/features/surveys/domain/attachedBoundary';
import { boundaryCanDelete, boundaryCanEdit, boundaryCanSubmit, boundaryState } from '@/features/surveys/domain/boundaryState';
import { SYNC_TRANSITIONS } from '@/features/sync/domain/outboxState';
import { emitSyncRecordsChanged } from '@/features/sync/services/syncEvents';
import { measureAffectedAreas, validateAffectedAreaWaypoints, validateSurveyPolygon, validateSurveyWaypoints, type SurveyPolygon, type SurveyWaypoint } from '@/features/surveys/domain/fieldSurvey';

export interface FieldSurveyDraft {
  authorRole: MobileUserRole;
  capturedAt: string;
  clientUuid: string;
  districtCode: string;
  /** Optional name the inspector typed; blank is stored as no name. */
  label?: string | null;
  /** Server id of the earlier map whose outline this one started from; kept once, never overwritten. */
  outlineFromRemoteId?: string | null;
  ownerIdentity: string;
  waypoints: SurveyWaypoint[];
  affectedAreaPolygons?: SurveyPolygon[];
  affectedAreaWaypoints?: SurveyWaypoint[][];
  activeAffectedWaypoints?: SurveyWaypoint[];
  /**
   * The inspector confirmed "no affected area found". Only meaningful while no affected polygon
   * is drawn; drawing one supersedes it. Never defaulted from empty polygons.
   */
  affectedZeroConfirmed?: boolean;
  /**
   * When this draft replaces a completed map attached to a Field Report, relink
   * the draft report in the same SQLite transaction so a process kill cannot
   * leave the report pointing at the old map.
   */
  relinkReport?: {
    reportId?: string | null;
    replacedSurveyUuid: string;
  } | null;
}

/**
 * The measurement columns a draft's geometry implies: the plot outline and area, the affected
 * area (null while unmeasured) and its measured / not-measured state. Recomputed on every draft
 * save so an edit can never leave the figures of an earlier shape behind; an unusable shape
 * clears them instead.
 */
function derivedMeasurementColumns(input: FieldSurveyDraft): {
  affectedAreaMeasurement: 'measured' | 'not_measured';
  affectedAreaSqm: number | null;
  areaSqm: number | null;
  measurementProvenanceJson: string | null;
  polygonJson: string | null;
} {
  const cleared = {
    affectedAreaMeasurement: 'not_measured' as const,
    affectedAreaSqm: null,
    areaSqm: null,
    measurementProvenanceJson: null,
    polygonJson: null,
  };
  const plot = validateSurveyWaypoints(input.waypoints);
  if (!plot.valid) return cleared;
  const affected = measureAffectedAreas(plot.polygon, input.affectedAreaPolygons ?? [], {
    confirmedZero: input.affectedZeroConfirmed === true,
  });
  if (!affected.valid) return { ...cleared, areaSqm: plot.areaSqm, polygonJson: JSON.stringify(plot.polygon) };
  return {
    affectedAreaMeasurement: affected.measurement,
    affectedAreaSqm: affected.areaSqm,
    areaSqm: plot.areaSqm,
    measurementProvenanceJson: JSON.stringify(affected.provenance),
    polygonJson: JSON.stringify(plot.polygon),
  };
}

/** The longest field name the office accepts. */
export const FIELD_NAME_MAX_LENGTH = 60;

function normalizeLabel(label: string | null | undefined): string | null {
  const trimmed = label?.trim().slice(0, FIELD_NAME_MAX_LENGTH) ?? '';
  return trimmed === '' ? null : trimmed;
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
    const derived = derivedMeasurementColumns(input);
    const saved = database.transaction((tx) => {
      const now = new Date().toISOString();
      if (existing) {
        tx.update(fieldSurveys).set({
          ...derived,
          authorRole: input.authorRole,
          districtCode: input.districtCode,
          label: normalizeLabel(input.label),
          ...(input.outlineFromRemoteId === undefined ? {} : { outlineFromRemoteId: input.outlineFromRemoteId }),
          waypointsJson: JSON.stringify(input.waypoints),
          affectedAreaPolygonsJson: JSON.stringify(input.affectedAreaPolygons ?? []),
          affectedAreaWaypointsJson: JSON.stringify(input.affectedAreaWaypoints ?? []),
          activeAffectedWaypointsJson: JSON.stringify(input.activeAffectedWaypoints ?? []),
          updatedAt: now,
        }).where(and(eq(fieldSurveys.clientUuid, input.clientUuid), eq(fieldSurveys.ownerIdentity, owner))).run();
      } else {
        tx.insert(fieldSurveys).values({
          ...derived,
          clientUuid: input.clientUuid,
          ownerIdentity: owner,
          districtCode: input.districtCode,
          label: normalizeLabel(input.label),
          outlineFromRemoteId: input.outlineFromRemoteId ?? null,
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

      const persisted = tx.select().from(fieldSurveys)
        .where(and(eq(fieldSurveys.clientUuid, input.clientUuid), eq(fieldSurveys.ownerIdentity, owner)))
        .get()!;

      const relink = input.relinkReport;
      if (relink?.replacedSurveyUuid && relink.replacedSurveyUuid !== input.clientUuid) {
        const measurements = deriveReportMeasurementsFromSurvey(persisted) ?? UNMEASURED_REPORT_MEASUREMENTS;
        const conditions = [
          eq(fieldReports.submitterIdentity, owner),
          eq(fieldReports.authoringState, 'draft'),
          inArray(fieldReports.fieldSurveyClientUuid, [relink.replacedSurveyUuid, input.clientUuid]),
        ];
        if (relink.reportId) {
          conditions.push(eq(fieldReports.id, relink.reportId));
        }
        tx.update(fieldReports).set({
          fieldSurveyClientUuid: input.clientUuid,
          ...measurements,
          updatedAt: now,
        }).where(and(...conditions)).run();
      }

      return persisted;
    });
    emitSyncRecordsChanged();
    return saved;
  } catch (error: unknown) {
    throw toStorageError(error, 'SAVE_TRANSACTION_FAILED', 'Saving this offline boundary failed.');
  }
}

export function findOwnedFieldSurvey(
  database: Pick<CaneGuardDatabase, 'select'>,
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
  limit?: number,
): FieldSurveyRow[] {
  const owner = requireOwnerIdentity(ownerIdentity);
  const query = database.select().from(fieldSurveys)
    .where(eq(fieldSurveys.ownerIdentity, owner))
    .orderBy(desc(fieldSurveys.updatedAt));
  return limit === undefined
    ? query.all()
    : query.limit(limit).all();
}

/** How many recent maps are read as candidates for reusing a plot outline. */
export const EARLIER_MAP_CANDIDATES = 30;

/**
 * The inspector's recent maps, read only to offer their plot edge for a new map. Kept apart from
 * `listOwnedFieldSurveys` so offering an outline can never be mistaken for resuming a draft.
 */
export function listEarlierMapRows(database: CaneGuardDatabase, ownerIdentity: string): FieldSurveyRow[] {
  return listOwnedFieldSurveys(database, ownerIdentity, EARLIER_MAP_CANDIDATES);
}

export function markFieldSurveyPending(
  database: Pick<CaneGuardDatabase, 'select' | 'update'>,
  clientUuid: string,
  ownerIdentity: string,
  districtCode: string,
  polygon: SurveyPolygon,
  areaSqm: number,
  capturedAt: string,
  affectedAreaPolygons: SurveyPolygon[] = [],
  /** Null while only the plot was measured; 0 only for a confirmed "no affected area found". */
  affectedAreaSqm: number | null = null,
  affectedAreaWaypoints: SurveyWaypoint[][] = [],
  provenance: AuthoringProvenance | null = null,
  notify: (() => void) | null = emitSyncRecordsChanged,
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
  const affectedMeasurement = measureAffectedAreas(polygon, affectedAreaPolygons, { confirmedZero: affectedAreaSqm === 0 });
  const affectedFigureMatches = affectedMeasurement.valid && (affectedMeasurement.areaSqm === null || affectedAreaSqm === null
    ? affectedMeasurement.areaSqm === affectedAreaSqm
    : Number.isFinite(affectedAreaSqm) && affectedAreaSqm >= 0 &&
      Math.abs(affectedMeasurement.areaSqm - affectedAreaSqm) <= Math.max(0.01, affectedAreaSqm * 1e-10));
  if (!affectedMeasurement.valid || !affectedFigureMatches) {
    throw new StorageError('INVALID_FIELD_REPORT', affectedMeasurement.valid ? 'The affected-area measurement does not match its boundary.' : affectedMeasurement.error.message);
  }
  const provenanceCheck = validateAffectedAreaWaypoints(affectedAreaPolygons, affectedAreaWaypoints);
  if (!provenanceCheck.valid) {
    throw new StorageError('INVALID_FIELD_REPORT', provenanceCheck.error.message);
  }
  database.update(fieldSurveys).set({
    districtCode,
    polygonJson: JSON.stringify(polygon),
    areaSqm,
    affectedAreaPolygonsJson: JSON.stringify(affectedAreaPolygons),
    affectedAreaSqm,
    affectedAreaMeasurement: affectedMeasurement.measurement,
    affectedAreaWaypointsJson: JSON.stringify(affectedAreaWaypoints),
    activeAffectedWaypointsJson: JSON.stringify([]),
    measurementProvenanceJson: JSON.stringify(affectedMeasurement.provenance),
    capturedAt,
    authorizationBasis: provenance?.basis ?? null,
    capabilitiesVerifiedAt: provenance?.verifiedAt ?? null,
    status: 'pending',
    fieldErrorsJson: null,
    lastSyncErrorCode: null,
    updatedAt: new Date().toISOString(),
  }).where(and(eq(fieldSurveys.clientUuid, clientUuid), eq(fieldSurveys.ownerIdentity, owner))).run();
  notify?.();
}

/**
 * "Send together": a report takes its attached boundary with it, so the boundary
 * is queued when it is still local work. Returns false when the boundary is no
 * longer on this phone or cannot be sent, so the report must not go without it.
 */
export function queueAttachedFieldSurvey(
  database: Pick<CaneGuardDatabase, 'select' | 'update'>,
  clientUuid: string,
  ownerIdentity: string,
  districtCode: string,
  provenance: AuthoringProvenance | null = null,
  notify: (() => void) | null = emitSyncRecordsChanged,
): boolean {
  const row = findOwnedFieldSurvey(database, clientUuid, ownerIdentity);
  if (!row) return false;
  const plan = planAttachedBoundarySend(row, districtCode);
  if (plan.status === 'blocked') return false;
  if (plan.status === 'queue') {
    const { send } = plan;
    markFieldSurveyPending(
      database, clientUuid, ownerIdentity, districtCode, send.polygon, send.areaSqm, send.capturedAt,
      send.affectedAreas, send.affectedAreaSqm, send.affectedAreaWaypoints, provenance, notify,
    );
  }
  return true;
}

/** Returns the number of rows changed; 0 means the guard refused the write. */
export function updateFieldSurveySyncResult(
  database: CaneGuardDatabase,
  clientUuid: string,
  ownerIdentity: string,
  update: {
    districtCode?: string;
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
    ...(update.districtCode === undefined ? {} : { districtCode: update.districtCode }),
    ...(update.remoteId === undefined ? {} : { remoteId: update.remoteId }),
    ...(update.fieldErrors === undefined ? {} : { fieldErrorsJson: update.fieldErrors ? JSON.stringify(update.fieldErrors) : null }),
    lastSyncErrorCode: update.lastSyncErrorCode === undefined ? row.lastSyncErrorCode : update.lastSyncErrorCode,
    syncAttemptCount: row.syncAttemptCount + (update.status === 'syncing' ? 1 : 0),
    lastSyncedAt: update.status === 'synced' ? new Date().toISOString() : row.lastSyncedAt,
    updatedAt: new Date().toISOString(),
  }).where(and(
    eq(fieldSurveys.clientUuid, clientUuid),
    eq(fieldSurveys.ownerIdentity, owner),
    inArray(fieldSurveys.status, [...SYNC_TRANSITIONS[update.status]]),
  )).run();
  if (result.changes > 0) emitSyncRecordsChanged();
  return result.changes;
}

/** Removes a draft boundary. Returns false when the row is missing or is in any other state. */
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
