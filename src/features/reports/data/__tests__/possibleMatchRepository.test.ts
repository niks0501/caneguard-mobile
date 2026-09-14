import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  DatabaseSync,
  type SQLInputValue,
  type StatementSync,
} from 'node:sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import type { SQLiteDatabase, SQLiteStatement } from 'expo-sqlite';

import type { CaneGuardDatabase } from '@/database/database';
import * as schema from '@/database/schema';
import {
  createOrGetFieldReportDraft,
  finalizeFieldReport,
  saveGpsCapture,
} from '@/features/reports/data/fieldReportRepository';
import { findPossibleRecentMatch } from '@/features/reports/data/possibleMatchRepository';
import type { PossibleMatchLookupInput } from '@/features/reports/domain/possibleMatch';

const CURRENT_SCAN_ID = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2';
const CURRENT_REPORT_ID = '7ea3e6f0-b893-4fd3-b414-0b797e62ec8e';
const CANDIDATE_SCAN_ID = '51214146-7439-48e0-aef4-d0e003f194b4';
const CANDIDATE_REPORT_ID = '6f80a15d-3f9f-4e0a-bf79-7cf2c37e2fa1';
const SUBMITTER_ID = 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17';
const CURRENT_OBSERVED_AT = '2026-08-10T12:00:00.000Z';
const CANDIDATE_OBSERVED_AT = '2026-08-09T12:00:00.000Z';
const IMAGE_URI = `file:///caneguard/scan-images/${CURRENT_SCAN_ID}.jpg`;

function readMigration(filename: string): string {
  return readFileSync(join(process.cwd(), 'drizzle', filename), 'utf8').replaceAll(
    '--> statement-breakpoint',
    '',
  );
}

function createStatementAdapter(statement: StatementSync): SQLiteStatement {
  function execute(params: unknown[]) {
    const result = statement.run(...(params as SQLInputValue[]));
    return {
      changes: Number(result.changes),
      lastInsertRowId: Number(result.lastInsertRowid),
      getAllSync: () => [],
      getFirstSync: () => null,
    };
  }

  return {
    executeSync: (params: unknown[] = []) => execute(params),
    executeForRawResultSync: (params: unknown[] = []) => {
      const rows = statement.all(
        ...(params as SQLInputValue[]),
      ) as Record<string, unknown>[];
      const columns = statement.columns();
      return {
        getAllSync: () =>
          rows.map((row) => columns.map((column) => row[column.name])),
      };
    },
  } as unknown as SQLiteStatement;
}

function openTestDatabase(): { database: CaneGuardDatabase; native: DatabaseSync } {
  const native = new DatabaseSync(':memory:');
  native.exec('PRAGMA foreign_keys = ON');
  for (const migration of [
    '0000_complex_johnny_blaze.sql',
    '0001_loving_amazoness.sql',
    '0002_talented_kat_farrell.sql',
    '0003_careful_marauders.sql',
    '0004_sour_namora.sql',
    '0005_tricky_the_santerians.sql',
    '0006_curvy_piledriver.sql',
    '0007_familiar_old_lace.sql',
    '0012_dapper_sumo.sql',
    '0013_v1_local_scan_migration.sql',
  ]) {
    native.exec(readMigration(migration));
  }

  insertScan(native, CURRENT_SCAN_ID, CURRENT_OBSERVED_AT, IMAGE_URI);
  insertScan(
    native,
    CANDIDATE_SCAN_ID,
    CANDIDATE_OBSERVED_AT,
    `file:///caneguard/scan-images/${CANDIDATE_SCAN_ID}.jpg`,
  );

  const client = {
    prepareSync(sql: string) {
      return createStatementAdapter(native.prepare(sql));
    },
  } as unknown as SQLiteDatabase;

  return { database: drizzle(client, { schema }) as CaneGuardDatabase, native };
}

function insertScan(
  native: DatabaseSync,
  id: string,
  createdAt: string,
  imageUri: string,
): void {
  native
    .prepare(`
      INSERT INTO scan_records (
        id, owner_identity, managed_image_uri, submission_image_uri, submission_image_mime_type,
        submission_image_size_bytes, image_source_type, predicted_label, confidence,
        checklist_consistency, model_version, preprocess_ms, inference_ms,
        total_ms, source_width, source_height, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      id,
      SUBMITTER_ID,
      imageUri,
      imageUri,
      'image/jpeg',
      4096,
      'camera',
      'rust',
      0.8,
      'consistent',
      'v1.0-mobilenetv2',
      5,
      8,
      13,
      1200,
      900,
      createdAt,
      createdAt,
    );
}

function insertCandidateReport(
  native: DatabaseSync,
  farmerOrFarmOwnerName = 'Maria Santos Farm',
): void {
  native
    .prepare(`
      INSERT INTO field_reports (
        id, scan_record_id, authoring_state, farmer_or_farm_owner_name,
        province, municipality, barangay, final_latitude, final_longitude,
        location_source, gps_accuracy, observed_at, submitted_at,
        submitter_identity, submitter_role, sync_status, created_at, updated_at
      ) VALUES (?, ?, 'finalized', ?, ?, ?, ?, ?, ?, 'gps', ?, ?, ?, ?, ?, 'synced', ?, ?)
    `)
    .run(
      CANDIDATE_REPORT_ID,
      CANDIDATE_SCAN_ID,
      farmerOrFarmOwnerName,
      'Batangas',
      'Nasugbu',
      'Wawa',
      14.0667,
      120.6319,
      4.2,
      CANDIDATE_OBSERVED_AT,
      CANDIDATE_OBSERVED_AT,
      SUBMITTER_ID,
      'field_reporter',
      CANDIDATE_OBSERVED_AT,
      CANDIDATE_OBSERVED_AT,
    );
}

function insertCompleteClassScores(native: DatabaseSync): void {
  const insert = native.prepare(
    'INSERT INTO scan_class_scores (scan_record_id, label, score) VALUES (?, ?, ?)',
  );
  insert.run(CURRENT_SCAN_ID, 'healthy', 0.1);
  insert.run(CURRENT_SCAN_ID, 'mosaic', 0.1);
  insert.run(CURRENT_SCAN_ID, 'rust', 0.8);
  insert.run(CURRENT_SCAN_ID, 'smut', 0);
}

function lookupInput(
  overrides: Partial<PossibleMatchLookupInput> = {},
): PossibleMatchLookupInput {
  return {
    barangay: 'Wawa',
    finalLatitude: 14.0667,
    finalLongitude: 120.6319,
    farmerOrFarmOwnerName: 'Maria Santos Farm',
    locationSource: 'gps',
    municipality: 'Nasugbu',
    observedAt: CURRENT_OBSERVED_AT,
    predictedLabel: 'rust',
    province: 'Batangas',
    reportId: CURRENT_REPORT_ID,
    scanRecordId: CURRENT_SCAN_ID,
    ...overrides,
  };
}

describe('possible match repository', () => {
  it('finds a conservative match from a recent finalized local report', async () => {
    const { database, native } = openTestDatabase();
    insertCandidateReport(native);

    await expect(
      findPossibleRecentMatch(database, SUBMITTER_ID, lookupInput()),
    ).resolves.toMatchObject({
      reportId: CANDIDATE_REPORT_ID,
      scanRecordId: CANDIDATE_SCAN_ID,
      predictedLabel: 'rust',
      distanceMeters: 0,
    });
    native.close();
  });

  it('finds a Smut match from the local finalized reports', async () => {
    const { database, native } = openTestDatabase();
    insertCandidateReport(native);
    native
      .prepare('UPDATE scan_records SET predicted_label = ? WHERE id = ?')
      .run('smut', CANDIDATE_SCAN_ID);

    await expect(
      findPossibleRecentMatch(
        database,
        SUBMITTER_ID,
        lookupInput({ predictedLabel: 'smut' }),
      ),
    ).resolves.toMatchObject({
      reportId: CANDIDATE_REPORT_ID,
      predictedLabel: 'smut',
      distanceMeters: 0,
    });
    native.close();
  });

  it('does not flag a same-location and same-condition report for a different farm reference', async () => {
    const { database, native } = openTestDatabase();
    insertCandidateReport(native, 'North Block Farm 12');

    await expect(
      findPossibleRecentMatch(database, SUBMITTER_ID, lookupInput()),
    ).resolves.toBeNull();
    native.close();
  });

  it('keeps a warned near-match as a separate finalized record', async () => {
    const { database, native } = openTestDatabase();
    insertCompleteClassScores(native);
    insertCandidateReport(native);

    await expect(
      findPossibleRecentMatch(database, SUBMITTER_ID, lookupInput()),
    ).resolves.toMatchObject({ reportId: CANDIDATE_REPORT_ID });

    await createOrGetFieldReportDraft(database, {
      createdAt: CURRENT_OBSERVED_AT,
      id: CURRENT_REPORT_ID,
      scanRecordId: CURRENT_SCAN_ID,
      submitterIdentity: SUBMITTER_ID,
      submitterRole: 'field_reporter',
    });
    await saveGpsCapture(database, CURRENT_REPORT_ID, SUBMITTER_ID, {
      accuracy: 4.2,
      capturedAt: CURRENT_OBSERVED_AT,
      latitude: 14.0667,
      longitude: 120.6319,
      outcome: 'resolved',
      updatedAt: CURRENT_OBSERVED_AT,
    });
    const result = await finalizeFieldReport(
      database,
      CURRENT_REPORT_ID,
      SUBMITTER_ID,
      {
        affectedAreaHectares: 0.5,
        affectedPortionPercent: 30,
        barangay: 'Wawa',
        farmerOrFarmOwnerName: 'Maria Santos Farm',
        submittedAt: CURRENT_OBSERVED_AT,
        updatedAt: CURRENT_OBSERVED_AT,
      },
      {
        imageExists: () => true,
        prepareSubmissionImage: async () => ({
          artifact: { mimeType: 'image/jpeg' as const, sizeBytes: 4096, uri: IMAGE_URI },
          created: false,
          requiresPersistence: false,
        }),
      },
    );

    expect(result.status).toBe('finalized');
    expect(
      native.prepare('SELECT count(*) AS count FROM field_reports').get(),
    ).toEqual({ count: 2 });
    expect(
      native.prepare('SELECT authoring_state FROM field_reports WHERE id = ?').get(CANDIDATE_REPORT_ID),
    ).toEqual({ authoring_state: 'finalized' });
    native.close();
  });

  it('returns no match when the local lookup cannot use the required signals', async () => {
    const { database, native } = openTestDatabase();
    insertCandidateReport(native);

    await expect(
      findPossibleRecentMatch(
        database,
        SUBMITTER_ID,
        lookupInput({ finalLatitude: null, finalLongitude: null }),
      ),
    ).resolves.toBeNull();
    native.close();
  });
});
