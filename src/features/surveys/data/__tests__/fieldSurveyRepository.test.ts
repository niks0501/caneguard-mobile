import { readFileSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import type { SQLiteDatabase, SQLiteStatement } from 'expo-sqlite';

import type { CaneGuardDatabase } from '@/database/database';
import * as schema from '@/database/schema';
import {
  countUnsyncedFieldSurveys,
  findFieldSurveySyncCandidates,
  resetStaleSyncingFieldSurveys,
} from '@/features/surveys/data/fieldSurveySyncRepository';
import {
  deleteOwnedFieldSurvey,
  findOwnedFieldSurvey,
  listOwnedFieldSurveys,
  markFieldSurveyPending,
  saveFieldSurveyDraft,
  updateFieldSurveySyncResult,
} from '@/features/surveys/data/fieldSurveyRepository';
import { ringArea, type SurveyWaypoint } from '@/features/surveys/domain/fieldSurvey';
import { subscribeSyncRecords } from '@/features/sync/services/syncEvents';

function openDatabase(): { database: CaneGuardDatabase; native: DatabaseSync } {
  const native = new DatabaseSync(':memory:');
  native.exec(readFileSync('drizzle/0019_add_field_surveys.sql', 'utf8').replaceAll('--> statement-breakpoint', ''));
  native.exec(readFileSync('drizzle/0021_field_survey_affected_areas.sql', 'utf8').replaceAll('--> statement-breakpoint', ''));
  native.exec(readFileSync('drizzle/0022_peaceful_titania.sql', 'utf8').replaceAll('--> statement-breakpoint', ''));
  native.exec(readFileSync('drizzle/0023_affected_area_waypoints.sql', 'utf8').replaceAll('--> statement-breakpoint', ''));
  native.exec(readFileSync('drizzle/0024_active_affected_waypoints.sql', 'utf8').replaceAll('--> statement-breakpoint', ''));
  native.exec(readFileSync('drizzle/0025_field_survey_author_role.sql', 'utf8').replaceAll('--> statement-breakpoint', ''));
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

const waypoint: SurveyWaypoint = {
  accuracyMeters: null,
  capturedAt: '2026-10-05T09:00:00.000Z',
  latitude: 14,
  longitude: 120,
  source: 'map',
};
const polygon = { type: 'Polygon' as const, coordinates: [[[120, 14], [120.001, 14], [120.001, 14.001], [120, 14.001], [120, 14]]] };
const plotAreaSqm = ringArea(polygon.coordinates[0]);

describe('field survey local repository', () => {
  it('persists owner-scoped offline drafts and retains one client UUID through sync retries', async () => {
    const { database, native } = openDatabase();
    const draft = await saveFieldSurveyDraft(database, {
      authorRole: 'field_reporter',
      capturedAt: waypoint.capturedAt,
      clientUuid: 'survey-client-1',
      districtCode: 'D-01',
      ownerIdentity: 'owner-1',
      waypoints: [waypoint],
    });
    expect(draft.status).toBe('draft');
    expect(findOwnedFieldSurvey(database, 'survey-client-1', 'owner-2')).toBeNull();
    expect(listOwnedFieldSurveys(database, 'owner-1')).toHaveLength(1);

    const provenance = { method: 'wgs84-ellipsoid-geodesic', plotAreaSqm, affectedAreaSqm: plotAreaSqm, sourcePolygonCount: 1, overlapRemoved: false, containmentToleranceMeters: 5 };
    const affectedWaypointsForPlot = [
      { latitude: 14, longitude: 120, source: 'map' as const, accuracyMeters: null, capturedAt: '2026-10-05T09:00:00.000Z' },
      { latitude: 14, longitude: 120.001, source: 'gps' as const, accuracyMeters: 3.4, capturedAt: '2026-10-05T09:00:01.000Z' },
      { latitude: 14.001, longitude: 120.001, source: 'gps' as const, accuracyMeters: 3.1, capturedAt: '2026-10-05T09:00:02.000Z' },
      { latitude: 14.001, longitude: 120, source: 'map' as const, accuracyMeters: null, capturedAt: '2026-10-05T09:00:03.000Z' },
    ];
    markFieldSurveyPending(database, draft.clientUuid, 'owner-1', polygon, plotAreaSqm, waypoint.capturedAt, [polygon], plotAreaSqm, [affectedWaypointsForPlot]);
    expect(findOwnedFieldSurvey(database, draft.clientUuid, 'owner-1')).toMatchObject({ status: 'pending', areaSqm: plotAreaSqm, affectedAreaSqm: plotAreaSqm, capturedAt: waypoint.capturedAt });
    expect(JSON.parse(findOwnedFieldSurvey(database, draft.clientUuid, 'owner-1')!.measurementProvenanceJson!)).toEqual(provenance);
    updateFieldSurveySyncResult(database, draft.clientUuid, 'owner-1', {
      status: 'failed',
      fieldErrors: { polygon: ['Move the boundary inside the assigned plot.'] },
      lastSyncErrorCode: 'API_VALIDATION_FAILED',
    });
    expect(JSON.parse(findOwnedFieldSurvey(database, draft.clientUuid, 'owner-1')!.fieldErrorsJson!)).toEqual({
      polygon: ['Move the boundary inside the assigned plot.'],
    });
    updateFieldSurveySyncResult(database, draft.clientUuid, 'owner-1', { status: 'syncing' });
    updateFieldSurveySyncResult(database, draft.clientUuid, 'owner-1', { status: 'pending', lastSyncErrorCode: 'UPLOAD_FAILED' });
    updateFieldSurveySyncResult(database, draft.clientUuid, 'owner-1', { status: 'syncing' });
    updateFieldSurveySyncResult(database, draft.clientUuid, 'owner-1', { status: 'synced', remoteId: 'remote-1' });
    expect(findOwnedFieldSurvey(database, draft.clientUuid, 'owner-1')).toMatchObject({ status: 'synced', remoteId: 'remote-1', syncAttemptCount: 2 });
    expect(native.prepare('SELECT client_uuid FROM field_surveys').get()).toEqual({ client_uuid: 'survey-client-1' });
    native.close();
  });

  // Intent: My boundaries reaches older drafts, while callers that only want a short list stay bounded.
  it('returns every stored boundary unless a limit is asked for', async () => {
    const { database, native } = openDatabase();
    for (const [index, id] of ['s-1', 's-2', 's-3'].entries()) {
      await saveFieldSurveyDraft(database, {
        authorRole: 'field_reporter',
        capturedAt: `2026-10-05T09:00:0${index}.000Z`,
        clientUuid: id,
        districtCode: 'D-01',
        ownerIdentity: 'owner-1',
        waypoints: [waypoint],
      });
    }
    expect(listOwnedFieldSurveys(database, 'owner-1').map((row) => row.clientUuid)).toEqual(['s-3', 's-2', 's-1']);
    expect(listOwnedFieldSurveys(database, 'owner-1', 2).map((row) => row.clientUuid)).toEqual(['s-3', 's-2']);
    native.close();
  });

  it('retains affected-area waypoint provenance through draft and pending', async () => {
    const { database, native } = openDatabase();
    const affectedWaypoints = [
      { latitude: 14, longitude: 120, source: 'map' as const, accuracyMeters: null, capturedAt: '2026-10-05T09:00:00.000Z' },
      { latitude: 14, longitude: 120.001, source: 'gps' as const, accuracyMeters: 3.4, capturedAt: '2026-10-05T09:00:01.000Z' },
      { latitude: 14.001, longitude: 120.001, source: 'gps' as const, accuracyMeters: 3.1, capturedAt: '2026-10-05T09:00:02.000Z' },
      { latitude: 14.001, longitude: 120, source: 'map' as const, accuracyMeters: null, capturedAt: '2026-10-05T09:00:03.000Z' },
    ];
    const draft = await saveFieldSurveyDraft(database, {
      authorRole: 'field_reporter',
      capturedAt: waypoint.capturedAt,
      clientUuid: 'survey-provenance',
      districtCode: 'D-01',
      ownerIdentity: 'owner-1',
      waypoints: [waypoint],
      affectedAreaPolygons: [polygon],
      affectedAreaWaypoints: [affectedWaypoints],
    });
    expect(JSON.parse(draft.affectedAreaWaypointsJson!)).toEqual([affectedWaypoints]);
    markFieldSurveyPending(database, draft.clientUuid, 'owner-1', polygon, plotAreaSqm, waypoint.capturedAt, [polygon], plotAreaSqm, [affectedWaypoints]);
    const pending = findOwnedFieldSurvey(database, draft.clientUuid, 'owner-1')!;
    expect(JSON.parse(pending.affectedAreaWaypointsJson!)).toEqual([affectedWaypoints]);
    expect(JSON.parse(pending.affectedAreaWaypointsJson!)[0][1]).toMatchObject({ source: 'gps', accuracyMeters: 3.4 });
    native.close();
  });

  it('retains unfinished affected waypoints in the draft and clears them on pending', async () => {
    const { database, native } = openDatabase();
    const active = [
      { latitude: 14, longitude: 120, source: 'map' as const, accuracyMeters: null, capturedAt: '2026-10-05T09:00:00.000Z' },
      { latitude: 14, longitude: 120.001, source: 'gps' as const, accuracyMeters: 3.4, capturedAt: '2026-10-05T09:00:01.000Z' },
    ];
    const draft = await saveFieldSurveyDraft(database, {
      authorRole: 'field_reporter',
      capturedAt: waypoint.capturedAt,
      clientUuid: 'survey-unfinished',
      districtCode: 'D-01',
      ownerIdentity: 'owner-1',
      waypoints: [waypoint],
      activeAffectedWaypoints: active,
    });
    expect(JSON.parse(draft.activeAffectedWaypointsJson!)).toEqual(active);
    expect(findOwnedFieldSurvey(database, draft.clientUuid, 'owner-1')).toMatchObject({ status: 'draft' });
    markFieldSurveyPending(database, draft.clientUuid, 'owner-1', polygon, plotAreaSqm, waypoint.capturedAt);
    const pending = findOwnedFieldSurvey(database, draft.clientUuid, 'owner-1')!;
    expect(pending.status).toBe('pending');
    expect(JSON.parse(pending.activeAffectedWaypointsJson!)).toEqual([]);
    native.close();
  });

  it('rejects affected-area provenance that does not match its polygon', async () => {
    const { database, native } = openDatabase();
    const draft = await saveFieldSurveyDraft(database, {
      authorRole: 'field_reporter',
      capturedAt: waypoint.capturedAt,
      clientUuid: 'survey-provenance-mismatch',
      districtCode: 'D-01',
      ownerIdentity: 'owner-1',
      waypoints: [waypoint],
    });
    const mismatched = [
      { latitude: 14.002, longitude: 120.002, source: 'gps' as const, accuracyMeters: 2.5, capturedAt: '2026-10-05T09:00:00.000Z' },
      { latitude: 14.002, longitude: 120.003, source: 'gps' as const, accuracyMeters: 2.5, capturedAt: '2026-10-05T09:00:01.000Z' },
      { latitude: 14.003, longitude: 120.003, source: 'gps' as const, accuracyMeters: 2.5, capturedAt: '2026-10-05T09:00:02.000Z' },
    ];
    expect(() => markFieldSurveyPending(database, draft.clientUuid, 'owner-1', polygon, plotAreaSqm, waypoint.capturedAt, [polygon], plotAreaSqm, [mismatched])).toThrow(/provenance/i);
    native.close();
  });

  it('rejects a pending measurement that does not match its polygon geometry', async () => {
    const { database, native } = openDatabase();
    const draft = await saveFieldSurveyDraft(database, {
      authorRole: 'field_reporter',
      capturedAt: waypoint.capturedAt,
      clientUuid: 'survey-invalid-measurement',
      districtCode: 'D-01',
      ownerIdentity: 'owner-1',
      waypoints: [waypoint],
    });
    expect(() => markFieldSurveyPending(database, draft.clientUuid, 'owner-1', polygon, plotAreaSqm + 100, waypoint.capturedAt)).toThrow(/measured area/i);
    expect(findOwnedFieldSurvey(database, draft.clientUuid, 'owner-1')?.status).toBe('draft');
    native.close();
  });

  it('selects only owner-scoped due retryable surveys and recovers stale uploads', async () => {
    const { database, native } = openDatabase();
    const draft = await saveFieldSurveyDraft(database, {
      authorRole: 'field_reporter',
      capturedAt: waypoint.capturedAt,
      clientUuid: 'survey-client-2',
      districtCode: 'D-01',
      ownerIdentity: 'owner-1',
      waypoints: [waypoint],
    });
    markFieldSurveyPending(database, draft.clientUuid, 'owner-1', polygon, plotAreaSqm, waypoint.capturedAt);
    expect(findFieldSurveySyncCandidates(database, 'owner-1', 10, { includeRetryableFailed: true })).toHaveLength(1);
    updateFieldSurveySyncResult(database, draft.clientUuid, 'owner-1', { status: 'failed', lastSyncErrorCode: 'NETWORK_REQUEST_FAILED' });
    expect(findFieldSurveySyncCandidates(database, 'owner-1', 10, { failedBefore: '9999-01-01T00:00:00.000Z', includeRetryableFailed: true })).toHaveLength(1);
    expect(findFieldSurveySyncCandidates(database, 'owner-2', 10, { includeRetryableFailed: true })).toHaveLength(0);
    expect(countUnsyncedFieldSurveys(database, 'owner-1')).toBe(1);
    updateFieldSurveySyncResult(database, draft.clientUuid, 'owner-1', { status: 'syncing' });
    resetStaleSyncingFieldSurveys(database, 'owner-1', '9999-01-01T00:00:00.000Z');
    expect(findOwnedFieldSurvey(database, draft.clientUuid, 'owner-1')).toMatchObject({ status: 'pending', lastSyncErrorCode: 'STALE_SYNC_RECOVERED' });
    native.close();
  });

  it('requires a new client identity after the server rejects a survey UUID', async () => {
    const { database, native } = openDatabase();
    const draft = await saveFieldSurveyDraft(database, {
      authorRole: 'field_reporter',
      capturedAt: waypoint.capturedAt,
      clientUuid: 'survey-client-3',
      districtCode: 'D-01',
      ownerIdentity: 'owner-1',
      waypoints: [waypoint],
    });
    markFieldSurveyPending(database, draft.clientUuid, 'owner-1', polygon, plotAreaSqm, waypoint.capturedAt);
    updateFieldSurveySyncResult(database, draft.clientUuid, 'owner-1', { status: 'failed', lastSyncErrorCode: 'CLIENT_UUID_CONFLICT' });
    expect(() => markFieldSurveyPending(database, draft.clientUuid, 'owner-1', polygon, plotAreaSqm, waypoint.capturedAt)).toThrow(/fresh identity/i);
    await expect(saveFieldSurveyDraft(database, { authorRole: 'field_reporter', capturedAt: waypoint.capturedAt, clientUuid: draft.clientUuid, districtCode: 'D-01', ownerIdentity: 'owner-1', waypoints: [waypoint] })).rejects.toThrow(/cannot be edited/i);
    native.close();
  });
  // Intent: boundaries refuse illegal status moves the way reports do.
  it('refuses illegal sync moves and reports whether the row changed', async () => {
    const { database, native } = openDatabase();
    const draft = await saveFieldSurveyDraft(database, { authorRole: 'field_reporter', capturedAt: waypoint.capturedAt, clientUuid: 'survey-moves', districtCode: 'D-01', ownerIdentity: 'owner-1', waypoints: [waypoint] });
    expect(updateFieldSurveySyncResult(database, draft.clientUuid, 'owner-1', { status: 'synced', remoteId: 'x' })).toBe(0);
    expect(findOwnedFieldSurvey(database, draft.clientUuid, 'owner-1')).toMatchObject({ status: 'draft', remoteId: null });
    native.exec("UPDATE field_surveys SET status = 'syncing'");
    expect(updateFieldSurveySyncResult(database, draft.clientUuid, 'owner-1', { status: 'synced', remoteId: 'x' })).toBe(1);
    expect(updateFieldSurveySyncResult(database, draft.clientUuid, 'owner-1', { status: 'failed', lastSyncErrorCode: 'SERVER_ERROR' })).toBe(0);
    expect(findOwnedFieldSurvey(database, draft.clientUuid, 'owner-1')).toMatchObject({ status: 'synced' });
    native.close();
  });

  // Intent: only drafts are throwaway; queued work stays until the office has it, and the waiting count reflects that.
  it('deletes drafts only and counts only work still owed', async () => {
    const { database, native } = openDatabase();
    for (const id of ['a-draft', 'b-rejected', 'c-retry', 'd-sent']) {
      await saveFieldSurveyDraft(database, { authorRole: 'field_reporter', capturedAt: waypoint.capturedAt, clientUuid: id, districtCode: 'D-01', ownerIdentity: 'owner-1', waypoints: [waypoint] });
    }
    native.exec("UPDATE field_surveys SET status='failed', last_sync_error_code='CLIENT_UUID_CONFLICT' WHERE client_uuid='b-rejected'");
    native.exec("UPDATE field_surveys SET status='failed', last_sync_error_code='SERVER_ERROR' WHERE client_uuid='c-retry'");
    native.exec("UPDATE field_surveys SET status='synced', remote_id='r1' WHERE client_uuid='d-sent'");
    expect(countUnsyncedFieldSurveys(database, 'owner-1')).toBe(1);
    expect(deleteOwnedFieldSurvey(database, 'd-sent', 'owner-1')).toBe(false);
    expect(deleteOwnedFieldSurvey(database, 'c-retry', 'owner-1')).toBe(false);
    expect(deleteOwnedFieldSurvey(database, 'b-rejected', 'owner-1')).toBe(false);
    expect(deleteOwnedFieldSurvey(database, 'a-draft', 'owner-2')).toBe(false);
    expect(deleteOwnedFieldSurvey(database, 'a-draft', 'owner-1')).toBe(true);
    expect(findOwnedFieldSurvey(database, 'a-draft', 'owner-1')).toBeNull();
    expect(findOwnedFieldSurvey(database, 'd-sent', 'owner-1')).not.toBeNull();
    native.close();
  });

  // Intent: the list and home count re-read after every stored state change, so labels and Delete never go stale.
  it('notifies subscribers after each stored state change', async () => {
    const { database, native } = openDatabase();
    const seen: string[] = [];
    const unsubscribe = subscribeSyncRecords(() => {
      seen.push(findOwnedFieldSurvey(database, 'survey-notify', 'owner-1')?.status ?? 'missing');
    });
    const draft = await saveFieldSurveyDraft(database, { authorRole: 'field_reporter', capturedAt: waypoint.capturedAt, clientUuid: 'survey-notify', districtCode: 'D-01', ownerIdentity: 'owner-1', waypoints: [waypoint] });
    markFieldSurveyPending(database, draft.clientUuid, 'owner-1', polygon, plotAreaSqm, waypoint.capturedAt);
    updateFieldSurveySyncResult(database, draft.clientUuid, 'owner-1', { status: 'syncing' });
    updateFieldSurveySyncResult(database, draft.clientUuid, 'owner-1', { status: 'synced', remoteId: 'remote-1' });
    expect(updateFieldSurveySyncResult(database, draft.clientUuid, 'owner-1', { status: 'failed' })).toBe(0);
    unsubscribe();
    expect(seen).toEqual(['draft', 'pending', 'syncing', 'synced']);
    native.close();
  });
});
