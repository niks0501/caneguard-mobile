import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import type { SQLiteDatabase, SQLiteStatement } from 'expo-sqlite';

import type { CaneGuardDatabase } from '@/database/database';
import * as schema from '@/database/schema';
import { saveFieldValidationCompletion } from '@/features/assignments/data/fieldValidationCompletionRepository';
import {
  createOrGetFieldReportDraft,
  finalizeFieldReport,
  findFieldReportById,
  saveManualMapLocation,
} from '@/features/reports/data/fieldReportRepository';
import { getSubmissionImageUri } from '@/features/records/services/scanImageStorage';
import {
  findOwnedFieldSurvey,
  markFieldSurveyPending,
  saveFieldSurveyDraft,
} from '@/features/surveys/data/fieldSurveyRepository';
import { ringArea } from '@/features/surveys/domain/fieldSurvey';

const OWNER = 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17';
const SCAN_ID = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2';
const REPORT_ID = '7ea3e6f0-b893-4fd3-b414-0b797e62ec8e';
const CARRYOVER = { basis: 'carryover' as const, verifiedAt: '2026-11-12T08:00:00.000Z' };
const VERIFIED = { basis: 'verified' as const, verifiedAt: '2026-11-13T08:00:00.000Z' };

function openDatabase(): { database: CaneGuardDatabase; native: DatabaseSync } {
  const native = new DatabaseSync(':memory:');
  native.exec('PRAGMA foreign_keys = ON');
  for (const file of readdirSync('drizzle').filter((name) => name.endsWith('.sql')).sort()) {
    native.exec(readFileSync(`drizzle/${file}`, 'utf8').replaceAll('--> statement-breakpoint', ''));
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

function seedScan(native: DatabaseSync): void {
  native.prepare(`
    INSERT INTO scan_records (
      id, owner_identity, managed_image_uri, image_source_type, predicted_label, confidence,
      checklist_consistency, model_version, preprocess_ms, inference_ms, total_ms,
      source_width, source_height, created_at, updated_at
    ) VALUES (?, ?, ?, 'camera', 'rust', 0.8, 'consistent', 'v1.0-mobilenetv2', 5, 8, 13, 1200, 900, ?, ?)
  `).run(SCAN_ID, OWNER, `file:///caneguard/scan-images/${SCAN_ID}.jpg`, '2026-07-25T05:30:00.000Z', '2026-07-25T05:30:00.000Z');
  const insert = native.prepare('INSERT INTO scan_class_scores (scan_record_id, label, score) VALUES (?, ?, ?)');
  insert.run(SCAN_ID, 'healthy', 0.1);
  insert.run(SCAN_ID, 'mosaic', 0.1);
  insert.run(SCAN_ID, 'rust', 0.8);
  insert.run(SCAN_ID, 'smut', 0);
}

async function finalizeReport(
  database: CaneGuardDatabase,
  provenance?: typeof CARRYOVER | typeof VERIFIED,
) {
  await createOrGetFieldReportDraft(database, {
    id: REPORT_ID,
    scanRecordId: SCAN_ID,
    createdAt: '2026-08-10T01:00:00.000Z',
    submitterIdentity: OWNER,
    submitterRole: 'field_reporter',
  });
  await saveManualMapLocation(database, REPORT_ID, OWNER, {
    latitude: 14.071,
    longitude: 120.635,
    selectedAt: '2026-08-10T02:00:00.000Z',
    updatedAt: '2026-08-10T02:00:01.000Z',
  });
  return finalizeFieldReport(
    database,
    REPORT_ID,
    OWNER,
    {
      farmerOrFarmOwnerName: 'Maria Santos',
      affectedAreaHectares: 0.5,
      affectedPortionPercent: 30,
      barangay: 'Lumbangan',
      submittedAt: '2026-08-10T03:00:00.000Z',
      updatedAt: '2026-08-10T03:00:00.000Z',
      ...(provenance ? { provenance } : {}),
    },
    {
      imageExists: () => true,
      prepareSubmissionImage: async () => ({
        artifact: { mimeType: 'image/jpeg' as const, sizeBytes: 4096, uri: getSubmissionImageUri(SCAN_ID, OWNER) },
        created: false,
        requiresPersistence: true,
      }),
    },
  );
}

describe('authoring provenance is frozen with the record (NET-3)', () => {
  // Intent: "freeze provenance at finish": a finalized report keeps the basis and /me time it was finished under.
  it('stores the basis on the report in the transaction that finalizes it', async () => {
    const { database, native } = openDatabase();
    seedScan(native);
    const result = await finalizeReport(database, CARRYOVER);
    expect(result).toMatchObject({
      status: 'finalized',
      report: { authorizationBasis: 'carryover', capabilitiesVerifiedAt: CARRYOVER.verifiedAt },
    });
    await expect(findFieldReportById(database, REPORT_ID, OWNER)).resolves.toMatchObject({
      authorizationBasis: 'carryover',
      capabilitiesVerifiedAt: CARRYOVER.verifiedAt,
    });
    native.close();
  });

  // Intent: a report finished without provenance (an older caller) carries no invented basis.
  it('invents no provenance for a report finalized without one', async () => {
    const { database, native } = openDatabase();
    seedScan(native);
    await finalizeReport(database);
    const stored = await findFieldReportById(database, REPORT_ID, OWNER);
    expect(stored).toMatchObject({ authoringState: 'finalized' });
    expect(stored).not.toHaveProperty('authorizationBasis');
    native.close();
  });

  // Intent: "freeze provenance at finish" for boundaries, stamped when the boundary is queued.
  it('stores the basis on a boundary when it is queued', async () => {
    const { database, native } = openDatabase();
    const polygon = { type: 'Polygon' as const, coordinates: [[[120, 14], [120.001, 14], [120.001, 14.001], [120, 14.001], [120, 14]]] };
    const area = ringArea(polygon.coordinates[0]);
    const at = '2026-10-05T09:00:00.000Z';
    const waypoints = [
      { latitude: 14, longitude: 120, source: 'map' as const, accuracyMeters: null, capturedAt: at },
      { latitude: 14, longitude: 120.001, source: 'map' as const, accuracyMeters: null, capturedAt: at },
      { latitude: 14.001, longitude: 120.001, source: 'map' as const, accuracyMeters: null, capturedAt: at },
      { latitude: 14.001, longitude: 120, source: 'map' as const, accuracyMeters: null, capturedAt: at },
    ];
    await saveFieldSurveyDraft(database, {
      authorRole: 'field_reporter',
      capturedAt: at,
      clientUuid: 'boundary-1',
      districtCode: 'D-01',
      ownerIdentity: OWNER,
      waypoints,
    });
    markFieldSurveyPending(database, 'boundary-1', OWNER, 'D-01', polygon, area, at, [polygon], area, [waypoints], CARRYOVER);
    expect(findOwnedFieldSurvey(database, 'boundary-1', OWNER)).toMatchObject({
      status: 'pending',
      authorizationBasis: 'carryover',
      capabilitiesVerifiedAt: CARRYOVER.verifiedAt,
    });
    native.close();
  });

  const completion = (provenance?: typeof CARRYOVER | typeof VERIFIED) => ({
    id: '9cc6a6a0-b20f-4ca8-bb7e-1a34cd191e0f',
    ownerIdentity: OWNER,
    assignmentId: '01a04de2-280e-7140-bf56-3c98f98259d5',
    reportUuid: '01a04ddc-9d08-70f7-9b43-ca247cea1a60',
    fieldObservation: 'Fresh leaves show rust-like lesions.',
    fieldFinding: 'Evidence was recorded for office review.',
    actionTaken: 'Provided field guidance and recorded the visit.',
    followUpOutcome: 'improved' as const,
    visitedAt: '2026-09-02T04:05:06.123Z',
    gpsOutcome: 'unavailable' as const,
    gpsAttemptedAt: '2026-09-02T04:05:01.123Z',
    ...(provenance ? { provenance } : {}),
  });

  // Intent: "freeze provenance at finish" for visits, and "no duplicate or corrupt data": saving the same visit again never rewrites what it was finished under.
  it('stores the basis on a visit and never rewrites it on a second save of the same visit', async () => {
    const { database, native } = openDatabase();
    const first = await saveFieldValidationCompletion(database, completion(CARRYOVER));
    expect(first).toMatchObject({ authorizationBasis: 'carryover', capabilitiesVerifiedAt: CARRYOVER.verifiedAt });
    const again = await saveFieldValidationCompletion(database, completion(VERIFIED));
    expect(again).toMatchObject({ authorizationBasis: 'carryover', capabilitiesVerifiedAt: CARRYOVER.verifiedAt });
    expect(native.prepare('SELECT count(*) AS count FROM field_validation_completions').get()).toEqual({ count: 1 });
    native.close();
  });
});
