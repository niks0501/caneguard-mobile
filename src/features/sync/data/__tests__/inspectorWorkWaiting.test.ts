import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import type { SQLiteDatabase, SQLiteStatement } from 'expo-sqlite';

import type { CaneGuardDatabase } from '@/database/database';
import * as schema from '@/database/schema';
import { hasUnsentInspectorWork } from '@/features/sync/data/inspectorWorkWaiting';
import {
  markFieldSurveyPending,
  saveFieldSurveyDraft,
} from '@/features/surveys/data/fieldSurveyRepository';
import { ringArea, type SurveyPolygon, type SurveyWaypoint } from '@/features/surveys/domain/fieldSurvey';
import type { MobileUserRole } from '@/features/auth/types';

function openDatabase(): { database: CaneGuardDatabase; native: DatabaseSync } {
  const native = new DatabaseSync(':memory:');
  native.exec('PRAGMA foreign_keys = ON');
  for (const migration of readdirSync('drizzle').filter((file) => file.endsWith('.sql')).sort()) {
    native.exec(
      readFileSync(`drizzle/${migration}`, 'utf8').replaceAll('--> statement-breakpoint', ''),
    );
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

const waypoint: SurveyWaypoint = {
  accuracyMeters: null,
  capturedAt: '2026-10-05T09:00:00.000Z',
  latitude: 14,
  longitude: 120,
  source: 'map',
};
const polygon: SurveyPolygon = {
  type: 'Polygon',
  coordinates: [[[120, 14], [120.001, 14], [120.001, 14.001], [120, 14.001], [120, 14]]],
};
const plotAreaSqm = ringArea(polygon.coordinates[0]);

async function savePendingSurvey(
  database: CaneGuardDatabase,
  input: { authorRole: MobileUserRole; clientUuid: string; ownerIdentity: string },
): Promise<void> {
  const draft = await saveFieldSurveyDraft(database, {
    authorRole: input.authorRole,
    capturedAt: waypoint.capturedAt,
    clientUuid: input.clientUuid,
    districtCode: 'D-01',
    ownerIdentity: input.ownerIdentity,
    waypoints: [waypoint],
  });
  markFieldSurveyPending(
    database,
    draft.clientUuid,
    input.ownerIdentity,
    'D-01',
    polygon,
    plotAreaSqm,
    waypoint.capturedAt,
  );
}

describe('hasUnsentInspectorWork', () => {
  it('reports nothing when only a farmer-saved boundary is waiting on the phone', async () => {
    const { database, native } = openDatabase();
    await savePendingSurvey(database, {
      authorRole: 'farmer',
      clientUuid: 'farmer-survey',
      ownerIdentity: 'farmer-1',
    });

    await expect(hasUnsentInspectorWork(database)).resolves.toBe(false);
    native.close();
  });

  it('stays silent for a boundary saved before authorship was recorded', async () => {
    const { database, native } = openDatabase();
    native
      .prepare(`
        INSERT INTO field_surveys (
          client_uuid, owner_identity, district_code, waypoints_json, captured_at,
          status, created_at, updated_at
        ) VALUES (?, ?, 'D-01', '[]', ?, 'pending', ?, ?)
      `)
      .run(
        'legacy-survey',
        'inspector-1',
        waypoint.capturedAt,
        waypoint.capturedAt,
        waypoint.capturedAt,
      );

    await expect(hasUnsentInspectorWork(database)).resolves.toBe(false);
    native.close();
  });

  it('reports an inspector-saved boundary waiting on the phone', async () => {
    const { database, native } = openDatabase();
    await savePendingSurvey(database, {
      authorRole: 'field_reporter',
      clientUuid: 'inspector-survey',
      ownerIdentity: 'inspector-1',
    });

    await expect(hasUnsentInspectorWork(database)).resolves.toBe(true);
    native.close();
  });

  it('still reports an inspector visit completion waiting on the phone', async () => {
    const { database, native } = openDatabase();
    native
      .prepare(`
        INSERT INTO field_validation_completions (
          id, owner_identity, assignment_id, report_uuid, field_observation,
          field_finding, action_taken, visited_at, gps_outcome, gps_attempted_at,
          sync_status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'Observed', 'Recorded', 'Guided', ?, 'resolved', ?, 'pending', ?, ?)
      `)
      .run(
        'completion-1',
        'inspector-1',
        'assignment-1',
        'report-1',
        '2026-10-05T09:00:00.000Z',
        '2026-10-05T09:00:00.000Z',
        '2026-10-05T09:00:00.000Z',
        '2026-10-05T09:00:00.000Z',
      );

    await expect(hasUnsentInspectorWork(database)).resolves.toBe(true);
    native.close();
  });
});
