import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync, type SQLInputValue, type StatementSync } from 'node:sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import type { SQLiteDatabase, SQLiteStatement } from 'expo-sqlite';

import migrationBundle from '../../../../drizzle/migrations';
import type { CaneGuardDatabase } from '@/database/database';
import * as schema from '@/database/schema';
import { FIELD_VALIDATION_ASSIGNMENT_STATES } from '@/database/schema';
import {
  listCachedFieldValidationAssignments,
  markCachedFieldValidationAssignmentInProgress,
  replaceCachedFieldValidationAssignments,
} from '@/features/assignments/data/assignmentCacheRepository';
import {
  createFieldValidationCompletionSyncRepository,
  findFieldValidationCompletion,
  saveFieldValidationCompletion,
} from '@/features/assignments/data/fieldValidationCompletionRepository';
import { MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE } from '@/features/assignments/api/__fixtures__/mobileFieldValidationAssignmentsV1';
import { fetchAllMobileFieldValidationAssignments } from '@/features/assignments/api/mobileFieldValidationAssignmentsApi';
import {
  syncFieldValidationCompletion,
} from '@/features/assignments/services/syncFieldValidationCompletion';
import type { SaveFieldValidationCompletionInput } from '@/features/assignments/domain/fieldValidationCompletionTypes';
import { SyncError } from '@/features/sync/errors/syncErrors';
import { MOBILE_NOTIFICATIONS_V1_FIXTURE } from '@/features/notifications/api/__fixtures__/mobileNotificationsV1';
import { refreshMobileNotifications } from '@/features/notifications/services/refreshMobileNotifications';
import { listCachedMobileNotifications } from '@/features/notifications/data/notificationCacheRepository';
import { apiRequest } from '@/features/shared/api/apiClient';

jest.mock('@/features/shared/api/apiClient', () => ({
  apiRequest: jest.fn(),
}));

const request = jest.mocked(apiRequest);
const OWNER = MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE.data[0].assignee.uuid;
const OTHER_OWNER = 'b4e2f8c6-70da-4a13-9f27-6c9c6ee7c6d4';
const ASSIGNMENT = MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE.data[0];
const COMPLETION_ID = '9cc6a6a0-b20f-4ca8-bb7e-1a34cd191e0f';

function openDatabase(): {
  database: CaneGuardDatabase;
  native: DatabaseSync;
  databasePath: string;
  directory: string;
} {
  const directory = mkdtempSync(join(tmpdir(), 'caneguard-phase1-'));
  const databasePath = join(directory, 'mobile.sqlite');
  const native = new DatabaseSync(databasePath);
  native.exec('PRAGMA foreign_keys = ON');
  for (const entry of migrationBundle.journal.entries) {
    const key = `m${String(entry.idx).padStart(4, '0')}`;
    const migration = migrationBundle.migrations[key];
    if (!migration) throw new Error(`Missing bundled migration ${key}.`);
    native.exec(migration.replaceAll('--> statement-breakpoint', ''));
  }

  const client = {
    prepareSync(sql: string) {
      return createStatementAdapter(native.prepare(sql));
    },
  } as unknown as SQLiteDatabase;

  return {
    database: drizzle(client, { schema }) as CaneGuardDatabase,
    native,
    databasePath,
    directory,
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
      const rows = statement.all(...(params as SQLInputValue[])) as Record<string, unknown>[];
      const columns = statement.columns();
      return { getAllSync: () => rows.map((row) => columns.map((column) => row[column.name])) };
    },
  } as unknown as SQLiteStatement;
}

function completionInput(): SaveFieldValidationCompletionInput {
  return {
    id: COMPLETION_ID,
    ownerIdentity: OWNER,
    assignmentId: ASSIGNMENT.uuid,
    reportUuid: ASSIGNMENT.report_uuid,
    fieldObservation: 'Fresh leaves show rust-like lesions during the visit.',
    fieldFinding: 'The field evidence is preserved separately for office review.',
    actionTaken: 'Provided field guidance and recorded the next action.',
    followUpOutcome: 'unchanged',
    visitedAt: '2026-09-02T04:05:06.123Z',
    gpsOutcome: 'unavailable',
    gpsAttemptedAt: '2026-09-02T04:05:01.123Z',
    gpsLatitude: null,
    gpsLongitude: null,
    gpsAccuracy: null,
    freshPhotoUri: null,
    freshPhotoMimeType: null,
    freshPhotoSizeBytes: null,
  };
}

describe('Phase 1 lifecycle automated seam acceptance', () => {
  beforeEach(() => {
    request.mockReset();
  });

  /**
   * This test is automated seam evidence only. The assignment API response and
   * completion upload are simulated, and the SQLite restart is represented by
   * closing and reopening a file-backed temporary database. It is not device,
   * network, backend, or Agent Device evidence.
   */
  it('preserves owner-scoped work through offline completion, restart, retry, and attention refresh', async () => {
    const first = openDatabase();
    const { database, native } = first;

    request.mockResolvedValueOnce(MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE);
    const assignmentFeed = await fetchAllMobileFieldValidationAssignments({ token: 'simulated-token' });
    await replaceCachedFieldValidationAssignments(
      database,
      OWNER,
      assignmentFeed.assignments,
      '2026-09-02T04:00:00.000Z',
    );
    await markCachedFieldValidationAssignmentInProgress(
      database,
      OWNER,
      ASSIGNMENT.uuid,
      '2026-09-02T04:01:00.000Z',
    );

    expect(assignmentFeed.assignments).toHaveLength(1);
    expect(await listCachedFieldValidationAssignments(database, OTHER_OWNER)).toEqual([]);
    expect((await listCachedFieldValidationAssignments(database, OWNER))[0]).toMatchObject({
      id: ASSIGNMENT.uuid,
      reportUuid: ASSIGNMENT.report_uuid,
      fieldValidationState: 'in_progress',
    });

    await expect(saveFieldValidationCompletion(database, completionInput())).resolves.toMatchObject({
      id: COMPLETION_ID,
      syncStatus: 'pending',
      fieldObservation: 'Fresh leaves show rust-like lesions during the visit.',
      gpsOutcome: 'unavailable',
    });

    native.close();
    const restartedNative = new DatabaseSync(first.databasePath);
    restartedNative.exec('PRAGMA foreign_keys = ON');
    const restartedDatabase = drizzle(
      {
        prepareSync(sql: string) {
          return createStatementAdapter(restartedNative.prepare(sql));
        },
      } as unknown as SQLiteDatabase,
      { schema },
    ) as CaneGuardDatabase;
    await expect(findFieldValidationCompletion(restartedDatabase, OWNER, ASSIGNMENT.uuid)).resolves.toMatchObject({
      id: COMPLETION_ID,
      syncStatus: 'pending',
      fieldFinding: 'The field evidence is preserved separately for office review.',
    });

    const firstSync = await syncFieldValidationCompletion({
      allowImmediateRetries: false,
      completionId: COMPLETION_ID,
      mapMultipart: () => ({}) as FormData,
      repository: createFieldValidationCompletionSyncRepository(restartedDatabase, OWNER),
      token: 'simulated-token',
      upload: async () => {
        throw new SyncError('NETWORK_REQUEST_FAILED', 'Simulated offline connection.');
      },
    });
    expect(firstSync).toMatchObject({ reportId: COMPLETION_ID, status: 'failed' });

    await expect(findFieldValidationCompletion(restartedDatabase, OWNER, ASSIGNMENT.uuid)).resolves.toMatchObject({
      id: COMPLETION_ID,
      syncStatus: 'failed',
      lastSyncErrorCode: 'NETWORK_REQUEST_FAILED',
      fieldObservation: 'Fresh leaves show rust-like lesions during the visit.',
    });

    const secondSync = await syncFieldValidationCompletion({
      allowImmediateRetries: false,
      completionId: COMPLETION_ID,
      mapMultipart: () => ({}) as FormData,
      repository: createFieldValidationCompletionSyncRepository(restartedDatabase, OWNER),
      token: 'simulated-token',
      upload: async (record) => {
        expect(record.completion.id).toBe(COMPLETION_ID);
        return { remoteId: 'server-completion-uuid' };
      },
    });
    expect(secondSync).toEqual({
      reportId: COMPLETION_ID,
      remoteId: 'server-completion-uuid',
      status: 'synced',
    });
    await expect(findFieldValidationCompletion(restartedDatabase, OWNER, ASSIGNMENT.uuid)).resolves.toMatchObject({
      id: COMPLETION_ID,
      syncStatus: 'synced',
      remoteId: 'server-completion-uuid',
    });
    expect((await listCachedFieldValidationAssignments(restartedDatabase, OWNER))[0]).toMatchObject({
      fieldValidationState: 'completed',
    });

    request.mockResolvedValueOnce(MOBILE_NOTIFICATIONS_V1_FIXTURE);
    const notificationRefresh = await refreshMobileNotifications({
      database: restartedDatabase,
      ownerIdentity: OWNER,
      token: 'simulated-token',
    });
    expect(notificationRefresh.notifications).toHaveLength(1);
    expect(notificationRefresh.notifications[0]).toMatchObject({
      eventType: 'field_validation_assigned',
      assignmentUuid: ASSIGNMENT.uuid,
    });

    await expect(listCachedMobileNotifications(restartedDatabase, OWNER)).resolves.toMatchObject([
      expect.objectContaining({
        eventType: 'field_validation_assigned',
        ownerIdentity: OWNER,
      }),
    ]);
    await expect(listCachedMobileNotifications(restartedDatabase, OTHER_OWNER)).resolves.toEqual([]);

    const lifecycle = JSON.parse(
      readFileSync(join(process.cwd(), 'references/report-lifecycle-v1.json'), 'utf8'),
    ) as {
      dimensions: Record<string, { values: string[] }>;
      rules: Record<string, unknown>;
    };
    expect(FIELD_VALIDATION_ASSIGNMENT_STATES).toEqual(
      lifecycle.dimensions.field_validation_state.values,
    );
    expect(lifecycle.rules.field_validation_completion_does_not_verify_or_close).toBe(true);
    expect(lifecycle.rules.ai_evidence_role).toBe('decision_support_only');

    restartedNative.close();
    rmSync(first.directory, { recursive: true, force: true });
  });
});
