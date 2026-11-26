import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync, type SQLInputValue, type StatementSync } from 'node:sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import type { SQLiteDatabase, SQLiteStatement } from 'expo-sqlite';

import type { CaneGuardDatabase } from '@/database/database';
import * as schema from '@/database/schema';
import { uploadMobileAerialAnalysis } from '@/features/assignments/api/mobileAerialUploadApi';
import {
  enqueueAerialAnalysis,
  findAerialAnalysisById,
} from '@/features/assignments/data/aerialAnalysisOutboxRepository';
import {
  findCachedFieldValidationAssignment,
  replaceCachedFieldValidationAssignments,
} from '@/features/assignments/data/assignmentCacheRepository';
import { syncPendingAerialAnalyses } from '@/features/assignments/services/syncPendingAerialAnalyses';
import { ApiHttpError } from '@/features/shared/api/apiClient';

jest.mock('expo-file-system', () => {
  class MockFile {
    readonly uri: string;
    constructor(uri: string) {
      this.uri = uri;
    }
    get exists() {
      return true;
    }
  }
  return { File: MockFile };
});

jest.mock('@/features/assignments/api/mobileAerialUploadApi', () => ({
  mapAerialUploadToMultipart: jest.fn(() => new FormData()),
  uploadMobileAerialAnalysis: jest.fn(),
}));

const OWNER = 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17';
const ASSIGNMENT_ID = '01a04de2-280e-7140-bf56-3c98f98259d5';
const REPORT_UUID = '01a04ddc-9d08-70f7-9b43-ca247cea1a60';
const UPLOAD_ID = '11111111-1111-4111-8111-111111111111';

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
      const rows = statement.all(...(params as SQLInputValue[])) as Record<string, unknown>[];
      const columns = statement.columns();
      return {
        getAllSync: () => rows.map((row) => columns.map((column) => row[column.name])),
      };
    },
  } as unknown as SQLiteStatement;
}

function openTestDatabase(): { database: CaneGuardDatabase; native: DatabaseSync } {
  const native = new DatabaseSync(':memory:');
  native.exec('PRAGMA foreign_keys = ON');
  for (const filename of readdirSync(join(process.cwd(), 'drizzle'))
    .filter((name) => name.endsWith('.sql'))
    .sort()) {
    const sql = readFileSync(join(process.cwd(), 'drizzle', filename), 'utf8').replaceAll(
      '--> statement-breakpoint',
      '',
    );
    native.exec(sql);
  }

  const client = {
    prepareSync: (sql: string) => createStatementAdapter(native.prepare(sql)),
  } as unknown as SQLiteDatabase;

  return {
    database: drizzle(client, { schema }) as CaneGuardDatabase,
    native,
  };
}

async function seedAssignment(database: CaneGuardDatabase) {
  await replaceCachedFieldValidationAssignments(
    database,
    OWNER,
    [
      {
        id: ASSIGNMENT_ID,
        reportUuid: REPORT_UUID,
        reportClientUuid: '33333333-3333-4333-8333-333333333333',
        referenceCode: 'CG-2026-0099',
        submitter: { uuid: OWNER, name: 'Ana' },
        assignee: { uuid: OWNER, name: 'Ana' },
        submitterIsAssignee: true,
        targetVisitDate: null,
        fieldValidationState: 'assigned',
        assignedAt: '2026-11-26T00:00:00.000Z',
        updatedAt: '2026-11-26T00:00:00.000Z',
        case: {
          barangay: 'Mabini',
          province: 'Batangas',
          municipality: 'Nasugbu',
          farmerOrFarmOwnerName: null,
          affectedAreaHectares: 2.5,
          affectedPortionPercent: 35,
          capturedAt: '2026-11-26T00:00:00.000Z',
          observedAt: null,
          submittedAt: '2026-11-26T00:00:00.000Z',
          predictedLabel: 'rust',
          confidence: 0.9,
        },
        previousVisit: null,
        officeCase: null,
        aerialCheck: null,
      },
    ],
    '2026-11-26T00:00:00.000Z',
    undefined,
    0,
    {
      feed: 'assignments',
      version: 'v1',
      total: 1,
      truncated: false,
      pageCount: 1,
      syncBefore: '2026-11-26T00:00:00.000Z',
      fetchedAt: '2026-11-26T00:00:00.000Z',
    },
  );
}

describe('syncPendingAerialAnalyses', () => {
  let database: CaneGuardDatabase;
  let native: DatabaseSync;

  beforeEach(async () => {
    jest.clearAllMocks();
    const opened = openTestDatabase();
    database = opened.database;
    native = opened.native;
    await seedAssignment(database);
  });

  afterEach(() => {
    native.close();
  });

  it('uploads pending drone photo and refreshes assignment aerialCheck without changing ground metrics', async () => {
    await enqueueAerialAnalysis(database, {
      id: UPLOAD_ID,
      ownerIdentity: OWNER,
      assignmentId: ASSIGNMENT_ID,
      reportUuid: REPORT_UUID,
      imageUri: `file:///documents/caneguard/aerial-uploads/${OWNER}/shot.jpg`,
      imageMimeType: 'image/jpeg',
      imageSizeBytes: 600_000,
      createdAt: '2026-11-26T01:00:00.000Z',
    });

    const newBrief = {
      uuid: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      enoughCanopy: true,
      abnormalCanopyPercent: 24.5,
      canopyCoveragePercent: 81.0,
      modelVersion: 'aerial-v3',
      createdAt: '2026-11-26T06:00:00.000Z',
      preview: { contentType: 'image/jpeg', bytes: 100_000 },
      overlay: { contentType: 'image/jpeg', bytes: 110_000 },
    };

    jest.mocked(uploadMobileAerialAnalysis).mockResolvedValueOnce({
      remoteId: newBrief.uuid,
      aerialCheck: newBrief,
      hasAerialCheck: true,
    });

    const batch = await syncPendingAerialAnalyses({
      database,
      ownerIdentity: OWNER,
      source: 'after-save',
      token: 'tok-1',
    });

    expect(batch.synced).toBe(1);
    expect(batch.failed).toBe(0);

    const row = await findAerialAnalysisById(database, UPLOAD_ID, OWNER);
    expect(row.syncStatus).toBe('synced');
    expect(row.remoteId).toBe(newBrief.uuid);

    const cached = await findCachedFieldValidationAssignment(database, OWNER, ASSIGNMENT_ID);
    expect(cached?.aerialCheck).toEqual(newBrief);
    expect(cached?.case.affectedAreaHectares).toBe(2.5);
    expect(cached?.case.affectedPortionPercent).toBe(35);
  });

  it('marks AERIAL_DISABLED failure cleanly without auto-retrying later batches', async () => {
    await enqueueAerialAnalysis(database, {
      id: UPLOAD_ID,
      ownerIdentity: OWNER,
      assignmentId: ASSIGNMENT_ID,
      reportUuid: REPORT_UUID,
      imageUri: `file:///documents/caneguard/aerial-uploads/${OWNER}/shot.jpg`,
      imageMimeType: 'image/jpeg',
      imageSizeBytes: 600_000,
      createdAt: '2026-11-26T01:00:00.000Z',
    });

    jest.mocked(uploadMobileAerialAnalysis).mockRejectedValue(
      new ApiHttpError(409, 'Aerial disabled', { body: { code: 'AERIAL_DISABLED' } }),
    );

    const first = await syncPendingAerialAnalyses({
      database,
      ownerIdentity: OWNER,
      source: 'manual',
      token: 'tok-1',
    });
    expect(first.failed).toBe(1);
    expect(first.haltReason).toBe('empty');

    const failedRow = await findAerialAnalysisById(database, UPLOAD_ID, OWNER);
    expect(failedRow.syncStatus).toBe('failed');
    expect(failedRow.lastSyncErrorCode).toBe('AERIAL_DISABLED');

    jest.clearAllMocks();
    const second = await syncPendingAerialAnalyses({
      database,
      ownerIdentity: OWNER,
      source: 'startup',
      token: 'tok-1',
    });
    expect(second.attempted).toBe(0);
    expect(uploadMobileAerialAnalysis).not.toHaveBeenCalled();
  });
});
