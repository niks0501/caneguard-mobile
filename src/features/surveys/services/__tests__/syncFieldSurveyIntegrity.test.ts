import { readFileSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import type { SQLiteDatabase, SQLiteStatement } from 'expo-sqlite';

import type { CaneGuardDatabase } from '@/database/database';
import * as schema from '@/database/schema';
import { fieldSurveys } from '@/database/schema';
import { apiRequest } from '@/features/shared/api/apiClient';
import { findOwnedFieldSurvey, markFieldSurveyPending, saveFieldSurveyDraft } from '@/features/surveys/data/fieldSurveyRepository';
import { ringArea, type SurveyPolygon, type SurveyWaypoint } from '@/features/surveys/domain/fieldSurvey';
import { syncFieldSurvey } from '@/features/surveys/services/syncFieldSurvey';

jest.mock('@/features/shared/api/apiClient', () => ({
  ApiHttpError: class ApiHttpError extends Error {},
  apiRequest: jest.fn(),
}));

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
const outsidePolygon: SurveyPolygon = {
  type: 'Polygon',
  coordinates: [[[120.002, 14.002], [120.003, 14.002], [120.003, 14.003], [120.002, 14.003], [120.002, 14.002]]],
};
const affectedWaypoints: SurveyWaypoint[] = [
  { latitude: 14.0002, longitude: 120.0002, source: 'gps', accuracyMeters: 3.4, capturedAt: '2026-10-31T02:00:00.000Z' },
  { latitude: 14.0002, longitude: 120.0008, source: 'gps', accuracyMeters: 5.1, capturedAt: '2026-10-31T02:01:00.000Z' },
  { latitude: 14.0008, longitude: 120.0008, source: 'map', accuracyMeters: null, capturedAt: '2026-10-31T02:02:00.000Z' },
  { latitude: 14.0008, longitude: 120.0002, source: 'gps', accuracyMeters: 2.8, capturedAt: '2026-10-31T02:03:00.000Z' },
];

async function pendingSurvey(database: CaneGuardDatabase, clientUuid: string) {
  const draft = await saveFieldSurveyDraft(database, {
    capturedAt: '2026-10-31T02:03:00.000Z',
    clientUuid,
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
  return draft;
}

beforeEach(() => jest.mocked(apiRequest).mockReset());

it('refuses to upload a saved boundary whose affected ring was corrupted to lie outside the plot', async () => {
  const { database, native } = openDatabase();
  const draft = await pendingSurvey(database, 'survey-corrupt-outside');
  database.update(fieldSurveys)
    .set({
      affectedAreaPolygonsJson: JSON.stringify([outsidePolygon]),
      affectedAreaSqm: ringArea(outsidePolygon.coordinates[0]),
    })
    .where(eq(fieldSurveys.clientUuid, draft.clientUuid))
    .run();

  await expect(syncFieldSurvey({
    allowImmediateRetries: false,
    clientUuid: draft.clientUuid,
    database,
    ownerIdentity: 'owner-1',
    token: 'access-token',
  })).resolves.toMatchObject({ status: 'failed', error: { code: 'INVALID_LOCAL_RECORD' } });

  expect(apiRequest).not.toHaveBeenCalled();
  expect(findOwnedFieldSurvey(database, draft.clientUuid, 'owner-1')).toMatchObject({
    status: 'failed',
    lastSyncErrorCode: 'INVALID_LOCAL_RECORD',
  });
  native.close();
});

it('refuses to upload a saved boundary whose stored measurement provenance was tampered with', async () => {
  const { database, native } = openDatabase();
  const draft = await pendingSurvey(database, 'survey-corrupt-provenance');
  const stored = JSON.parse(findOwnedFieldSurvey(database, draft.clientUuid, 'owner-1')!.measurementProvenanceJson!);
  database.update(fieldSurveys)
    .set({ measurementProvenanceJson: JSON.stringify({ ...stored, plotAreaSqm: stored.plotAreaSqm + 1_000 }) })
    .where(eq(fieldSurveys.clientUuid, draft.clientUuid))
    .run();

  await expect(syncFieldSurvey({
    allowImmediateRetries: false,
    clientUuid: draft.clientUuid,
    database,
    ownerIdentity: 'owner-1',
    token: 'access-token',
  })).resolves.toMatchObject({ status: 'failed', error: { code: 'INVALID_LOCAL_RECORD' } });

  expect(apiRequest).not.toHaveBeenCalled();
  native.close();
});

it('refuses to upload when the stored affected area no longer matches its boundary', async () => {
  const { database, native } = openDatabase();
  const draft = await pendingSurvey(database, 'survey-corrupt-area');
  const row = findOwnedFieldSurvey(database, draft.clientUuid, 'owner-1')!;
  database.update(fieldSurveys)
    .set({ affectedAreaSqm: (row.affectedAreaSqm ?? 0) + 500 })
    .where(eq(fieldSurveys.clientUuid, draft.clientUuid))
    .run();

  await expect(syncFieldSurvey({
    allowImmediateRetries: false,
    clientUuid: draft.clientUuid,
    database,
    ownerIdentity: 'owner-1',
    token: 'access-token',
  })).resolves.toMatchObject({ status: 'failed', error: { code: 'INVALID_LOCAL_RECORD' } });

  expect(apiRequest).not.toHaveBeenCalled();
  native.close();
});

it('uploads provenance only through the approved wire names', async () => {
  const { database, native } = openDatabase();
  const draft = await pendingSurvey(database, 'survey-wire-evidence');
  jest.mocked(apiRequest).mockResolvedValue({ id: 'remote-wire', status: 'kept' });

  await expect(syncFieldSurvey({
    allowImmediateRetries: false,
    clientUuid: draft.clientUuid,
    database,
    ownerIdentity: 'owner-1',
    token: 'access-token',
  })).resolves.toEqual({ status: 'synced', remoteId: 'remote-wire' });

  const body = JSON.parse(String(jest.mocked(apiRequest).mock.calls[0][1]?.body));
  expect(body).not.toHaveProperty('affected_area_waypoints');
  expect(body).not.toHaveProperty('affected_area_waypoint_provenance');
  expect(Object.keys(body.measurement_provenance).sort()).toEqual([
    'affected_area_sqm',
    'affected_area_waypoint_provenance',
    'containment_tolerance_m',
    'method',
    'overlap_removed',
    'plot_area_sqm',
    'source_polygon_count',
  ]);
  expect(body.affected_area_polygons).toHaveLength(1);
  expect(body.affected_area_sqm).toBeGreaterThan(0);
  native.close();
});
