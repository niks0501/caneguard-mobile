import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  DatabaseSync,
  type SQLInputValue,
  type StatementSync,
} from 'node:sqlite';

import NetInfo from '@react-native-community/netinfo';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import type { SQLiteDatabase, SQLiteStatement } from 'expo-sqlite';
import { AppState, Text } from 'react-native';

import type { CaneGuardDatabase } from '@/database/database';
import * as schema from '@/database/schema';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { countUnsyncedFieldValidationCompletions } from '@/features/assignments/data/fieldValidationCompletionRepository';
import { insertScanRecord } from '@/features/records/data/scanRecordWriteRepository';
import type { SaveCompletedScanInput } from '@/features/records/domain/recordTypes';
import { getManagedScanImageDirectory } from '@/features/records/services/scanImageStorage';
import { countUnsyncedFieldReports } from '@/features/reports/data/fieldReportSyncRepository';
import { countUnsyncedFieldSurveys } from '@/features/surveys/data/fieldSurveySyncRepository';
import { SyncProvider } from '@/features/sync/providers/SyncProvider';

const OWNER = 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17';
const RECORD_ID = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2';
const REPORT_ID = '7ea3e6f0-b893-4fd3-b414-0b797e62ec8e';
const SURVEY_ID = '51214146-7439-48e0-aef4-d0e003f194b4';
const COMPLETION_ID = '9cc6a6a0-b20f-4ca8-bb7e-1a34cd191e0f';
const ASSIGNMENT_ID = '01a04de2-280e-7140-bf56-3c98f98259d5';
const REPORT_UUID = '01a04ddc-9d08-70f7-9b43-ca247cea1a60';
const MANAGED_ROOT = getManagedScanImageDirectory(OWNER).uri;
const ONLINE = {
  isConnected: true,
  isInternetReachable: true,
  type: 'wifi',
} as never;

let mockDatabase: CaneGuardDatabase;
let networkListener: (state: never) => void;

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn(),
    fetch: jest.fn(),
  },
}));
jest.mock('@/database/DatabaseProvider', () => ({
  useCaneGuardDatabase: () => mockDatabase,
}));
jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

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
  for (const filename of readdirSync(join(process.cwd(), 'drizzle'))
    .filter((name) => name.endsWith('.sql'))
    .sort()) {
    native.exec(
      readFileSync(join(process.cwd(), 'drizzle', filename), 'utf8').replaceAll(
        '--> statement-breakpoint',
        '',
      ),
    );
  }
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

function validScanInput(): SaveCompletedScanInput {
  return {
    id: RECORD_ID,
    ownerIdentity: OWNER,
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

async function seedQueuedOfficialRecords(
  database: CaneGuardDatabase,
  native: DatabaseSync,
): Promise<void> {
  const timestamp = new Date().toISOString();
  await insertScanRecord(database, validScanInput());
  native
    .prepare(`
      INSERT INTO field_reports (
        id, scan_record_id, authoring_state, submitter_identity, submitter_role,
        observed_at, submitted_at, sync_status, created_at, updated_at
      ) VALUES (?, ?, 'finalized', ?, 'field_reporter', ?, ?, 'pending', ?, ?)
    `)
    .run(
      REPORT_ID,
      RECORD_ID,
      OWNER,
      timestamp,
      timestamp,
      timestamp,
      timestamp,
    );
  native
    .prepare(`
      INSERT INTO field_surveys (
        client_uuid, owner_identity, district_code, waypoints_json,
        captured_at, status, created_at, updated_at
      ) VALUES (?, ?, 'D-01', '[]', ?, 'pending', ?, ?)
    `)
    .run(SURVEY_ID, OWNER, timestamp, timestamp, timestamp);
  native
    .prepare(`
      INSERT INTO field_validation_completions (
        id, owner_identity, assignment_id, report_uuid, field_observation,
        field_finding, action_taken, visited_at, gps_outcome, gps_attempted_at,
        sync_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'Observed', 'Recorded', 'Guided', ?, 'resolved', ?, 'pending', ?, ?)
    `)
    .run(
      COMPLETION_ID,
      OWNER,
      ASSIGNMENT_ID,
      REPORT_UUID,
      timestamp,
      timestamp,
      timestamp,
      timestamp,
    );
}

async function expectQueuedOfficialRecords(
  database: CaneGuardDatabase,
): Promise<void> {
  await expect(countUnsyncedFieldReports(database, OWNER)).resolves.toBe(1);
  expect(countUnsyncedFieldSurveys(database, OWNER)).toBe(1);
  await expect(
    countUnsyncedFieldValidationCompletions(database, OWNER),
  ).resolves.toBe(1);
}

function renderProvider() {
  return render(
    <SyncProvider>
      <Text>Ready</Text>
    </SyncProvider>,
  );
}

beforeEach(() => {
  jest.mocked(NetInfo.addEventListener).mockImplementation((listener) => {
    networkListener = listener as (state: never) => void;
    return jest.fn();
  });
  jest.mocked(NetInfo.fetch).mockResolvedValue(ONLINE);
  jest.spyOn(AppState, 'addEventListener').mockImplementation(() => ({
    remove: jest.fn(),
  }));
});

it('keeps queued official records for a farmer session', async () => {
  const { database, native } = openTestDatabase();
  mockDatabase = database;
  await seedQueuedOfficialRecords(database, native);
  jest.mocked(useAuth).mockReturnValue({
    status: 'authenticated',
    session: {
      token: 'farmer-token',
      user: { uuid: OWNER, role: 'farmer' },
    },
    markSessionExpired: jest.fn(async () => undefined),
  } as never);

  await renderProvider();
  await waitFor(() => expect(NetInfo.addEventListener).toHaveBeenCalled());
  await act(async () => {
    networkListener(ONLINE);
    await Promise.resolve();
  });

  await expectQueuedOfficialRecords(database);
  expect(
    native
      .prepare("SELECT sync_status FROM field_reports WHERE id = ?")
      .get(REPORT_ID),
  ).toEqual({ sync_status: 'pending' });
  expect(
    native
      .prepare("SELECT status FROM field_surveys WHERE client_uuid = ?")
      .get(SURVEY_ID),
  ).toEqual({ status: 'pending' });
  expect(
    native
      .prepare(
        'SELECT sync_status FROM field_validation_completions WHERE id = ?',
      )
      .get(COMPLETION_ID),
  ).toEqual({ sync_status: 'pending' });
  native.close();
});

it('keeps queued official records after an inspector is demoted', async () => {
  const { database, native } = openTestDatabase();
  mockDatabase = database;
  await seedQueuedOfficialRecords(database, native);
  jest.mocked(useAuth).mockReturnValue({
    status: 'authenticated',
    session: {
      token: 'secure-token',
      user: { uuid: OWNER, role: 'field_reporter' },
    },
    markSessionExpired: jest.fn(async () => undefined),
  } as never);

  const view = await renderProvider();
  await waitFor(() => expect(NetInfo.addEventListener).toHaveBeenCalled());

  jest.mocked(useAuth).mockReturnValue({
    status: 'authenticated',
    session: {
      token: 'secure-token',
      user: { uuid: OWNER, role: 'farmer' },
    },
    markSessionExpired: jest.fn(async () => undefined),
  } as never);
  await view.rerender(
    <SyncProvider>
      <Text>Ready</Text>
    </SyncProvider>,
  );

  await act(async () => {
    networkListener(ONLINE);
    await Promise.resolve();
  });

  await expectQueuedOfficialRecords(database);
  native.close();
});
