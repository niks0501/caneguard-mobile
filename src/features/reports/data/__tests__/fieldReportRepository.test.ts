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
import { StorageError } from '@/database/errors';
import * as schema from '@/database/schema';
import {
  createOrGetFieldReportDraft,
  findFieldReportById,
  findFieldReportByScanRecordId,
  saveGpsCapture,
  saveFieldReportDraft,
} from '@/features/reports/data/fieldReportRepository';

const SCAN_ID = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2';
const REPORT_ID = '7ea3e6f0-b893-4fd3-b414-0b797e62ec8e';
const SECOND_REPORT_ID = '51214146-7439-48e0-aef4-d0e003f194b4';
const OBSERVED_AT = '2026-07-25T05:30:00.000Z';
const CREATED_AT = '2026-08-10T01:00:00.000Z';
const SUBMITTER_ID = 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17';

function createDraftInput(id = REPORT_ID) {
  return {
    id,
    scanRecordId: SCAN_ID,
    createdAt: CREATED_AT,
    submitterIdentity: SUBMITTER_ID,
    submitterRole: 'field_reporter' as const,
  };
}

function readMigration(filename: string): string {
  return readFileSync(join(process.cwd(), 'drizzle', filename), 'utf8').replaceAll(
    '--> statement-breakpoint',
    '',
  );
}

function openTestDatabase(): {
  database: CaneGuardDatabase;
  native: DatabaseSync;
} {
  const native = new DatabaseSync(':memory:');
  native.exec('PRAGMA foreign_keys = ON');
  for (const migration of [
    '0000_complex_johnny_blaze.sql',
    '0001_loving_amazoness.sql',
    '0002_talented_kat_farrell.sql',
    '0003_careful_marauders.sql',
  ]) {
    native.exec(readMigration(migration));
  }
  native
    .prepare(`
      INSERT INTO scan_records (
        id, managed_image_uri, image_source_type, predicted_label, confidence,
        checklist_consistency, model_version, preprocess_ms, inference_ms,
        total_ms, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      SCAN_ID,
      `file:///caneguard/scan-images/${SCAN_ID}.jpg`,
      'camera',
      'rust',
      0.8,
      'consistent',
      'v0.1-baseline',
      5,
      8,
      13,
      OBSERVED_AT,
      OBSERVED_AT,
    );

  const client = {
    prepareSync(sql: string) {
      return createStatementAdapter(native.prepare(sql));
    },
  } as unknown as SQLiteDatabase;

  return {
    database: drizzle(client, { schema }) as CaneGuardDatabase,
    native,
  };
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

describe('Field Report draft repository', () => {
  it('creates an incomplete, local-only Draft from a completed Scan Record', async () => {
    const { database, native } = openTestDatabase();

    await expect(
      createOrGetFieldReportDraft(database, createDraftInput()),
    ).resolves.toMatchObject({
      id: REPORT_ID,
      scanRecordId: SCAN_ID,
      authoringState: 'draft',
      farmerOrFarmOwnerName: null,
      barangay: null,
      province: 'Batangas',
      municipality: 'Nasugbu',
      observedAt: OBSERVED_AT,
      submittedAt: null,
      syncStatus: 'local_only',
      submitterIdentity: SUBMITTER_ID,
      submitterRole: 'field_reporter',
    });
    expect(
      native.prepare('SELECT count(*) AS count FROM scan_records').get(),
    ).toEqual({ count: 1 });
    native.close();
  });

  it('persists partial edits without changing identity or observation time', async () => {
    const { database, native } = openTestDatabase();
    await createOrGetFieldReportDraft(database, createDraftInput());

    const saved = await saveFieldReportDraft(database, REPORT_ID, {
      farmerOrFarmOwnerName: '  Maria Santos  ',
      barangay: '  Lumbangan  ',
      updatedAt: '2026-08-10T01:05:00.000Z',
    });
    const reopened = await findFieldReportById(database, REPORT_ID);

    expect(saved).toMatchObject({
      id: REPORT_ID,
      farmerOrFarmOwnerName: 'Maria Santos',
      barangay: 'Lumbangan',
      observedAt: OBSERVED_AT,
      syncStatus: 'local_only',
    });
    expect(reopened).toEqual(saved);
    expect(
      native.prepare('SELECT created_at, updated_at FROM scan_records').get(),
    ).toEqual({ created_at: OBSERVED_AT, updated_at: OBSERVED_AT });
    native.close();
  });

  it('reuses the same Draft when creation is requested again for one scan', async () => {
    const { database, native } = openTestDatabase();
    await createOrGetFieldReportDraft(database, createDraftInput());

    await expect(
      createOrGetFieldReportDraft(database, {
        ...createDraftInput(SECOND_REPORT_ID),
        createdAt: '2026-08-10T02:00:00.000Z',
      }),
    ).resolves.toMatchObject({ id: REPORT_ID, createdAt: CREATED_AT });
    await expect(findFieldReportByScanRecordId(database, SCAN_ID)).resolves.toMatchObject(
      { id: REPORT_ID },
    );
    expect(
      native.prepare('SELECT count(*) AS count FROM field_reports').get(),
    ).toEqual({ count: 1 });
    native.close();
  });

  it('rejects a report for a nonexistent Scan Record', async () => {
    const { database, native } = openTestDatabase();

    await expect(
      createOrGetFieldReportDraft(database, {
        ...createDraftInput(),
        scanRecordId: SECOND_REPORT_ID,
      }),
    ).rejects.toMatchObject<Partial<StorageError>>({ code: 'RECORD_NOT_FOUND' });
    native.close();
  });

  it('persists resolved GPS provenance without changing Draft fields or scan evidence', async () => {
    const { database, native } = openTestDatabase();
    await createOrGetFieldReportDraft(database, createDraftInput());
    await saveFieldReportDraft(database, REPORT_ID, {
      farmerOrFarmOwnerName: 'Maria Santos',
      barangay: 'Lumbangan',
      updatedAt: '2026-08-10T01:03:00.000Z',
    });

    const saved = await saveGpsCapture(database, REPORT_ID, {
      accuracy: 4.2,
      capturedAt: '2026-08-10T01:04:00.000Z',
      latitude: 14.0667,
      longitude: 120.6319,
      outcome: 'resolved',
      updatedAt: '2026-08-10T01:04:01.000Z',
    });

    expect(saved).toMatchObject({
      farmerOrFarmOwnerName: 'Maria Santos',
      barangay: 'Lumbangan',
      locationSource: 'gps',
      finalLatitude: 14.0667,
      finalLongitude: 120.6319,
      gpsAccuracy: 4.2,
      gpsAttemptAccuracy: 4.2,
      gpsCaptureOutcome: 'resolved',
      authoringState: 'draft',
      syncStatus: 'local_only',
    });
    expect(native.prepare('SELECT predicted_label, confidence FROM scan_records').get()).toEqual({
      predicted_label: 'rust',
      confidence: 0.8,
    });
    native.close();
  });

  it('retains poor GPS attempt evidence without fabricating a final location', async () => {
    const { database, native } = openTestDatabase();
    await createOrGetFieldReportDraft(database, createDraftInput());

    await expect(
      saveGpsCapture(database, REPORT_ID, {
        accuracy: 38,
        capturedAt: '2026-08-10T01:04:00.000Z',
        latitude: 14.0667,
        longitude: 120.6319,
        outcome: 'low_accuracy',
        updatedAt: '2026-08-10T01:04:01.000Z',
      }),
    ).resolves.toMatchObject({
      finalLatitude: null,
      finalLongitude: null,
      gpsAccuracy: null,
      locationSource: null,
      gpsAttemptAccuracy: 38,
      gpsCaptureOutcome: 'low_accuracy',
    });
    native.close();
  });

  it('retries a poor reading into resolved GPS on the same Draft identity', async () => {
    const { database, native } = openTestDatabase();
    await createOrGetFieldReportDraft(database, createDraftInput());
    await saveFieldReportDraft(database, REPORT_ID, {
      barangay: 'Lumbangan',
      updatedAt: '2026-08-10T01:03:00.000Z',
    });
    await saveGpsCapture(database, REPORT_ID, {
      accuracy: 38,
      capturedAt: '2026-08-10T01:04:00.000Z',
      latitude: 14.066,
      longitude: 120.631,
      outcome: 'low_accuracy',
      updatedAt: '2026-08-10T01:04:01.000Z',
    });

    await expect(
      saveGpsCapture(database, REPORT_ID, {
        accuracy: 4,
        capturedAt: '2026-08-10T01:05:00.000Z',
        latitude: 14.0667,
        longitude: 120.6319,
        outcome: 'resolved',
        updatedAt: '2026-08-10T01:05:01.000Z',
      }),
    ).resolves.toMatchObject({
      id: REPORT_ID,
      barangay: 'Lumbangan',
      gpsCaptureOutcome: 'resolved',
      gpsAttemptAccuracy: 4,
      gpsAccuracy: 4,
      locationSource: 'gps',
    });
    native.close();
  });

  it.each(['permission_denied', 'unavailable', 'error'] as const)(
    'records %s without deleting existing Draft content',
    async (outcome) => {
      const { database, native } = openTestDatabase();
      await createOrGetFieldReportDraft(database, createDraftInput());
      await saveFieldReportDraft(database, REPORT_ID, {
        farmerOrFarmOwnerName: 'Maria Santos',
        updatedAt: '2026-08-10T01:03:00.000Z',
      });

      await expect(
        saveGpsCapture(database, REPORT_ID, {
          capturedAt: '2026-08-10T01:04:00.000Z',
          outcome,
          updatedAt: '2026-08-10T01:04:01.000Z',
        }),
      ).resolves.toMatchObject({
        farmerOrFarmOwnerName: 'Maria Santos',
        gpsCaptureOutcome: outcome,
        finalLatitude: null,
        locationSource: null,
      });
      native.close();
    },
  );
});
