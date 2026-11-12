import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

import { drizzle } from 'drizzle-orm/expo-sqlite';
import type { SQLiteDatabase, SQLiteStatement } from 'expo-sqlite';

import type { CaneGuardDatabase } from '@/database/database';
import { saveLocalDraft } from '@/database/localDraftRepository';
import * as schema from '@/database/schema';
import { listUnfinishedDrafts } from '@/features/activity/data/unfinishedWorkRepository';
import { createOrGetFieldReportDraft } from '@/features/reports/data/fieldReportRepository';
import { saveFieldSurveyDraft } from '@/features/surveys/data/fieldSurveyRepository';

const OWNER = 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17';
const OTHER_OWNER = '51214146-7439-48e0-aef4-d0e003f194b4';
const SCAN_ID = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2';
const FINAL_SCAN_ID = '9c1f6a7e-0c0c-4d0e-9a55-0d4f5f5f1111';
const NOW = '2026-08-10T01:00:00.000Z';

function openDatabase(): { database: CaneGuardDatabase; native: DatabaseSync } {
  const native = new DatabaseSync(':memory:');
  native.exec('PRAGMA foreign_keys = ON');
  for (const migration of [
    '0000_complex_johnny_blaze.sql', '0001_loving_amazoness.sql', '0002_talented_kat_farrell.sql',
    '0003_careful_marauders.sql', '0004_sour_namora.sql', '0005_tricky_the_santerians.sql',
    '0006_curvy_piledriver.sql', '0007_familiar_old_lace.sql', '0012_dapper_sumo.sql',
    '0013_v1_local_scan_migration.sql', '0014_safe_songbird.sql', '0019_add_field_surveys.sql',
    '0020_nasty_captain_midlands.sql', '0021_field_survey_affected_areas.sql',
    '0022_peaceful_titania.sql', '0023_affected_area_waypoints.sql',
    '0024_active_affected_waypoints.sql', '0025_field_survey_author_role.sql',
    '0028_field_report_survey_link.sql', '0029_scan_personal_place.sql', '0034_authority_workflow_status.sql',
    '0036_net3_report_provenance.sql', '0037_net3_survey_provenance.sql',
  ]) {
    native.exec(readFileSync(join(process.cwd(), 'drizzle', migration), 'utf8').replaceAll('--> statement-breakpoint', ''));
  }
  for (const id of [SCAN_ID, FINAL_SCAN_ID]) {
    native.prepare(`INSERT INTO scan_records (
      id, owner_identity, managed_image_uri, image_source_type, predicted_label, confidence,
      checklist_consistency, model_version, preprocess_ms, inference_ms, total_ms,
      source_width, source_height, created_at, updated_at
    ) VALUES (?, ?, ?, 'camera', 'rust', 0.8, 'consistent', 'v1', 5, 8, 13, 1200, 900, ?, ?)`)
      .run(id, OWNER, `file:///scan/${id}.jpg`, NOW, NOW);
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

const draftInput = (id: string, scanRecordId: string) => ({
  id,
  scanRecordId,
  createdAt: NOW,
  submitterIdentity: OWNER,
  submitterRole: 'field_reporter' as const,
});

describe('listUnfinishedDrafts', () => {
  it('lists this owner\'s report, visit and plot drafts, locally', async () => {
    const { database } = openDatabase();
    await createOrGetFieldReportDraft(database, draftInput('7ea3e6f0-b893-4fd3-b414-0b797e62ec8e', SCAN_ID));
    await saveLocalDraft(database, {
      draftKey: 'assignment-9', kind: 'field_validation', ownerIdentity: OWNER, payload: {}, version: 1,
    });
    await saveFieldSurveyDraft(database, {
      authorRole: 'field_reporter', capturedAt: NOW, clientUuid: 'plot-1', districtCode: 'D1', ownerIdentity: OWNER, waypoints: [],
    });

    const drafts = await listUnfinishedDrafts(database, OWNER);

    expect(drafts.map((draft) => [draft.kind, draft.id]).sort()).toEqual([
      ['plot', 'plot-1'],
      ['report', SCAN_ID],
      ['visit', 'assignment-9'],
    ]);
  });

  it('lists a plot the office does not have yet, including queued and retrying work', async () => {
    const { database, native } = openDatabase();
    for (const clientUuid of ['plot-pending', 'plot-failed', 'plot-sent', 'plot-rejected']) {
      await saveFieldSurveyDraft(database, {
        authorRole: 'field_reporter', capturedAt: NOW, clientUuid, districtCode: 'D1', ownerIdentity: OWNER, waypoints: [],
      });
    }
    native.exec("UPDATE field_surveys SET status = 'pending' WHERE client_uuid = 'plot-pending'");
    native.exec("UPDATE field_surveys SET status = 'failed', last_sync_error_code = 'API_VALIDATION_FAILED' WHERE client_uuid = 'plot-failed'");
    native.exec("UPDATE field_surveys SET status = 'synced', remote_id = 'remote-1' WHERE client_uuid = 'plot-sent'");
    native.exec("UPDATE field_surveys SET status = 'failed', last_sync_error_code = 'CLIENT_UUID_CONFLICT' WHERE client_uuid = 'plot-rejected'");

    const drafts = await listUnfinishedDrafts(database, OWNER);

    expect(
      drafts.filter((draft) => draft.kind === 'plot').map((draft) => draft.id).sort(),
    ).toEqual(['plot-failed', 'plot-pending']);
  });

  it('never lists another owner\'s drafts or a finalized report', async () => {
    const { database, native } = openDatabase();
    await createOrGetFieldReportDraft(database, draftInput('6e1b2c3d-4a5f-4b6c-8d7e-9f0a1b2c3d4e', FINAL_SCAN_ID));
    native.exec(`UPDATE field_reports SET authoring_state = 'finalized', submitted_at = '${NOW}', sync_status = 'pending' WHERE id = '6e1b2c3d-4a5f-4b6c-8d7e-9f0a1b2c3d4e'`);
    await saveLocalDraft(database, {
      draftKey: 'assignment-9', kind: 'field_validation', ownerIdentity: OTHER_OWNER, payload: {}, version: 1,
    });
    await saveFieldSurveyDraft(database, {
      authorRole: 'field_reporter', capturedAt: NOW, clientUuid: 'plot-2', districtCode: 'D1', ownerIdentity: OTHER_OWNER, waypoints: [],
    });

    await expect(listUnfinishedDrafts(database, OWNER)).resolves.toEqual([]);
  });
});
