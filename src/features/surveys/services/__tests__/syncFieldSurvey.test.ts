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
  ]) {
    native.exec(readFileSync(`drizzle/${migration}`, 'utf8').replaceAll('--> statement-breakpoint', ''));
  }
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

describe('syncFieldSurvey upload contract', () => {
  it('uploads only the approved measurement provenance and keeps affected-area waypoint provenance local', async () => {
    const { database, native } = openDatabase();
    const draft = await saveFieldSurveyDraft(database, {
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
      ownerIdentity: 'owner-1',
      token: 'access-token',
    })).resolves.toEqual({ status: 'synced', remoteId: 'remote-1' });

    const request = jest.mocked(apiRequest).mock.calls[0][1];
    const body = JSON.parse(String(request?.body));
    expect(body).not.toHaveProperty('affected_area_waypoints');
    expect(Object.keys(body.measurement_provenance).sort()).toEqual([
      'affected_area_sqm',
      'method',
      'overlap_removed',
      'plot_area_sqm',
      'source_polygon_count',
    ]);
    expect(body.measurement_provenance).toMatchObject({
      method: 'wgs84-ellipsoid-geodesic',
      source_polygon_count: 1,
      overlap_removed: false,
    });
    const pending = findOwnedFieldSurvey(database, draft.clientUuid, 'owner-1')!;
    expect(pending.affectedAreaWaypointsJson).toEqual(JSON.stringify([affectedWaypoints]));
    native.close();
  });
});
