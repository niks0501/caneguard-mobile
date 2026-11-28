import { outlineSourceId } from '@/features/surveys/domain/outlineReuse';
import type { CaneGuardDatabase } from '@/database/database';
import { findOwnedFieldSurvey, updateFieldSurveySyncResult } from '@/features/surveys/data/fieldSurveyRepository';
import { FieldSurveyValidationError, submitFieldSurvey, type FieldSurveyAffectedAreaWaypointProvenance, type FieldSurveyMeasurementProvenance } from '@/features/surveys/api/fieldSurveysApi';
import { isConfirmedZeroSurvey } from '@/features/surveys/domain/attachedBoundary';
import { measureAffectedAreas, validateAffectedAreaWaypoints, validateSurveyPolygon, type SurveyPolygon, type SurveyWaypoint } from '@/features/surveys/domain/fieldSurvey';
import { SyncError, toSyncError } from '@/features/sync/errors/syncErrors';
import type { SyncResult } from '@/features/sync/services/syncFieldReport';

export type FieldSurveySyncResult =
  | { status: 'synced' | 'already-synced'; remoteId: string }
  | { status: 'failed'; error: SyncError };

const RETRY_DELAYS_MS = [2_000, 5_000, 15_000] as const;

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function syncFieldSurvey(options: {
  allowImmediateRetries?: boolean;
  clientUuid: string;
  database: CaneGuardDatabase;
  delay?: (milliseconds: number) => Promise<void>;
  districtCode: string;
  isSendHeld?: () => boolean;
  onOutcome?: (result: SyncResult) => void;
  ownerIdentity: string;
  token: string | null;
}): Promise<FieldSurveySyncResult> {
  if (!options.token?.trim()) {
    return { status: 'failed', error: new SyncError('AUTH_REQUIRED', 'Sign in before sending saved boundaries.') };
  }
  const row = findOwnedFieldSurvey(options.database, options.clientUuid, options.ownerIdentity);
  if (!row?.polygonJson || row.areaSqm === null || row.status === 'draft') {
    return { status: 'failed', error: new SyncError('INVALID_LOCAL_RECORD', 'Finish and save a valid boundary before syncing.') };
  }
  if (row.status === 'synced' && row.remoteId) return { status: 'already-synced', remoteId: row.remoteId };

  let polygon: SurveyPolygon;
  let affectedAreaPolygons: SurveyPolygon[];
  let affectedAreaWaypoints: SurveyWaypoint[][];
  try {
    polygon = JSON.parse(row.polygonJson) as SurveyPolygon;
    affectedAreaPolygons = JSON.parse(row.affectedAreaPolygonsJson ?? '[]') as SurveyPolygon[];
    affectedAreaWaypoints = JSON.parse(row.affectedAreaWaypointsJson ?? '[]') as SurveyWaypoint[][];
  } catch {
    return rejectInvalidLocalRecord(options, 'The saved boundary geometry is invalid. Recreate the boundary before syncing.');
  }
  const plotMeasurement = validateSurveyPolygon(polygon);
  // Older rows stored a forced 0 for a plot-only survey; only an explicit confirmation keeps a zero.
  const affectedMeasurement = measureAffectedAreas(polygon, affectedAreaPolygons, { confirmedZero: isConfirmedZeroSurvey(row) });
  const waypointProvenance = validateAffectedAreaWaypoints(affectedAreaPolygons, affectedAreaWaypoints);
  if (!plotMeasurement.valid || !affectedMeasurement.valid || !waypointProvenance.valid ||
    Math.abs(plotMeasurement.areaSqm - row.areaSqm) > Math.max(0.01, row.areaSqm * 1e-10) ||
    !affectedAreaMatchesRow(affectedMeasurement.areaSqm, row.affectedAreaSqm)) {
    return rejectInvalidLocalRecord(options, 'The saved polygon measurements do not match their boundaries. Recreate the boundary before syncing.');
  }
  let measurementProvenance: Omit<FieldSurveyMeasurementProvenance, 'affected_area_waypoint_provenance'>;
  try {
    measurementProvenance = toWireProvenance(row.measurementProvenanceJson, affectedMeasurement.provenance);
  } catch {
    return rejectInvalidLocalRecord(options, 'The saved measurement provenance is invalid. Recreate the boundary before syncing.');
  }

  if (updateFieldSurveySyncResult(options.database, row.clientUuid, options.ownerIdentity, { status: 'syncing', districtCode: options.districtCode }) === 0) {
    // Another send already owns this row; leave its stored state alone.
    return { status: 'failed', error: new SyncError('UNKNOWN_SYNC_ERROR', 'This boundary is already being sent.') };
  }
  try {
    let response;
    let retryIndex = 0;
    while (true) {
      try {
        response = await submitFieldSurvey({
          client_uuid: row.clientUuid,
          ...(row.label?.trim() ? { label: row.label.trim().slice(0, 60) } : {}),
          ...(outlineSourceId(row.outlineFromRemoteId) === null ? {} : { outline_from_survey_id: outlineSourceId(row.outlineFromRemoteId) as number }),
          polygon,
          area_sqm: row.areaSqm,
          affected_area_polygons: affectedAreaPolygons,
          affected_area_sqm: affectedMeasurement.areaSqm,
          affected_area_measurement: affectedMeasurement.measurement,
          measurement_provenance: {
            ...measurementProvenance,
            affected_area_waypoint_provenance: toWireAffectedAreaWaypointProvenance(affectedAreaWaypoints),
          },
          captured_at: row.capturedAt,
          district_code: options.districtCode,
          ...(row.authorizationBasis === 'verified' || row.authorizationBasis === 'carryover'
            ? {
                authorization_basis: row.authorizationBasis,
                ...(row.capabilitiesVerifiedAt ? { capabilities_verified_at: row.capabilitiesVerifiedAt } : {}),
              }
            : {}),
        }, options.token);
        break;
      } catch (error: unknown) {
        const syncError = error instanceof FieldSurveyValidationError
          ? new SyncError('API_VALIDATION_FAILED', 'The server needs a correction to this boundary.')
          : toSyncError(error, { endpoint: 'boundary' });
        if (syncError.code === 'UPLOAD_TOO_LARGE' || !syncError.retryable || options.allowImmediateRetries === false || syncError.retryAfterMs !== null || retryIndex >= RETRY_DELAYS_MS.length) throw error;
        const waitFor = RETRY_DELAYS_MS[retryIndex];
        retryIndex += 1;
        await (options.delay ?? delay)(waitFor);
        if (options.isSendHeld?.()) throw error;
      }
    }
    options.onOutcome?.({ reportId: row.clientUuid, remoteId: response.id, status: 'synced' });
    updateFieldSurveySyncResult(options.database, row.clientUuid, options.ownerIdentity, {
      remoteId: response.id, status: 'synced', fieldErrors: null, lastSyncErrorCode: null,
    });
    return { status: 'synced', remoteId: response.id };
  } catch (error: unknown) {
    const conflict = error instanceof FieldSurveyValidationError && Boolean(error.fieldErrors.client_uuid?.length);
    const syncError = conflict
      ? new SyncError('CLIENT_UUID_CONFLICT', 'This boundary identity was rejected. Start a new boundary before sending again.')
      : error instanceof FieldSurveyValidationError
        ? new SyncError('API_VALIDATION_FAILED', 'The server needs a correction to this boundary.')
        : toSyncError(error, { endpoint: 'boundary' });
    options.onOutcome?.({ reportId: row.clientUuid, status: 'failed', error: syncError });
    updateFieldSurveySyncResult(options.database, row.clientUuid, options.ownerIdentity, {
      fieldErrors: error instanceof FieldSurveyValidationError ? error.fieldErrors : null,
      lastSyncErrorCode: syncError.code,
      status: 'failed',
    });
    return { status: 'failed', error: syncError };
  }
}

/** The stored affected figure matches the geometry; a legacy forced 0 on a plot-only row is not a mismatch. */
function affectedAreaMatchesRow(measuredSqm: number | null, storedSqm: number | null): boolean {
  if (measuredSqm === null) return storedSqm === null || storedSqm === 0;
  if (storedSqm === null) return false;
  return Math.abs(measuredSqm - storedSqm) <= Math.max(0.01, storedSqm * 1e-10);
}

function rejectInvalidLocalRecord(
  options: { clientUuid: string; database: CaneGuardDatabase; ownerIdentity: string },
  message: string,
): FieldSurveySyncResult {
  updateFieldSurveySyncResult(options.database, options.clientUuid, options.ownerIdentity, {
    lastSyncErrorCode: 'INVALID_LOCAL_RECORD',
    status: 'failed',
  });
  return { status: 'failed', error: new SyncError('INVALID_LOCAL_RECORD', message) };
}

function toWireProvenance(
  storedJson: string | null,
  computed: {
    method: 'wgs84-ellipsoid-geodesic';
    plotAreaSqm: number;
    affectedAreaSqm: number;
    sourcePolygonCount: number;
    overlapRemoved: boolean;
    containmentToleranceMeters: number;
  },
): Omit<FieldSurveyMeasurementProvenance, 'affected_area_waypoint_provenance'> {
  if (storedJson) {
    const stored = JSON.parse(storedJson) as typeof computed;
    if (stored.method !== computed.method || stored.plotAreaSqm !== computed.plotAreaSqm ||
      stored.affectedAreaSqm !== computed.affectedAreaSqm ||
      stored.sourcePolygonCount !== computed.sourcePolygonCount ||
      stored.overlapRemoved !== computed.overlapRemoved ||
      (stored.containmentToleranceMeters !== undefined &&
        stored.containmentToleranceMeters !== computed.containmentToleranceMeters)) {
      throw new Error('Stored provenance no longer matches the validated geometry.');
    }
  }
  // Legacy pending surveys predate provenance storage; use provenance
  // recalculated from their preserved source polygons and persisted figures.
  return {
    method: computed.method,
    plot_area_sqm: computed.plotAreaSqm,
    affected_area_sqm: computed.affectedAreaSqm,
    source_polygon_count: computed.sourcePolygonCount,
    overlap_removed: computed.overlapRemoved,
    containment_tolerance_m: computed.containmentToleranceMeters,
  };
}

function toWireAffectedAreaWaypointProvenance(waypointSets: SurveyWaypoint[][]): FieldSurveyAffectedAreaWaypointProvenance[][] {
  return waypointSets.map((waypoints) =>
    waypoints.map((waypoint) => ({
      source: waypoint.source,
      accuracy_meters: waypoint.accuracyMeters,
      captured_at: waypoint.capturedAt,
    })),
  );
}
