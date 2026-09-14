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
import { LEGACY_UNASSIGNED_OWNER_IDENTITY } from '@/database/ownerIdentity';
import { StorageError } from '@/database/errors';
import * as schema from '@/database/schema';
import { getSubmissionImageUri } from '@/features/records/services/scanImageStorage';
import {
  createOrGetFieldReportDraft,
  finalizeFieldReport,
  findFieldReportById,
  findFieldReportByScanRecordId,
  hasFieldReportOwnedByAnotherSubmitter,
  saveGpsCapture,
  saveFieldReportDraft,
  saveManualMapLocation,
} from '@/features/reports/data/fieldReportRepository';
import {
  countUnsyncedFieldReports,
  findFieldReportUploadRecord,
  findFieldReportSyncCandidates,
  markFieldReportFailed,
  markFieldReportPending,
  markFieldReportSynced,
  markFieldReportSyncing,
} from '@/features/reports/data/fieldReportSyncRepository';

const SCAN_ID = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2';
const REPORT_ID = '7ea3e6f0-b893-4fd3-b414-0b797e62ec8e';
const SECOND_REPORT_ID = '51214146-7439-48e0-aef4-d0e003f194b4';
const OBSERVED_AT = '2026-07-25T05:30:00.000Z';
const CREATED_AT = '2026-08-10T01:00:00.000Z';
const SUBMITTER_ID = 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17';
const OTHER_SUBMITTER_ID = '51214146-7439-48e0-aef4-d0e003f194b4';
const IMAGE_EXISTS = {
  imageExists: () => true,
  prepareSubmissionImage: async (input: { sourceUri: string }) => ({
    artifact: {
      mimeType: 'image/jpeg' as const,
      sizeBytes: 4096,
      uri: input.sourceUri,
    },
    created: false,
    requiresPersistence: true,
  }),
};

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
    '0004_sour_namora.sql',
    '0005_tricky_the_santerians.sql',
    '0006_curvy_piledriver.sql',
    '0007_familiar_old_lace.sql',
    '0012_dapper_sumo.sql',
    '0013_v1_local_scan_migration.sql',
  ]) {
    native.exec(readMigration(migration));
  }
  native
    .prepare(`
      INSERT INTO scan_records (
        id, owner_identity, managed_image_uri, image_source_type, predicted_label, confidence,
        checklist_consistency, model_version, preprocess_ms, inference_ms,
        total_ms, source_width, source_height, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      SCAN_ID,
      SUBMITTER_ID,
      `file:///caneguard/scan-images/${SCAN_ID}.jpg`,
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

function insertCompleteClassScores(native: DatabaseSync): void {
  const insert = native.prepare(
    'INSERT INTO scan_class_scores (scan_record_id, label, score) VALUES (?, ?, ?)',
  );
  insert.run(SCAN_ID, 'healthy', 0.1);
  insert.run(SCAN_ID, 'mosaic', 0.1);
  insert.run(SCAN_ID, 'rust', 0.8);
  insert.run(SCAN_ID, 'smut', 0);
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

    const saved = await saveFieldReportDraft(database, REPORT_ID, SUBMITTER_ID, {
      farmerOrFarmOwnerName: '  Maria Santos  ',
      barangay: '  Lumbangan  ',
      updatedAt: '2026-08-10T01:05:00.000Z',
    });
    const reopened = await findFieldReportById(database, REPORT_ID, SUBMITTER_ID);

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
    await expect(
      findFieldReportByScanRecordId(database, SCAN_ID, SUBMITTER_ID),
    ).resolves.toMatchObject({ id: REPORT_ID });
    expect(
      native.prepare('SELECT count(*) AS count FROM field_reports').get(),
    ).toEqual({ count: 1 });
    native.close();
  });

  it('keeps an existing Draft owned by its authenticated submitter', async () => {
    const { database, native } = openTestDatabase();
    await createOrGetFieldReportDraft(database, createDraftInput());

    await expect(
      findFieldReportByScanRecordId(database, SCAN_ID, OTHER_SUBMITTER_ID),
    ).resolves.toBeNull();
    await expect(
      hasFieldReportOwnedByAnotherSubmitter(database, SCAN_ID, SUBMITTER_ID),
    ).resolves.toBe(false);
    await expect(
      hasFieldReportOwnedByAnotherSubmitter(
        database,
        SCAN_ID,
        OTHER_SUBMITTER_ID,
      ),
    ).resolves.toBe(false);
    await expect(
      createOrGetFieldReportDraft(database, {
        ...createDraftInput(SECOND_REPORT_ID),
        submitterIdentity: OTHER_SUBMITTER_ID,
      }),
    ).rejects.toMatchObject<Partial<StorageError>>({
      code: 'RECORD_NOT_FOUND',
    });
    await expect(
      saveFieldReportDraft(database, REPORT_ID, OTHER_SUBMITTER_ID, {
        barangay: 'Lumbangan',
        updatedAt: '2026-08-10T01:05:00.000Z',
      }),
    ).rejects.toMatchObject<Partial<StorageError>>({
      code: 'FIELD_REPORT_NOT_FOUND',
    });
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

  it('upgrades an older unsent scan under its original client identity', async () => {
    const { database, native } = openTestDatabase();
    native
      .prepare("UPDATE scan_records SET sync_status = 'failed' WHERE id = ?")
      .run(SCAN_ID);

    await expect(
      createOrGetFieldReportDraft(database, createDraftInput()),
    ).resolves.toMatchObject({
      id: SCAN_ID,
      scanRecordId: SCAN_ID,
      authoringState: 'draft',
      syncStatus: 'local_only',
    });
    native.close();
  });

  it('prevents resubmitting a scan synchronized by an older app version', async () => {
    const { database, native } = openTestDatabase();
    native
      .prepare(
        "UPDATE scan_records SET sync_status = 'synced', remote_id = 'legacy-remote-id' WHERE id = ?",
      )
      .run(SCAN_ID);

    await expect(
      createOrGetFieldReportDraft(database, createDraftInput()),
    ).rejects.toMatchObject<Partial<StorageError>>({ code: 'UPDATE_FAILED' });
    expect(
      native.prepare('SELECT count(*) AS count FROM field_reports').get(),
    ).toEqual({ count: 0 });
    native.close();
  });

  it('persists resolved GPS provenance without changing Draft fields or scan evidence', async () => {
    const { database, native } = openTestDatabase();
    await createOrGetFieldReportDraft(database, createDraftInput());
    await saveFieldReportDraft(database, REPORT_ID, SUBMITTER_ID, {
      farmerOrFarmOwnerName: 'Maria Santos',
      barangay: 'Lumbangan',
      updatedAt: '2026-08-10T01:03:00.000Z',
    });

    const saved = await saveGpsCapture(database, REPORT_ID, SUBMITTER_ID, {
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
      saveGpsCapture(database, REPORT_ID, SUBMITTER_ID, {
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
    await saveFieldReportDraft(database, REPORT_ID, SUBMITTER_ID, {
      barangay: 'Lumbangan',
      updatedAt: '2026-08-10T01:03:00.000Z',
    });
    await saveGpsCapture(database, REPORT_ID, SUBMITTER_ID, {
      accuracy: 38,
      capturedAt: '2026-08-10T01:04:00.000Z',
      latitude: 14.066,
      longitude: 120.631,
      outcome: 'low_accuracy',
      updatedAt: '2026-08-10T01:04:01.000Z',
    });

    await expect(
      saveGpsCapture(database, REPORT_ID, SUBMITTER_ID, {
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
      await saveFieldReportDraft(database, REPORT_ID, SUBMITTER_ID, {
        farmerOrFarmOwnerName: 'Maria Santos',
        updatedAt: '2026-08-10T01:03:00.000Z',
      });

      await expect(
        saveGpsCapture(database, REPORT_ID, SUBMITTER_ID, {
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

  it('stores a manual pin on the same Draft without rewriting prior GPS evidence', async () => {
    const { database, native } = openTestDatabase();
    await createOrGetFieldReportDraft(database, createDraftInput());
    await saveGpsCapture(database, REPORT_ID, SUBMITTER_ID, {
      accuracy: 38,
      capturedAt: '2026-08-10T01:04:00.000Z',
      latitude: 14.0667,
      longitude: 120.6319,
      outcome: 'low_accuracy',
      updatedAt: '2026-08-10T01:04:01.000Z',
    });

    const saved = await saveManualMapLocation(database, REPORT_ID, SUBMITTER_ID, {
      latitude: 14.071,
      longitude: 120.635,
      selectedAt: '2026-08-10T02:00:00.000Z',
      updatedAt: '2026-08-10T02:00:01.000Z',
    });
    const reopened = await findFieldReportById(database, REPORT_ID, SUBMITTER_ID);

    expect(saved).toMatchObject({
      id: REPORT_ID,
      authoringState: 'draft',
      finalLatitude: 14.071,
      finalLongitude: 120.635,
      gpsAccuracy: null,
      locationSource: 'manual_map',
      manualLocationSelectedAt: '2026-08-10T02:00:00.000Z',
      gpsAttemptLatitude: 14.0667,
      gpsAttemptLongitude: 120.6319,
      gpsAttemptAccuracy: 38,
      gpsAttemptedAt: '2026-08-10T01:04:00.000Z',
      gpsCaptureOutcome: 'low_accuracy',
    });
    expect(reopened).toEqual(saved);
    native.close();
  });

  it('clears manual provenance when a resolved GPS capture replaces the final location', async () => {
    const { database, native } = openTestDatabase();
    await createOrGetFieldReportDraft(database, createDraftInput());
    await saveManualMapLocation(database, REPORT_ID, SUBMITTER_ID, {
      latitude: 14.071,
      longitude: 120.635,
      selectedAt: '2026-08-10T02:00:00.000Z',
      updatedAt: '2026-08-10T02:00:01.000Z',
    });

    await expect(
      saveGpsCapture(database, REPORT_ID, SUBMITTER_ID, {
        accuracy: 4.2,
        capturedAt: '2026-08-10T03:00:00.000Z',
        latitude: 14.0667,
        longitude: 120.6319,
        outcome: 'resolved',
        updatedAt: '2026-08-10T03:00:01.000Z',
      }),
    ).resolves.toMatchObject({
      finalLatitude: 14.0667,
      finalLongitude: 120.6319,
      locationSource: 'gps',
      manualLocationSelectedAt: null,
    });
    native.close();
  });

  it('keeps latest fields on the same Draft when strict finalization fails', async () => {
    const { database, native } = openTestDatabase();
    insertCompleteClassScores(native);
    await createOrGetFieldReportDraft(database, createDraftInput());

    const result = await finalizeFieldReport(
      database,
      REPORT_ID,
      SUBMITTER_ID,
      {
        farmerOrFarmOwnerName: 'Maria Santos',
        affectedAreaHectares: 0.5,
        affectedPortionPercent: 30,
        barangay: '',
        submittedAt: '2026-08-10T03:00:00.000Z',
        updatedAt: '2026-08-10T03:00:00.000Z',
      },
      IMAGE_EXISTS,
    );

    expect(result).toMatchObject({
      status: 'invalid',
      missingRequirements: ['barangay', 'final_coordinates', 'location_source'],
      report: {
        id: REPORT_ID,
        authoringState: 'draft',
        farmerOrFarmOwnerName: 'Maria Santos',
        submittedAt: null,
        syncStatus: 'local_only',
      },
    });
    await expect(findFieldReportById(database, REPORT_ID, SUBMITTER_ID)).resolves.toMatchObject({
      farmerOrFarmOwnerName: 'Maria Santos',
      observedAt: OBSERVED_AT,
      submittedAt: null,
    });
    native.close();
  });

  it('keeps entered Draft data when submission-image preparation fails', async () => {
    const { database, native } = openTestDatabase();
    insertCompleteClassScores(native);
    await createOrGetFieldReportDraft(database, createDraftInput());
    await saveManualMapLocation(database, REPORT_ID, SUBMITTER_ID, {
      latitude: 14.071,
      longitude: 120.635,
      selectedAt: '2026-08-10T02:00:00.000Z',
      updatedAt: '2026-08-10T02:00:01.000Z',
    });

    const result = await finalizeFieldReport(
      database,
      REPORT_ID,
      SUBMITTER_ID,
      {
        farmerOrFarmOwnerName: 'Maria Santos',
        affectedAreaHectares: 0.5,
        affectedPortionPercent: 30,
        barangay: 'Lumbangan',
        submittedAt: '2026-08-10T03:00:00.000Z',
        updatedAt: '2026-08-10T03:00:00.000Z',
      },
      {
        imageExists: () => true,
        prepareSubmissionImage: async () => {
          throw new StorageError(
            'IMAGE_PREPARATION_FAILED',
            'compression failed',
          );
        },
      },
    );

    expect(result).toMatchObject({
      status: 'invalid',
      missingRequirements: ['submission_image'],
      report: {
        authoringState: 'draft',
        farmerOrFarmOwnerName: 'Maria Santos',
        barangay: 'Lumbangan',
        submittedAt: null,
        syncStatus: 'local_only',
      },
    });
    expect(
      native
        .prepare(
          'SELECT authoring_state, farmer_or_farm_owner_name, barangay, submitted_at FROM field_reports',
        )
        .get(),
    ).toEqual({
      authoring_state: 'draft',
      farmer_or_farm_owner_name: 'Maria Santos',
      barangay: 'Lumbangan',
      submitted_at: null,
    });
    expect(
      native
        .prepare(
          `SELECT managed_image_uri, submission_image_uri,
                  submission_image_mime_type, submission_image_size_bytes
             FROM scan_records`,
        )
        .get(),
    ).toEqual({
      managed_image_uri: `file:///caneguard/scan-images/${SCAN_ID}.jpg`,
      submission_image_uri: null,
      submission_image_mime_type: null,
      submission_image_size_bytes: null,
    });
    native.close();
  });

  it('persists an oversized-image derivative before finalization', async () => {
    const { database, native } = openTestDatabase();
    insertCompleteClassScores(native);
    await createOrGetFieldReportDraft(database, createDraftInput());
    await saveManualMapLocation(database, REPORT_ID, SUBMITTER_ID, {
      latitude: 14.071,
      longitude: 120.635,
      selectedAt: '2026-08-10T02:00:00.000Z',
      updatedAt: '2026-08-10T02:00:01.000Z',
    });
    const prepareSubmissionImage = jest.fn(async (input: { sourceUri: string }) => ({
      artifact: {
        mimeType: 'image/jpeg' as const,
        sizeBytes: 9 * 1024 * 1024,
        uri: getSubmissionImageUri(SCAN_ID, SUBMITTER_ID),
      },
      created: true,
      requiresPersistence: true,
    }));

    const result = await finalizeFieldReport(
      database,
      REPORT_ID,
      SUBMITTER_ID,
      {
        farmerOrFarmOwnerName: 'Maria Santos',
        affectedAreaHectares: 0.5,
        affectedPortionPercent: 30,
        barangay: 'Lumbangan',
        submittedAt: '2026-08-10T03:00:00.000Z',
        updatedAt: '2026-08-10T03:00:00.000Z',
      },
      {
        imageExists: () => true,
        prepareSubmissionImage,
      },
    );

    expect(result).toMatchObject({
      status: 'finalized',
      report: { authoringState: 'finalized', syncStatus: 'pending' },
    });
    expect(prepareSubmissionImage).toHaveBeenCalledWith(
      expect.objectContaining({
        recordId: SCAN_ID,
        sourceUri: `file:///caneguard/scan-images/${SCAN_ID}.jpg`,
      }),
    );
    expect(
      native
        .prepare(
          'SELECT submission_image_uri, submission_image_mime_type, submission_image_size_bytes FROM scan_records',
        )
        .get(),
    ).toEqual({
      submission_image_uri: getSubmissionImageUri(SCAN_ID, SUBMITTER_ID),
      submission_image_mime_type: 'image/jpeg',
      submission_image_size_bytes: 9 * 1024 * 1024,
    });
    native.close();
  });

  it('finalizes a GPS-complete report locally with pending status for offline sync', async () => {
    const { database, native } = openTestDatabase();
    insertCompleteClassScores(native);
    await createOrGetFieldReportDraft(database, createDraftInput());
    await saveGpsCapture(database, REPORT_ID, SUBMITTER_ID, {
      accuracy: 4.2,
      capturedAt: '2026-08-10T01:04:00.000Z',
      latitude: 14.0667,
      longitude: 120.6319,
      outcome: 'resolved',
      updatedAt: '2026-08-10T01:04:01.000Z',
    });

    await expect(
      finalizeFieldReport(
        database,
        REPORT_ID,
        SUBMITTER_ID,
        {
          farmerOrFarmOwnerName: 'Maria Santos',
          affectedAreaHectares: 0.5,
          affectedPortionPercent: 30,
          barangay: 'Lumbangan',
          submittedAt: '2026-08-10T03:00:00.000Z',
          updatedAt: '2026-08-10T03:00:00.000Z',
        },
        IMAGE_EXISTS,
      ),
    ).resolves.toMatchObject({
      status: 'finalized',
      report: {
        id: REPORT_ID,
        authoringState: 'finalized',
        locationSource: 'gps',
        gpsAccuracy: 4.2,
        observedAt: OBSERVED_AT,
        submittedAt: '2026-08-10T03:00:00.000Z',
        syncStatus: 'pending',
      },
    });
    await expect(findFieldReportById(database, REPORT_ID, SUBMITTER_ID)).resolves.toMatchObject({
      id: REPORT_ID,
      authoringState: 'finalized',
      syncStatus: 'pending',
    });
    expect(native.prepare('SELECT count(*) AS count FROM field_reports').get()).toEqual({ count: 1 });
    expect(
      native
        .prepare(
          'SELECT submission_image_uri, submission_image_mime_type, submission_image_size_bytes FROM scan_records',
        )
        .get(),
    ).toEqual({
      submission_image_uri: `file:///caneguard/scan-images/${SCAN_ID}.jpg`,
      submission_image_mime_type: 'image/jpeg',
      submission_image_size_bytes: 4096,
    });
    native.close();
  });

  it('finalizes a manual-map-complete report with null GPS accuracy', async () => {
    const { database, native } = openTestDatabase();
    insertCompleteClassScores(native);
    await createOrGetFieldReportDraft(database, createDraftInput());
    await saveManualMapLocation(database, REPORT_ID, SUBMITTER_ID, {
      latitude: 14.071,
      longitude: 120.635,
      selectedAt: '2026-08-10T02:00:00.000Z',
      updatedAt: '2026-08-10T02:00:01.000Z',
    });

    const result = await finalizeFieldReport(
      database,
      REPORT_ID,
      SUBMITTER_ID,
      {
        farmerOrFarmOwnerName: 'Maria Santos',
        affectedAreaHectares: 0.5,
        affectedPortionPercent: 30,
        barangay: 'Lumbangan',
        submittedAt: '2026-08-10T03:00:00.000Z',
        updatedAt: '2026-08-10T03:00:00.000Z',
      },
      IMAGE_EXISTS,
    );

    expect(result).toMatchObject({
      status: 'finalized',
      report: {
        id: REPORT_ID,
        locationSource: 'manual_map',
        gpsAccuracy: null,
        manualLocationSelectedAt: '2026-08-10T02:00:00.000Z',
        observedAt: OBSERVED_AT,
        syncStatus: 'pending',
      },
    });
    native.close();
  });

  it('excludes Drafts from the upload queue', async () => {
    const { database, native } = openTestDatabase();
    await createOrGetFieldReportDraft(database, createDraftInput());

    await expect(
      findFieldReportSyncCandidates(database, SUBMITTER_ID, 10, {
        includeRetryableFailed: true,
      }),
    ).resolves.toEqual([]);
    await expect(countUnsyncedFieldReports(database, SUBMITTER_ID)).resolves.toBe(0);
    expect(native.prepare('SELECT sync_status FROM field_reports').get()).toEqual({
      sync_status: 'local_only',
    });
    native.close();
  });

  it('does not queue a report whose scan was quarantined during owner migration', async () => {
    const { database, native } = openTestDatabase();
    insertCompleteClassScores(native);
    await createOrGetFieldReportDraft(database, createDraftInput());
    await saveManualMapLocation(database, REPORT_ID, SUBMITTER_ID, {
      latitude: 14.071,
      longitude: 120.635,
      selectedAt: '2026-08-10T02:00:00.000Z',
      updatedAt: '2026-08-10T02:00:01.000Z',
    });
    await finalizeFieldReport(
      database,
      REPORT_ID,
      SUBMITTER_ID,
      {
        farmerOrFarmOwnerName: 'Maria Santos',
        affectedAreaHectares: 0.5,
        affectedPortionPercent: 30,
        barangay: 'Lumbangan',
        submittedAt: '2026-08-10T03:00:00.000Z',
        updatedAt: '2026-08-10T03:00:00.000Z',
      },
      IMAGE_EXISTS,
    );
    native
      .prepare('UPDATE scan_records SET owner_identity = ? WHERE id = ?')
      .run(LEGACY_UNASSIGNED_OWNER_IDENTITY, SCAN_ID);

    await expect(
      findFieldReportSyncCandidates(database, SUBMITTER_ID, 10),
    ).resolves.toEqual([]);
    native.close();
  });

  it('selects only due retryable failed reports for automatic synchronization', async () => {
    const { database, native } = openTestDatabase();
    insertCompleteClassScores(native);
    await createOrGetFieldReportDraft(database, createDraftInput());
    await saveManualMapLocation(database, REPORT_ID, SUBMITTER_ID, {
      latitude: 14.071,
      longitude: 120.635,
      selectedAt: '2026-08-10T02:00:00.000Z',
      updatedAt: '2026-08-10T02:00:01.000Z',
    });
    await finalizeFieldReport(
      database,
      REPORT_ID,
      SUBMITTER_ID,
      {
        farmerOrFarmOwnerName: 'Maria Santos',
        affectedAreaHectares: 0.5,
        affectedPortionPercent: 30,
        barangay: 'Lumbangan',
        submittedAt: '2026-08-10T03:00:00.000Z',
        updatedAt: '2026-08-10T03:00:00.000Z',
      },
      IMAGE_EXISTS,
    );

    await markFieldReportFailed(
      database,
      REPORT_ID,
      SUBMITTER_ID,
      'NETWORK_REQUEST_FAILED',
      '2026-08-10T04:00:00.000Z',
    );
    await expect(
      findFieldReportSyncCandidates(database, SUBMITTER_ID, 10, {
        failedBefore: '2026-08-10T05:00:00.000Z',
        includeRetryableFailed: true,
      }),
    ).resolves.toMatchObject([{ id: REPORT_ID, syncStatus: 'failed' }]);

    await markFieldReportFailed(
      database,
      REPORT_ID,
      SUBMITTER_ID,
      'NETWORK_REQUEST_FAILED',
      '2026-08-10T05:30:00.000Z',
    );
    await expect(
      findFieldReportSyncCandidates(database, SUBMITTER_ID, 10, {
        failedBefore: '2026-08-10T05:00:00.000Z',
        includeRetryableFailed: true,
      }),
    ).resolves.toEqual([]);

    await markFieldReportFailed(
      database,
      REPORT_ID,
      SUBMITTER_ID,
      'API_VALIDATION_FAILED',
      '2026-08-10T03:00:00.000Z',
    );
    await expect(
      findFieldReportSyncCandidates(database, SUBMITTER_ID, 10, {
        failedBefore: '2026-08-10T05:00:00.000Z',
        includeRetryableFailed: true,
      }),
    ).resolves.toEqual([]);
    native.close();
  });

  it('persists failure, retries the same finalized report, and retains scan evidence after success', async () => {
    const { database, native } = openTestDatabase();
    insertCompleteClassScores(native);
    await createOrGetFieldReportDraft(database, createDraftInput());
    await saveManualMapLocation(database, REPORT_ID, SUBMITTER_ID, {
      latitude: 14.071,
      longitude: 120.635,
      selectedAt: '2026-08-10T02:00:00.000Z',
      updatedAt: '2026-08-10T02:00:01.000Z',
    });
    await finalizeFieldReport(
      database,
      REPORT_ID,
      SUBMITTER_ID,
      {
        farmerOrFarmOwnerName: 'Maria Santos',
        affectedAreaHectares: 0.5,
        affectedPortionPercent: 30,
        barangay: 'Lumbangan',
        submittedAt: '2026-08-10T03:00:00.000Z',
        updatedAt: '2026-08-10T03:00:00.000Z',
      },
      IMAGE_EXISTS,
    );

    await expect(
      findFieldReportSyncCandidates(database, OTHER_SUBMITTER_ID, 10),
    ).resolves.toEqual([]);
    await expect(
      findFieldReportUploadRecord(database, REPORT_ID, OTHER_SUBMITTER_ID),
    ).rejects.toMatchObject<Partial<StorageError>>({
      code: 'FIELD_REPORT_NOT_FOUND',
    });
    await expect(
      findFieldReportSyncCandidates(database, SUBMITTER_ID, 10),
    ).resolves.toMatchObject([
      { id: REPORT_ID, scanRecordId: SCAN_ID, syncStatus: 'pending' },
    ]);
    await markFieldReportSyncing(
      database,
      REPORT_ID,
      SUBMITTER_ID,
      '2026-08-10T04:00:00.000Z',
    );
    await markFieldReportFailed(
      database,
      REPORT_ID,
      SUBMITTER_ID,
      'NETWORK_UNAVAILABLE',
      '2026-08-10T04:00:01.000Z',
    );
    await markFieldReportPending(database, REPORT_ID, SUBMITTER_ID);
    await markFieldReportSyncing(
      database,
      REPORT_ID,
      SUBMITTER_ID,
      '2026-08-10T04:01:00.000Z',
    );
    await markFieldReportSynced(
      database,
      REPORT_ID,
      SUBMITTER_ID,
      'server-report-uuid',
      '2026-08-10T04:01:01.000Z',
    );

    await expect(findFieldReportById(database, REPORT_ID, SUBMITTER_ID)).resolves.toMatchObject({
      id: REPORT_ID,
      remoteId: 'server-report-uuid',
      syncAttemptCount: 2,
      syncStatus: 'synced',
      lastSyncedAt: '2026-08-10T04:01:01.000Z',
    });
    expect(native.prepare('SELECT id, managed_image_uri FROM scan_records').get()).toEqual({
      id: SCAN_ID,
      managed_image_uri: `file:///caneguard/scan-images/${SCAN_ID}.jpg`,
    });
    expect(native.prepare('SELECT count(*) AS count FROM scan_class_scores').get()).toEqual({
      count: 4,
    });
    native.close();
  });

  it('keeps reports editable when upload image evidence is unavailable', async () => {
    const { database, native } = openTestDatabase();
    insertCompleteClassScores(native);
    await createOrGetFieldReportDraft(database, createDraftInput());
    await saveManualMapLocation(database, REPORT_ID, SUBMITTER_ID, {
      latitude: 14.071,
      longitude: 120.635,
      selectedAt: '2026-08-10T02:00:00.000Z',
      updatedAt: '2026-08-10T02:00:01.000Z',
    });

    const result = await finalizeFieldReport(
      database,
      REPORT_ID,
      SUBMITTER_ID,
      {
        farmerOrFarmOwnerName: 'Maria Santos',
        affectedAreaHectares: 0.5,
        affectedPortionPercent: 30,
        barangay: 'Lumbangan',
        submittedAt: '2026-08-10T03:00:00.000Z',
        updatedAt: '2026-08-10T03:00:00.000Z',
      },
      { imageExists: () => false },
    );

    expect(result).toMatchObject({
      status: 'invalid',
      missingRequirements: ['original_scan_image'],
      report: { authoringState: 'draft', syncStatus: 'local_only' },
    });
    native.close();
  });

  it('keeps reports editable when source image dimensions are unavailable', async () => {
    const { database, native } = openTestDatabase();
    insertCompleteClassScores(native);
    native.prepare('UPDATE scan_records SET source_width = NULL').run();
    await createOrGetFieldReportDraft(database, createDraftInput());
    await saveManualMapLocation(database, REPORT_ID, SUBMITTER_ID, {
      latitude: 14.071,
      longitude: 120.635,
      selectedAt: '2026-08-10T02:00:00.000Z',
      updatedAt: '2026-08-10T02:00:01.000Z',
    });

    const result = await finalizeFieldReport(
      database,
      REPORT_ID,
      SUBMITTER_ID,
      {
        farmerOrFarmOwnerName: 'Maria Santos',
        affectedAreaHectares: 0.5,
        affectedPortionPercent: 30,
        barangay: 'Lumbangan',
        submittedAt: '2026-08-10T03:00:00.000Z',
        updatedAt: '2026-08-10T03:00:00.000Z',
      },
      IMAGE_EXISTS,
    );

    expect(result).toMatchObject({
      status: 'invalid',
      missingRequirements: ['source_image_dimensions'],
      report: { authoringState: 'draft', syncStatus: 'local_only' },
    });
    native.close();
  });
});

describe('P2-01 smart field report fields', () => {
  it('persists and reloads draft fields, region selection, and RSSI reporter observation', async () => {
    const { database, native } = openTestDatabase();
    await createOrGetFieldReportDraft(database, createDraftInput());

    const saved = await saveFieldReportDraft(database, REPORT_ID, SUBMITTER_ID, {
      farmerOrFarmOwnerName: 'Maria Santos',
      province: 'Cavite',
      municipality: 'Tagaytay',
      barangay: 'Kaybagal',
      affectedAreaHectares: 1.25,
      affectedPortionPercent: 40,
      sugarcaneVariety: 'Phil 2000',
      cropAge: '~3 months',
      caneClass: 'Plant cane',
      fieldNotes: 'Near the river',
      mismatchReported: true,
      reporterSuspectedCondition: 'RSSI',
      reporterObservationText: 'Radio signal concern noted in the field.',
      updatedAt: '2026-08-10T01:05:00.000Z',
    });
    const reopened = await findFieldReportById(database, REPORT_ID, SUBMITTER_ID);

    expect(saved).toMatchObject({
      province: 'Cavite',
      municipality: 'Tagaytay',
      barangay: 'Kaybagal',
      affectedAreaHectares: 1.25,
      affectedPortionPercent: 40,
      sugarcaneVariety: 'Phil 2000',
      cropAge: '~3 months',
      caneClass: 'Plant cane',
      fieldNotes: 'Near the river',
      mismatchReported: true,
      reporterSuspectedCondition: 'RSSI',
      reporterObservationText: 'Radio signal concern noted in the field.',
    });
    expect(reopened).toEqual(saved);
    native.close();
  });

  it('seeds province and municipality from the create input', async () => {
    const { database, native } = openTestDatabase();
    const created = await createOrGetFieldReportDraft(database, {
      ...createDraftInput(),
      province: 'Cavite',
      municipality: 'Tagaytay',
    });

    expect(created).toMatchObject({
      province: 'Cavite',
      municipality: 'Tagaytay',
    });
    native.close();
  });

  it('rejects an out-of-range affected area on Draft save', async () => {
    const { database, native } = openTestDatabase();
    await createOrGetFieldReportDraft(database, createDraftInput());

    await expect(
      saveFieldReportDraft(database, REPORT_ID, SUBMITTER_ID, {
        affectedAreaHectares: -1,
        updatedAt: '2026-08-10T01:05:00.000Z',
      }),
    ).rejects.toMatchObject<Partial<StorageError>>({
      code: 'INVALID_FIELD_REPORT',
    });
    native.close();
  });

  it('clears stored affected numbers when the Draft is saved with nulls', async () => {
    const { database, native } = openTestDatabase();
    await createOrGetFieldReportDraft(database, createDraftInput());
    await saveFieldReportDraft(database, REPORT_ID, SUBMITTER_ID, {
      affectedAreaHectares: 1.25,
      affectedPortionPercent: 40,
      updatedAt: '2026-08-10T01:05:00.000Z',
    });

    const cleared = await saveFieldReportDraft(database, REPORT_ID, SUBMITTER_ID, {
      affectedAreaHectares: null,
      affectedPortionPercent: null,
      updatedAt: '2026-08-10T01:06:00.000Z',
    });

    expect(cleared.affectedAreaHectares).toBeNull();
    expect(cleared.affectedPortionPercent).toBeNull();
    native.close();
  });

  it('rejects missing or invalid affected numbers at finalization', async () => {
    const { database, native } = openTestDatabase();
    insertCompleteClassScores(native);
    await createOrGetFieldReportDraft(database, createDraftInput());

    await expect(
      finalizeFieldReport(
        database,
        REPORT_ID,
        SUBMITTER_ID,
        {
          farmerOrFarmOwnerName: 'Maria Santos',
          barangay: 'Wawa',
          affectedAreaHectares: Number.NaN,
          affectedPortionPercent: Number.NaN,
          submittedAt: '2026-08-10T03:00:00.000Z',
          updatedAt: '2026-08-10T03:00:00.000Z',
        },
        IMAGE_EXISTS,
      ),
    ).rejects.toMatchObject<Partial<StorageError>>({ code: 'INVALID_FIELD_REPORT' });

    await expect(
      finalizeFieldReport(
        database,
        REPORT_ID,
        SUBMITTER_ID,
        {
          farmerOrFarmOwnerName: 'Maria Santos',
          barangay: 'Wawa',
          affectedAreaHectares: 0.5,
          affectedPortionPercent: 150,
          submittedAt: '2026-08-10T03:00:00.000Z',
          updatedAt: '2026-08-10T03:00:00.000Z',
        },
        IMAGE_EXISTS,
      ),
    ).rejects.toMatchObject<Partial<StorageError>>({ code: 'INVALID_FIELD_REPORT' });
    native.close();
  });

  it('finalizes with the new fields persisted and mapped', async () => {
    const { database, native } = openTestDatabase();
    insertCompleteClassScores(native);
    await createOrGetFieldReportDraft(database, createDraftInput());
    await saveGpsCapture(database, REPORT_ID, SUBMITTER_ID, {
      accuracy: 4.2,
      capturedAt: '2026-08-10T01:04:00.000Z',
      latitude: 14.0667,
      longitude: 120.6319,
      outcome: 'resolved',
      updatedAt: '2026-08-10T01:04:01.000Z',
    });

    const result = await finalizeFieldReport(
      database,
      REPORT_ID,
      SUBMITTER_ID,
      {
        farmerOrFarmOwnerName: 'Maria Santos',
        barangay: 'Wawa',
        affectedAreaHectares: 0.75,
        affectedPortionPercent: 25,
        sugarcaneVariety: 'Phil 2000',
        cropAge: '~3 months',
        caneClass: 'Plant cane',
        fieldNotes: 'Dry patches',
        mismatchReported: true,
        reporterObservationText: 'Visible symptoms differ from the possible result.',
        reporterSuspectedCondition: 'Local condition',
        submittedAt: '2026-08-10T03:00:00.000Z',
        updatedAt: '2026-08-10T03:00:00.000Z',
      },
      IMAGE_EXISTS,
    );

    expect(result.status).toBe('finalized');
    if (result.status === 'finalized') {
      expect(result.report).toMatchObject({
        authoringState: 'finalized',
        affectedAreaHectares: 0.75,
        affectedPortionPercent: 25,
        sugarcaneVariety: 'Phil 2000',
        cropAge: '~3 months',
        caneClass: 'Plant cane',
        fieldNotes: 'Dry patches',
        mismatchReported: true,
        reporterObservationText: 'Visible symptoms differ from the possible result.',
        reporterSuspectedCondition: 'Local condition',
      });
      expect(native.prepare('SELECT predicted_label, confidence, checklist_consistency FROM scan_records').get()).toEqual({
        predicted_label: 'rust',
        confidence: 0.8,
        checklist_consistency: 'consistent',
      });
    }
    native.close();
  });
});
