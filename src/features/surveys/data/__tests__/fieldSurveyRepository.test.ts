import { readFileSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import type { SQLiteDatabase, SQLiteStatement } from 'expo-sqlite';

import type { CaneGuardDatabase } from '@/database/database';
import * as schema from '@/database/schema';
import {
  findOwnedFieldSurvey,
  listOwnedFieldSurveys,
  markFieldSurveyPending,
  saveFieldSurveyDraft,
  updateFieldSurveySyncResult,
} from '@/features/surveys/data/fieldSurveyRepository';
import type { SurveyWaypoint } from '@/features/surveys/domain/fieldSurvey';

function openDatabase(): { database: CaneGuardDatabase; native: DatabaseSync } {
  const native = new DatabaseSync(':memory:');
  native.exec(readFileSync('drizzle/0019_add_field_surveys.sql', 'utf8').replaceAll('--> statement-breakpoint', ''));
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

describe('field survey local repository', () => {
  it('persists owner-scoped offline drafts and retains one client UUID through sync retries', async () => {
    const { database, native } = openDatabase();
    const draft = await saveFieldSurveyDraft(database, {
      capturedAt: waypoint.capturedAt,
      clientUuid: 'survey-client-1',
      districtCode: 'D-01',
      ownerIdentity: 'owner-1',
      waypoints: [waypoint],
    });
    expect(draft.status).toBe('draft');
    expect(findOwnedFieldSurvey(database, 'survey-client-1', 'owner-2')).toBeNull();
    expect(listOwnedFieldSurveys(database, 'owner-1')).toHaveLength(1);

    markFieldSurveyPending(database, draft.clientUuid, 'owner-1', polygon, 5_000, waypoint.capturedAt);
    expect(findOwnedFieldSurvey(database, draft.clientUuid, 'owner-1')).toMatchObject({ status: 'pending', areaSqm: 5_000, capturedAt: waypoint.capturedAt });
    updateFieldSurveySyncResult(database, draft.clientUuid, 'owner-1', {
      status: 'failed',
      fieldErrors: { polygon: ['Move the boundary inside the assigned plot.'] },
      lastSyncErrorCode: 'VALIDATION_FAILED',
    });
    expect(JSON.parse(findOwnedFieldSurvey(database, draft.clientUuid, 'owner-1')!.fieldErrorsJson!)).toEqual({
      polygon: ['Move the boundary inside the assigned plot.'],
    });
    updateFieldSurveySyncResult(database, draft.clientUuid, 'owner-1', { status: 'syncing' });
    updateFieldSurveySyncResult(database, draft.clientUuid, 'owner-1', { status: 'pending', lastSyncErrorCode: 'UPLOAD_FAILED' });
    updateFieldSurveySyncResult(database, draft.clientUuid, 'owner-1', { status: 'synced', remoteId: 'remote-1' });
    expect(findOwnedFieldSurvey(database, draft.clientUuid, 'owner-1')).toMatchObject({ status: 'synced', remoteId: 'remote-1', syncAttemptCount: 1 });
    expect(native.prepare('SELECT client_uuid FROM field_surveys').get()).toEqual({ client_uuid: 'survey-client-1' });
    native.close();
  });
});
