import type { FieldSurveyRow, MeasurementProvenance } from '@/database/schema';
import {
  boundaryCanEdit,
  boundaryRetriesItself,
  boundaryState,
} from '@/features/surveys/domain/boundaryState';
import {
  measureAffectedAreas,
  validateAffectedAreaWaypoints,
  validateSurveyWaypoints,
  type SurveyPolygon,
  type SurveyWaypoint,
} from '@/features/surveys/domain/fieldSurvey';

export type AttachedBoundaryInput = Pick<
  FieldSurveyRow,
  | 'activeAffectedWaypointsJson'
  | 'affectedAreaPolygonsJson'
  | 'affectedAreaWaypointsJson'
  | 'capturedAt'
  | 'lastSyncErrorCode'
  | 'remoteId'
  | 'status'
  | 'waypointsJson'
> &
  /** Optional so rows read before the measurement state existed still fit; both absent reads as not measured. */
  Partial<Pick<FieldSurveyRow, 'affectedAreaMeasurement' | 'affectedAreaSqm'>>;

export interface AttachedBoundarySend {
  /** Null when only the plot was measured; 0 only for a confirmed "no affected area found". */
  affectedAreaSqm: number | null;
  affectedAreaWaypoints: SurveyWaypoint[][];
  affectedAreas: SurveyPolygon[];
  areaSqm: number;
  capturedAt: string;
  polygon: SurveyPolygon;
}

/**
 * `on_its_way` — the office already has it, or it retries without anyone pressing
 * a button. `queue` — it is still a local draft that must be queued now.
 * `blocked` — it is attached to a report but cannot be sent, so the report must wait.
 */
export type AttachedBoundarySendPlan =
  | { status: 'blocked' }
  | { status: 'on_its_way' }
  | { status: 'queue'; send: AttachedBoundarySend };

/**
 * True only when the inspector explicitly confirmed "no affected area found".
 * Older rows carry no measurement state, so their `[]` + 0 is never read as a confirmed zero.
 */
export function isConfirmedZeroSurvey(
  row: Pick<AttachedBoundaryInput, 'affectedAreaMeasurement' | 'affectedAreaSqm'>,
): boolean {
  return row.affectedAreaMeasurement === 'measured' && row.affectedAreaSqm === 0;
}

function jsonArray(text: string | null | undefined): unknown[] | null {
  if (text === null || text === undefined) return [];
  try {
    const parsed: unknown = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function asWaypoints(value: unknown): SurveyWaypoint[] | null {
  return Array.isArray(value) &&
    value.every((point) => typeof point === 'object' && point !== null)
    ? (value as SurveyWaypoint[])
    : null;
}

/**
 * "Send together": decides how an attached boundary travels with its report.
 * A boundary that can still be edited is queued with its current measurement; a
 * boundary the office will never receive without more work blocks the report.
 * The district always comes from the account, never from the stored draft.
 */
export function planAttachedBoundarySend(
  row: AttachedBoundaryInput,
  districtCode: string,
): AttachedBoundarySendPlan {
  const state = boundaryState(row);
  if (row.remoteId || state === 'sent') return { status: 'on_its_way' };
  if (!districtCode.trim()) {
    return { status: 'blocked' };
  }
  if (!boundaryCanEdit(state)) {
    return boundaryRetriesItself(state) || state === 'sending'
      ? { status: 'on_its_way' }
      : { status: 'blocked' };
  }
  const waypoints = asWaypoints(jsonArray(row.waypointsJson));
  if (!waypoints) return { status: 'blocked' };
  const plot = validateSurveyWaypoints(waypoints);
  if (!plot.valid) return { status: 'blocked' };
  const affectedAreaJson = jsonArray(row.affectedAreaPolygonsJson);
  if (affectedAreaJson === null) return { status: 'blocked' };
  const affectedAreas = affectedAreaJson as SurveyPolygon[];
  const affected = measureAffectedAreas(plot.polygon, affectedAreas, { confirmedZero: isConfirmedZeroSurvey(row) });
  if (!affected.valid) return { status: 'blocked' };
  const affectedAreaWaypointJson = jsonArray(row.affectedAreaWaypointsJson);
  if (affectedAreaWaypointJson === null) return { status: 'blocked' };
  const affectedAreaWaypoints: SurveyWaypoint[][] = [];
  for (const set of affectedAreaWaypointJson) {
    const points = asWaypoints(set);
    if (!points) return { status: 'blocked' };
    affectedAreaWaypoints.push(points);
  }
  if (!validateAffectedAreaWaypoints(affectedAreas, affectedAreaWaypoints).valid) {
    return { status: 'blocked' };
  }
  const activeAffectedWaypoints = jsonArray(row.activeAffectedWaypointsJson);
  if (activeAffectedWaypoints === null || activeAffectedWaypoints.length > 0) {
    return { status: 'blocked' };
  }
  return {
    status: 'queue',
    send: {
      affectedAreaSqm: affected.areaSqm,
      affectedAreaWaypoints,
      affectedAreas,
      areaSqm: plot.areaSqm,
      capturedAt: row.capturedAt,
      polygon: plot.polygon,
    },
  };
}

export interface MeasuredBoundaryArea {
  /** Drawn affected-area polygons; 0 means only the plot was measured (or none was found). */
  affectedAreaCount: number;
  /** Null when the affected ground was never measured; 0 only for a confirmed "none found". */
  affectedAreaSqm: number | null;
  areaSqm: number;
}

/**
 * The plot and affected-area measurement a report can reuse, or null while the
 * boundary is unfinished (too few points, an open affected area) or damaged.
 * Reuses the same checks that decide whether the boundary can be sent.
 */
export function measuredBoundaryArea(row: AttachedBoundaryInput): MeasuredBoundaryArea | null {
  const waypoints = asWaypoints(jsonArray(row.waypointsJson));
  if (!waypoints) return null;
  const plot = validateSurveyWaypoints(waypoints);
  if (!plot.valid) return null;
  const affectedAreas = jsonArray(row.affectedAreaPolygonsJson ?? null);
  if (affectedAreas === null) return null;
  const affected = measureAffectedAreas(plot.polygon, affectedAreas as SurveyPolygon[], {
    confirmedZero: isConfirmedZeroSurvey(row),
  });
  if (!affected.valid) return null;
  const active = jsonArray(row.activeAffectedWaypointsJson ?? null);
  if (active === null || active.length > 0) return null;
  return {
    affectedAreaCount: affectedAreas.length,
    affectedAreaSqm: affected.areaSqm,
    areaSqm: plot.areaSqm,
  };
}

/**
 * The share of the plot the inspector drew as affected, to one decimal. Null while the affected
 * ground is unmeasured or the plot has no area; 0 for a confirmed "none found". Same rule as the
 * office, so both screens agree.
 */
export function percentAffected(area: Pick<MeasuredBoundaryArea, 'affectedAreaSqm' | 'areaSqm'>): number | null {
  if (area.affectedAreaSqm === null || area.areaSqm <= 0) return null;
  return Math.round(Math.min(100, (area.affectedAreaSqm / area.areaSqm) * 100) * 10) / 10;
}

/** True when affected-area points were drawn but never closed into an area, which is why the map reads "not measured". */
export function hasOpenAffectedArea(row: AttachedBoundaryInput): boolean {
  const active = jsonArray(row.activeAffectedWaypointsJson ?? null);
  return active !== null && active.length > 0;
}

/** The identity of one saved state of a boundary; any edit to the boundary changes it. */
export function surveyRevisionOf(
  survey: { clientUuid: string; updatedAt: string } | null | undefined,
): string | null {
  return survey ? `${survey.clientUuid}@${survey.updatedAt}` : null;
}

/** Hectares to four decimals (0.0001 ha = 1 m²), so a 40 m² patch stays 0.004 and never rounds to 0. */
export function sqmToHectares(areaSqm: number): number {
  const hectares = Number((areaSqm / 10_000).toFixed(4));
  return areaSqm > 0 ? Math.max(0.0001, hectares) : hectares;
}

/** The three report figures a measured boundary yields, each paired with whether it was measured. */
export interface ReportMeasurements {
  affectedAreaHectares: number | null;
  affectedAreaMeasurement: MeasurementProvenance;
  affectedPortionMeasurement: MeasurementProvenance;
  affectedPortionPercent: number | null;
  plotAreaHectares: number | null;
  plotAreaMeasurement: MeasurementProvenance;
}

/** What a report carries when no boundary supplies a measurement. */
export const UNMEASURED_REPORT_MEASUREMENTS: ReportMeasurements = {
  affectedAreaHectares: null,
  affectedAreaMeasurement: 'not_measured',
  affectedPortionMeasurement: 'not_measured',
  affectedPortionPercent: null,
  plotAreaHectares: null,
  plotAreaMeasurement: 'not_measured',
};

/**
 * Report values from a boundary, kept apart: total plot area, affected ground area and the
 * affected share of the plot. A plot-only boundary yields a plot area with the affected
 * figures not measured (never the plot size, never 0); 0 appears only for a confirmed
 * "no affected area found". Null while the boundary is unfinished or damaged, so callers
 * clear survey-derived figures instead of keeping old ones.
 */
export function deriveReportMeasurementsFromSurvey(row: AttachedBoundaryInput): ReportMeasurements | null {
  const measured = measuredBoundaryArea(row);
  if (!measured) return null;
  const portion = percentAffected(measured);
  return {
    plotAreaHectares: sqmToHectares(measured.areaSqm),
    plotAreaMeasurement: 'measured',
    affectedAreaHectares: measured.affectedAreaSqm === null ? null : sqmToHectares(measured.affectedAreaSqm),
    affectedAreaMeasurement: measured.affectedAreaSqm === null ? 'not_measured' : 'measured',
    affectedPortionPercent: portion,
    affectedPortionMeasurement: portion === null ? 'not_measured' : 'measured',
  };
}
