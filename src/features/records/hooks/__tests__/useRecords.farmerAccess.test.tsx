import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  DatabaseSync,
  type SQLInputValue,
  type StatementSync,
} from 'node:sqlite';

import { act, renderHook, waitFor } from '@testing-library/react-native';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import type { SQLiteDatabase, SQLiteStatement } from 'expo-sqlite';

import type { CaneGuardDatabase } from '@/database/database';
import * as schema from '@/database/schema';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { insertScanRecord } from '@/features/records/data/scanRecordWriteRepository';
import type { SaveCompletedScanInput } from '@/features/records/domain/recordTypes';
import { usePaginatedScanRecords } from '@/features/records/hooks/useRecords';
import { useLocalReport } from '@/features/reports/hooks/useLocalReport';
import { getManagedScanImageDirectory } from '@/features/records/services/scanImageStorage';

const RECORD_ID = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2';
const REPORT_ID = '7ea3e6f0-b893-4fd3-b414-0b797e62ec8e';
const SUBMITTER_ID = 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17';
const MANAGED_ROOT = getManagedScanImageDirectory(SUBMITTER_ID).uri;
let mockDatabase: CaneGuardDatabase;
let mockFocusCallback: (() => void | (() => void)) | null = null;

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void | (() => void)) => {
    mockFocusCallback = callback;
  },
}));
jest.mock('@/database/DatabaseProvider', () => ({
  EMPTY_DATABASE: {},
  useCaneGuardDatabase: () => mockDatabase,
}));
jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

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

function openTestDatabase(): {
  database: CaneGuardDatabase;
  native: DatabaseSync;
} {
  const native = new DatabaseSync(':memory:');
  native.exec('PRAGMA foreign_keys = ON');
  native.exec(readMigration('0000_complex_johnny_blaze.sql'));
  native.exec(readMigration('0001_loving_amazoness.sql'));
  native.exec(readMigration('0002_talented_kat_farrell.sql'));
  native.exec(readMigration('0003_careful_marauders.sql'));
  native.exec(readMigration('0004_sour_namora.sql'));
  native.exec(readMigration('0005_tricky_the_santerians.sql'));
  native.exec(readMigration('0006_curvy_piledriver.sql'));
  native.exec(readMigration('0007_familiar_old_lace.sql'));
  native.exec(readMigration('0012_dapper_sumo.sql'));
  native.exec(readMigration('0013_v1_local_scan_migration.sql'));
  native.exec(readMigration('0026_scan_follow_up_check.sql'));
  native.exec(readMigration('0029_scan_personal_place.sql'));
  native.exec(readMigration('0034_authority_workflow_status.sql'));
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

function validInput(
  overrides: Partial<SaveCompletedScanInput> = {},
): SaveCompletedScanInput {
  return {
    id: RECORD_ID,
    ownerIdentity: SUBMITTER_ID,
    managedImageUri: `${MANAGED_ROOT}/${RECORD_ID}.jpg`,
    imageMimeType: 'image/jpeg',
    imageSizeBytes: 4096,
    imageSourceType: 'camera',
    sourceWidth: 1200,
    sourceHeight: 900,
    predictedLabel: 'rust',
    confidence: 0.82,
    classScores: [
      { label: 'healthy', score: 0.05 },
      { label: 'mosaic', score: 0.13 },
      { label: 'rust', score: 0.82 },
      { label: 'smut', score: 0 },
    ],
    symptoms: ['rust'],
    checklistConsistency: 'consistent',
    reportedSeverity: 'Moderate',
    qualityWarnings: ['too-dark'],
    barangay: 'Wawa',
    decisionSupportWording:
      'Possible result only. This output does not confirm a disease.',
    modelVersion: 'v1.0-mobilenetv2',
    preprocessMs: 4.25,
    inferenceMs: 8.5,
    totalMs: 12.75,
    createdAt: '2026-07-25T05:30:00.000Z',
    updatedAt: '2026-07-25T05:30:00.000Z',
    ...overrides,
  };
}

function insertFieldReport(native: DatabaseSync): void {
  native
    .prepare(`
      INSERT INTO field_reports (
        id, scan_record_id, authoring_state, submitter_identity,
        barangay, sync_status, authority_status_raw, authority_updated_at,
        observed_at, created_at, updated_at
      ) VALUES (?, ?, 'finalized', ?, ?, 'failed', 'verified_by_staff', ?, ?, ?, ?)
    `)
    .run(
      REPORT_ID,
      RECORD_ID,
      SUBMITTER_ID,
      'Lumbangan',
      '2026-08-10T01:00:00.000Z',
      '2026-07-25T05:30:00.000Z',
      '2026-08-10T01:00:00.000Z',
      '2026-08-10T01:00:00.000Z',
    );
}

beforeEach(() => {
  mockFocusCallback = null;
  jest.mocked(useAuth).mockReturnValue({
    user: { uuid: SUBMITTER_ID, role: 'farmer' },
  } as never);
});

it('returns scan-only activity records for a farmer from the real repository', async () => {
  const { database, native } = openTestDatabase();
  mockDatabase = database;
  await insertScanRecord(database, validInput());
  insertFieldReport(native);

  const { result } = await renderHook(() =>
    usePaginatedScanRecords({}, 10),
  );
  await act(async () => {
    mockFocusCallback?.();
  });

  await waitFor(() => expect(result.current.data).toHaveLength(1));
  expect(result.current.data[0]).toMatchObject({
    authorityReview: null,
    barangay: 'Wawa',
    hasFieldReport: false,
    syncStatus: 'local_only',
  });
  native.close();
});

it('returns a scan-only summary for a farmer from the real repository', async () => {
  const { database, native } = openTestDatabase();
  mockDatabase = database;
  await insertScanRecord(database, validInput());
  insertFieldReport(native);

  const { result } = await renderHook(() => useLocalReport());
  await act(async () => {
    mockFocusCallback?.();
  });

  await waitFor(() => expect(result.current.data).not.toBeNull());
  expect(result.current.data).toMatchObject({
    pendingSyncRecords: 0,
    recentRecords: [
      expect.objectContaining({
        authorityReview: null,
        barangay: 'Wawa',
        hasFieldReport: false,
        syncStatus: 'local_only',
      }),
    ],
  });
  native.close();
});

it('returns inspector report projections from the real repository', async () => {
  const { database, native } = openTestDatabase();
  mockDatabase = database;
  await insertScanRecord(database, validInput());
  insertFieldReport(native);
  jest.mocked(useAuth).mockReturnValue({
    user: { uuid: SUBMITTER_ID, role: 'field_reporter', capabilities: ['report:submit'] },
  } as never);

  const { result } = await renderHook(() =>
    usePaginatedScanRecords({}, 10),
  );
  await act(async () => {
    mockFocusCallback?.();
  });

  await waitFor(() => expect(result.current.data).toHaveLength(1));
  expect(result.current.data[0]).toMatchObject({
    authorityReview: expect.objectContaining({
      rawStatus: 'verified_by_staff',
      statusLabel: 'Verified by staff',
    }),
    barangay: 'Lumbangan',
    hasFieldReport: true,
    syncStatus: 'failed',
  });
  native.close();
});

it('keeps report projections for an inspector who lost authoring capability', async () => {
  const { database, native } = openTestDatabase();
  mockDatabase = database;
  await insertScanRecord(database, validInput());
  insertFieldReport(native);
  jest.mocked(useAuth).mockReturnValue({
    user: { uuid: SUBMITTER_ID, role: 'field_reporter', capabilities: [] },
  } as never);

  const { result } = await renderHook(() =>
    usePaginatedScanRecords({}, 10),
  );
  await act(async () => {
    mockFocusCallback?.();
  });

  await waitFor(() => expect(result.current.data).toHaveLength(1));
  expect(result.current.data[0]).toMatchObject({
    authorityReview: expect.objectContaining({
      rawStatus: 'verified_by_staff',
      statusLabel: 'Verified by staff',
    }),
    barangay: 'Lumbangan',
    hasFieldReport: true,
    syncStatus: 'failed',
  });
  native.close();
});

it('counts pending historical field reports for an inspector who lost authoring capability', async () => {
  const { database, native } = openTestDatabase();
  mockDatabase = database;
  await insertScanRecord(database, validInput());
  insertFieldReport(native);
  jest.mocked(useAuth).mockReturnValue({
    user: { uuid: SUBMITTER_ID, role: 'field_reporter', capabilities: [] },
  } as never);

  const { result } = await renderHook(() => useLocalReport());
  await act(async () => {
    mockFocusCallback?.();
  });

  await waitFor(() => expect(result.current.data).not.toBeNull());
  expect(result.current.data).toMatchObject({ pendingSyncRecords: 1 });
  native.close();
});
