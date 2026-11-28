import { fieldSurveyMeasurementMigration } from '../../../../../test/fieldSurveyMeasurementMigration';
import { readFileSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import type { SQLiteDatabase, SQLiteStatement } from 'expo-sqlite';

import { EMPTY_DATABASE } from '@/database/DatabaseProvider';
import type { CaneGuardDatabase } from '@/database/database';
import * as schema from '@/database/schema';
import { apiRequest } from '@/features/shared/api/apiClient';
import { markFieldSurveyPending, findOwnedFieldSurvey, saveFieldSurveyDraft } from '@/features/surveys/data/fieldSurveyRepository';
import { ringArea, type SurveyPolygon, type SurveyWaypoint } from '@/features/surveys/domain/fieldSurvey';
import { syncFieldSurvey } from '@/features/surveys/services/syncFieldSurvey';

jest.mock('@/features/shared/api/apiClient', () => ({
  ApiHttpError: class ApiHttpError extends Error {},
  apiRequest: jest.fn(),
}));

describe('syncFieldSurvey authentication gate', () => {
  it('never sends local measurements without an authenticated access token', async () => {
    await expect(syncFieldSurvey({
      clientUuid: 'survey-client-1',
      database: EMPTY_DATABASE,
      districtCode: 'D-01',
      ownerIdentity: 'owner-1',
      token: null,
    })).resolves.toMatchObject({ status: 'failed', error: { code: 'AUTH_REQUIRED' } });
    expect(apiRequest).not.toHaveBeenCalled();
  });
});

function openDatabase(): { database: CaneGuardDatabase; native: DatabaseSync } {
  const native = new DatabaseSync(':memory:');
  for (const migration of [
    '0019_add_field_surveys.sql',
    '0021_field_survey_affected_areas.sql',
    '0022_peaceful_titania.sql',
    '0023_affected_area_waypoints.sql',
    '0024_active_affected_waypoints.sql',
    '0025_field_survey_author_role.sql',
    '0037_net3_survey_provenance.sql',
    '0039_field_map_label_outline.sql',
  ]) {
    native.exec(readFileSync(`drizzle/${migration}`, 'utf8').replaceAll('--> statement-breakpoint', ''));
  }
  native.exec(fieldSurveyMeasurementMigration());
  const client = {
    prepareSync(sql: string) {
      const statement = native.prepare(sql);
      return {
        executeSync(params: unknown[] = []) {
          const result = statement.run(...(params as SQLInputValue[]));
          return { changes: Number(result.changes), lastInsertRowId: Number(result.lastInsertRowid), getAllSync: () => [], getFirstSync: () => null };
        },
        executeForRawResultSync(params: unknown[] = []) {
          const rows = statement.all(...(params as SQLInputValue[])) as Record<string, unknown>[];
          const columns = statement.columns();
          return { getAllSync: () => rows.map((row) => columns.map((column) => row[column.name])) };
        },
      } as unknown as SQLiteStatement;
    },
  } as unknown as SQLiteDatabase;
  return { database: drizzle(client, { schema }) as CaneGuardDatabase, native };
}

const plotPolygon: SurveyPolygon = {
  type: 'Polygon',
  coordinates: [[[120, 14], [120.001, 14], [120.001, 14.001], [120, 14.001], [120, 14]]],
};
const affectedPolygon: SurveyPolygon = {
  type: 'Polygon',
  coordinates: [[[120.0002, 14.0002], [120.0008, 14.0002], [120.0008, 14.0008], [120.0002, 14.0008], [120.0002, 14.0002]]],
};
const affectedWaypoints: SurveyWaypoint[] = [
  { latitude: 14.0002, longitude: 120.0002, source: 'gps', accuracyMeters: 3.4, capturedAt: '2026-10-31T02:00:00.000Z' },
  { latitude: 14.0002, longitude: 120.0008, source: 'gps', accuracyMeters: 5.1, capturedAt: '2026-10-31T02:01:00.000Z' },
  { latitude: 14.0008, longitude: 120.0008, source: 'map', accuracyMeters: null, capturedAt: '2026-10-31T02:02:00.000Z' },
  { latitude: 14.0008, longitude: 120.0002, source: 'gps', accuracyMeters: 2.8, capturedAt: '2026-10-31T02:03:00.000Z' },
];

const plotWaypoints: SurveyWaypoint[] = [
  { latitude: 14, longitude: 120, source: 'map', accuracyMeters: null, capturedAt: '2026-10-31T02:00:00.000Z' },
  { latitude: 14, longitude: 120.001, source: 'map', accuracyMeters: null, capturedAt: '2026-10-31T02:01:00.000Z' },
  { latitude: 14.001, longitude: 120.001, source: 'map', accuracyMeters: null, capturedAt: '2026-10-31T02:02:00.000Z' },
  { latitude: 14.001, longitude: 120, source: 'map', accuracyMeters: null, capturedAt: '2026-10-31T02:03:00.000Z' },
];

describe('syncFieldSurvey affected-area measurement state', () => {
  async function sendPlot(clientUuid: string, options: { affected?: boolean; zeroConfirmed?: boolean }) {
    const { database } = openDatabase();
    const polygons = options.affected ? [affectedPolygon] : [];
    const sets = options.affected ? [affectedWaypoints] : [];
    await saveFieldSurveyDraft(database, {
      authorRole: 'field_reporter',
      capturedAt: '2026-10-31T02:03:00.000Z',
      clientUuid,
      districtCode: 'D-01',
      ownerIdentity: 'owner-1',
      waypoints: plotWaypoints,
      affectedAreaPolygons: polygons,
      affectedAreaWaypoints: sets,
      affectedZeroConfirmed: options.zeroConfirmed,
    });
    markFieldSurveyPending(
      database, clientUuid, 'owner-1', 'D-01', plotPolygon, ringArea(plotPolygon.coordinates[0]), '2026-10-31T02:03:00.000Z',
      polygons, options.affected ? ringArea(affectedPolygon.coordinates[0]) : options.zeroConfirmed ? 0 : null, sets,
    );
    jest.mocked(apiRequest).mockResolvedValue({ id: 'remote-1', status: 'kept' });
    await syncFieldSurvey({ allowImmediateRetries: false, clientUuid, database, districtCode: 'D-01', ownerIdentity: 'owner-1', token: 'access-token' });
    return { body: JSON.parse(String(jest.mocked(apiRequest).mock.calls.at(-1)?.[1]?.body)), database };
  }

  // AC-4(a): a plot-only survey sends an unmeasured affected area, never a forced 0.
  it('sends null with not_measured for a plot-only survey', async () => {
    const { body } = await sendPlot('survey-plot-only', {});
    expect(body.affected_area_polygons).toEqual([]);
    expect(body.affected_area_sqm).toBeNull();
    expect(body.affected_area_measurement).toBe('not_measured');
    expect(body.area_sqm).toBeGreaterThan(11_900);
  });

  // AC-4(b): only an explicit confirmation sends 0, and it says it was measured.
  it('sends 0 with measured only for a confirmed no-affected-area survey', async () => {
    const { body } = await sendPlot('survey-zero', { zeroConfirmed: true });
    expect(body.affected_area_polygons).toEqual([]);
    expect(body.affected_area_sqm).toBe(0);
    expect(body.affected_area_measurement).toBe('measured');
  });

  it('sends the measured union with measured for drawn affected areas', async () => {
    const { body } = await sendPlot('survey-patch', { affected: true });
    expect(body.affected_area_sqm).toBeCloseTo(ringArea(affectedPolygon.coordinates[0]), 4);
    expect(body.affected_area_measurement).toBe('measured');
  });

  // AC-6: a row stored before the measurement state existed (a forced 0, no enum) still syncs, as not measured.
  it('syncs an older row that stored a forced 0 as not measured', async () => {
    const { database, native } = openDatabase();
    native.prepare(`INSERT INTO field_surveys (
      client_uuid, owner_identity, district_code, waypoints_json, polygon_json, area_sqm, affected_area_polygons_json,
      affected_area_sqm, affected_area_waypoints_json, active_affected_waypoints_json, captured_at, status, author_role, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      'legacy-forced-zero', 'owner-1', 'D-01', JSON.stringify(plotWaypoints), JSON.stringify(plotPolygon), ringArea(plotPolygon.coordinates[0]),
      '[]', 0, '[]', '[]', '2026-10-31T02:03:00.000Z', 'pending', 'field_reporter', '2026-10-31T02:03:00.000Z', '2026-10-31T02:03:00.000Z',
    );
    jest.mocked(apiRequest).mockResolvedValue({ id: 'remote-legacy', status: 'kept' });

    await expect(syncFieldSurvey({
      allowImmediateRetries: false, clientUuid: 'legacy-forced-zero', database, districtCode: 'D-01', ownerIdentity: 'owner-1', token: 'access-token',
    })).resolves.toEqual({ status: 'synced', remoteId: 'remote-legacy' });
    const body = JSON.parse(String(jest.mocked(apiRequest).mock.calls.at(-1)?.[1]?.body));
    expect(body.affected_area_sqm).toBeNull();
    expect(body.affected_area_measurement).toBe('not_measured');
    native.close();
  });
});

describe('syncFieldSurvey upload contract', () => {
  async function sendNamed(clientUuid: string, label: string | null, outlineFromRemoteId: string | null = null) {
    const { database } = openDatabase();
    const draft = await saveFieldSurveyDraft(database, {
      authorRole: 'field_reporter',
      capturedAt: '2026-10-31T02:03:00.000Z',
      clientUuid,
      districtCode: 'D-01',
      label,
      outlineFromRemoteId,
      ownerIdentity: 'owner-1',
      waypoints: affectedWaypoints,
      affectedAreaPolygons: [affectedPolygon],
      affectedAreaWaypoints: [affectedWaypoints],
    });
    markFieldSurveyPending(
      database, draft.clientUuid, 'owner-1', 'D-01', plotPolygon, ringArea(plotPolygon.coordinates[0]),
      '2026-10-31T02:03:00.000Z', [affectedPolygon], ringArea(affectedPolygon.coordinates[0]), [affectedWaypoints],
    );
    jest.mocked(apiRequest).mockResolvedValue({ id: 'remote-1', status: 'kept' });
    await syncFieldSurvey({
      allowImmediateRetries: false, clientUuid: draft.clientUuid, database, districtCode: 'D-01', ownerIdentity: 'owner-1', token: 'access-token',
    });
    return JSON.parse(String(jest.mocked(apiRequest).mock.calls.at(-1)?.[1]?.body));
  }

  // Intent: the name the inspector typed travels with the map, trimmed; a blank name is not sent at all.
  it('sends the typed field name trimmed and omits a blank one', async () => {
    expect((await sendNamed('survey-named', '  North lot  ')).label).toBe('North lot');
    expect(await sendNamed('survey-unnamed', '   ')).not.toHaveProperty('label');
    expect(await sendNamed('survey-null-name', null)).not.toHaveProperty('label');
  });

  // Intent: the earlier map an outline came from travels as provenance; an unsent or odd id is simply left out.
  it('sends the earlier map id only when it is the office id of a sent map', async () => {
    expect((await sendNamed('survey-reused', null, '41')).outline_from_survey_id).toBe(41);
    expect(await sendNamed('survey-no-source', null, null)).not.toHaveProperty('outline_from_survey_id');
    expect(await sendNamed('survey-odd-source', null, 'abc')).not.toHaveProperty('outline_from_survey_id');
  });

  it('uploads only the approved measurement provenance and keeps affected-area waypoint provenance local', async () => {
    const { database, native } = openDatabase();
    const draft = await saveFieldSurveyDraft(database, {
      authorRole: 'field_reporter',
      capturedAt: '2026-10-31T02:03:00.000Z',
      clientUuid: 'survey-wire-provenance',
      districtCode: 'D-01',
      ownerIdentity: 'owner-1',
      waypoints: affectedWaypoints,
      affectedAreaPolygons: [affectedPolygon],
      affectedAreaWaypoints: [affectedWaypoints],
    });
    markFieldSurveyPending(
      database,
      draft.clientUuid,
      'owner-1',
      'D-01',
      plotPolygon,
      ringArea(plotPolygon.coordinates[0]),
      '2026-10-31T02:03:00.000Z',
      [affectedPolygon],
      ringArea(affectedPolygon.coordinates[0]),
      [affectedWaypoints],
    );
    jest.mocked(apiRequest).mockResolvedValue({ id: 'remote-1', status: 'kept' });

    await expect(syncFieldSurvey({
      allowImmediateRetries: false,
      clientUuid: draft.clientUuid,
      database,
      districtCode: 'D-07',
      ownerIdentity: 'owner-1',
      token: 'access-token',
    })).resolves.toEqual({ status: 'synced', remoteId: 'remote-1' });

    const request = jest.mocked(apiRequest).mock.calls[0][1];
    const body = JSON.parse(String(request?.body));
    expect(body).not.toHaveProperty('affected_area_waypoints');
    // Intent (item 8): the account district is what leaves the phone, even for a row queued earlier.
    expect(body.district_code).toBe('D-07');
    expect(findOwnedFieldSurvey(database, draft.clientUuid, 'owner-1')?.districtCode).toBe('D-07');
    expect(Object.keys(body.measurement_provenance).sort()).toEqual([
      'affected_area_sqm',
      'affected_area_waypoint_provenance',
      'containment_tolerance_m',
      'method',
      'overlap_removed',
      'plot_area_sqm',
      'source_polygon_count',
    ]);
    expect(body.measurement_provenance).toMatchObject({
      method: 'wgs84-ellipsoid-geodesic',
      source_polygon_count: 1,
      overlap_removed: false,
      containment_tolerance_m: 5,
    });
    expect(body.measurement_provenance.affected_area_waypoint_provenance).toEqual([
      affectedWaypoints.map((waypoint) => ({
        source: waypoint.source,
        accuracy_meters: waypoint.accuracyMeters,
        captured_at: waypoint.capturedAt,
      })),
    ]);
    const pending = findOwnedFieldSurvey(database, draft.clientUuid, 'owner-1')!;
    expect(pending.affectedAreaWaypointsJson).toEqual(JSON.stringify([affectedWaypoints]));
    native.close();
  });
  it('keeps the walker-marked corner flag on the phone and never sends it', async () => {
    const { database, native } = openDatabase();
    const marked: SurveyWaypoint[] = affectedWaypoints.map((waypoint, index) => (index === 1 ? { ...waypoint, isCorner: true } : waypoint));
    const draft = await saveFieldSurveyDraft(database, {
      authorRole: 'field_reporter',
      capturedAt: '2026-10-31T02:03:00.000Z',
      clientUuid: 'survey-marked-points',
      districtCode: 'D-01',
      ownerIdentity: 'owner-1',
      waypoints: marked,
      affectedAreaPolygons: [affectedPolygon],
      affectedAreaWaypoints: [marked],
    });
    markFieldSurveyPending(
      database, draft.clientUuid, 'owner-1', 'D-01', plotPolygon, ringArea(plotPolygon.coordinates[0]),
      '2026-10-31T02:03:00.000Z', [affectedPolygon], ringArea(affectedPolygon.coordinates[0]), [marked],
    );
    jest.mocked(apiRequest).mockResolvedValue({ id: 'remote-2', status: 'kept' });

    await expect(syncFieldSurvey({
      allowImmediateRetries: false,
      clientUuid: draft.clientUuid,
      database,
      districtCode: 'D-01',
      ownerIdentity: 'owner-1',
      token: 'access-token',
    })).resolves.toEqual({ status: 'synced', remoteId: 'remote-2' });

    const body = String(jest.mocked(apiRequest).mock.calls.at(-1)?.[1]?.body);
    expect(body).not.toMatch(/is_?corner/i);
    const stored = findOwnedFieldSurvey(database, draft.clientUuid, 'owner-1')!;
    expect(JSON.parse(stored.affectedAreaWaypointsJson as string)[0][1]).toMatchObject({ isCorner: true });
    native.close();
  });
});
