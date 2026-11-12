import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync, type SQLInputValue, type StatementSync } from 'node:sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import type { SQLiteDatabase, SQLiteStatement } from 'expo-sqlite';

import type { CaneGuardDatabase } from '@/database/database';
import * as schema from '@/database/schema';
import { MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE } from '@/features/assignments/api/__fixtures__/mobileFieldValidationAssignmentsV1';
import { listCachedFieldValidationAssignments } from '@/features/assignments/data/assignmentCacheRepository';
import { refreshFieldValidationAssignments } from '@/features/assignments/services/refreshFieldValidationAssignments';
import { ApiHttpError, apiRequest } from '@/features/shared/api/apiClient';
import { readSyncCheckpoint } from '@/features/sync/data/syncCheckpointRepository';

jest.mock('@/features/shared/api/apiClient', () => ({
  ApiHttpError: class ApiHttpError extends Error {
    readonly status: number;
    readonly body: unknown;
    constructor(status: number, message: string, options: { body?: unknown } = {}) {
      super(message);
      this.status = status;
      this.body = options.body;
    }
  },
  apiRequest: jest.fn(),
  buildApiUrl: (path: string) => `http://127.0.0.1:8000${path}`,
}));

const request = jest.mocked(apiRequest);
const BEFORE = '2026-08-13T12:05:00.000Z';
const OWNER = 'owner-1';
const BASE_ROW = MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE.data[0];

function readMigration(filename: string): string {
  return readFileSync(join(process.cwd(), 'drizzle', filename), 'utf8').replaceAll('--> statement-breakpoint', '');
}

function openTestDatabase(): CaneGuardDatabase {
  return openNativeTestDatabase().database;
}

function openNativeTestDatabase(): { database: CaneGuardDatabase; native: DatabaseSync } {
  const native = new DatabaseSync(':memory:');
  for (const migration of [
    '0000_complex_johnny_blaze.sql', '0001_loving_amazoness.sql', '0002_talented_kat_farrell.sql',
    '0003_careful_marauders.sql', '0004_sour_namora.sql', '0005_tricky_the_santerians.sql',
    '0006_curvy_piledriver.sql', '0007_familiar_old_lace.sql', '0008_field_validation_assignments.sql',
    '0009_scope_field_validation_assignment_cache_by_owner.sql', '0010_numerous_princess_powerful.sql',
    '0011_tidy_meteorite.sql', '0012_dapper_sumo.sql', '0013_v1_local_scan_migration.sql',
    '0014_safe_songbird.sql', '0015_sour_riptide.sql', '0016_nervous_gateway.sql',
    '0030_field_validation_snapshot_skipped.sql', '0031_gorgeous_ben_grimm.sql', '0032_office_case_projection.sql',
  ]) native.exec(readMigration(migration));
  const client = { prepareSync: (sql: string) => adapt(native.prepare(sql)) } as unknown as SQLiteDatabase;
  return { database: drizzle(client, { schema }) as CaneGuardDatabase, native };
}

function adapt(statement: StatementSync): SQLiteStatement {
  return {
    executeSync: (params: unknown[] = []) => {
      const result = statement.run(...(params as SQLInputValue[]));
      return { changes: Number(result.changes), lastInsertRowId: Number(result.lastInsertRowid), getAllSync: () => [], getFirstSync: () => null };
    },
    executeForRawResultSync: (params: unknown[] = []) => {
      const rows = statement.all(...(params as SQLInputValue[])) as Record<string, unknown>[];
      const columns = statement.columns();
      return { getAllSync: () => rows.map((row) => columns.map((column) => row[column.name])) };
    },
  } as unknown as SQLiteStatement;
}

function uuid(index: number): string {
  return `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`;
}

function row(index: number) {
  return { ...BASE_ROW, uuid: uuid(index), report_uuid: uuid(100_000 + index), report_client_uuid: uuid(200_000 + index), reference_code: `CG-${index}` };
}

/** Serves `delivered` rows in pages of 100 behind a server that reports `total`. */
function serve(options: { total: number; delivered: number; version: string; truncated: boolean }) {
  request.mockImplementation(async (path: string) => {
    const url = new URL(path, 'http://127.0.0.1:8000');
    const start = Number(url.searchParams.get('start') ?? 0);
    const end = Math.min(start + 100, options.delivered);
    const next = end < options.delivered
      ? `/api/v1/mobile/assignments?per_page=100&start=${end}&sync_before=${BEFORE}`
      : null;
    return {
      data: Array.from({ length: end - start }, (_, i) => row(start + i + 1)),
      links: { next },
      sync: { before: BEFORE, version: options.version, total: options.total, truncated: options.truncated, unchanged: false },
    };
  });
}

describe('assignment feed checkpoints', () => {
  beforeEach(() => request.mockReset());

  // Proves: after a capped feed, the checkpoint holds its version, total and pages; page count matches total and cap.
  it('records version, total and page count after a capped download', async () => {
    const database = openTestDatabase();
    serve({ total: 650, delivered: 300, version: 'v-capped', truncated: true });

    await refreshFieldValidationAssignments({ database, ownerIdentity: OWNER, token: 't' });

    expect(request).toHaveBeenCalledTimes(3);
    expect(String(request.mock.calls[0][0])).toContain('limit=300');
    await expect(readSyncCheckpoint(database, OWNER, 'assignments')).resolves.toMatchObject({
      version: 'v-capped', total: 650, truncated: true, pageCount: 3, syncBefore: BEFORE,
    });
    await expect(listCachedFieldValidationAssignments(database, OWNER)).resolves.toHaveLength(300);
  });

  // Proves: a repeat refresh with an unchanged version fetches zero pages and keeps what the phone already holds.
  it('fetches zero pages when the held version is unchanged', async () => {
    const database = openTestDatabase();
    serve({ total: 250, delivered: 250, version: 'v-1', truncated: false });
    await refreshFieldValidationAssignments({ database, ownerIdentity: OWNER, token: 't' });
    expect(request).toHaveBeenCalledTimes(3);

    request.mockReset().mockResolvedValue({
      data: [], links: { next: null },
      sync: { before: '2026-08-13T12:10:00.000Z', version: 'v-1', total: 250, truncated: false, unchanged: true },
    });
    const result = await refreshFieldValidationAssignments({ database, ownerIdentity: OWNER, token: 't2' });

    expect(request).toHaveBeenCalledTimes(1);
    expect(String(request.mock.calls[0][0])).toContain('since=v-1');
    expect(result.assignments).toHaveLength(250);
    await expect(readSyncCheckpoint(database, OWNER, 'assignments')).resolves.toMatchObject({
      version: 'v-1', total: 250, pageCount: 3, syncBefore: '2026-08-13T12:10:00.000Z',
    });
  });

  // Proves: an unchanged answer that omits the stamps keeps the held download's measurements instead
  // of zeroing them, so the phone still trusts the checkpoint for the rows it already holds.
  // Oracle: the capped download promised 650 rows in 3 pages, and the confirming answer repeats no total.
  it('keeps the held total, truncation and page count when the unchanged answer omits them', async () => {
    const database = openTestDatabase();
    serve({ total: 650, delivered: 300, version: 'v-capped', truncated: true });
    await refreshFieldValidationAssignments({ database, ownerIdentity: OWNER, token: 't' });

    request.mockReset().mockResolvedValue({
      data: [], links: { next: null },
      sync: { before: '2026-08-13T12:10:00.000Z', version: 'v-capped', unchanged: true },
    });
    await refreshFieldValidationAssignments({ database, ownerIdentity: OWNER, token: 't2' });

    expect(String(request.mock.calls[0][0])).toContain('since=v-capped');
    await expect(readSyncCheckpoint(database, OWNER, 'assignments')).resolves.toMatchObject({
      version: 'v-capped', total: 650, truncated: true, pageCount: 3,
      syncBefore: '2026-08-13T12:10:00.000Z',
    });

    request.mockClear();
    await refreshFieldValidationAssignments({ database, ownerIdentity: OWNER, token: 't3' });
    expect(String(request.mock.calls[0][0])).toContain('since=v-capped');
  });

  // Proves: the saved page count is the number of pages the download requested (an uncapped 250 takes
  // 3 pages, an empty feed still takes the one page that answered it).
  it.each([[0, 1], [100, 1], [101, 2], [250, 3]])('requests %i rows in %i pages', async (total, pages) => {
    const database = openTestDatabase();
    serve({ total, delivered: total, version: `v-${total}`, truncated: false });

    await refreshFieldValidationAssignments({ database, ownerIdentity: OWNER, token: 't' });

    expect(request).toHaveBeenCalledTimes(pages);
    await expect(readSyncCheckpoint(database, OWNER, 'assignments')).resolves.toMatchObject({ total, pageCount: pages });
  });

  // Proves: the phone never trusts a checkpoint for rows it no longer holds (refetches instead of reusing the version).
  it('does not send the held version when the cache no longer matches it', async () => {
    const { database, native } = openNativeTestDatabase();
    serve({ total: 5, delivered: 5, version: 'v-5', truncated: false });
    await refreshFieldValidationAssignments({ database, ownerIdentity: OWNER, token: 't' });
    native.exec('DELETE FROM field_validation_assignments');

    serve({ total: 5, delivered: 5, version: 'v-5', truncated: false });
    request.mockClear();
    await refreshFieldValidationAssignments({ database, ownerIdentity: OWNER, token: 't2' });

    expect(String(request.mock.calls[0][0])).not.toContain('since=');
  });

  // Proves: a refresh whose session ended while the download was in flight saves nothing (logout/account switch boundary).
  it('persists nothing when the session ends during the download', async () => {
    const database = openTestDatabase();
    serve({ total: 3, delivered: 3, version: 'v-3', truncated: false });
    let live = true;
    const baseline = request.getMockImplementation()!;
    request.mockImplementation(async (...args: Parameters<typeof apiRequest>) => {
      const answer = await baseline(...args);
      live = false;
      return answer;
    });

    await expect(
      refreshFieldValidationAssignments({ database, ownerIdentity: OWNER, token: 't', isSessionCurrent: () => live }),
    ).rejects.toThrow('superseded');

    await expect(listCachedFieldValidationAssignments(database, OWNER)).resolves.toHaveLength(0);
    await expect(readSyncCheckpoint(database, OWNER, 'assignments')).resolves.toBeNull();
  });

  // Proves: a download whose pages exceed what total/cap allow is rejected and leaves the old checkpoint alone.
  it('rejects a feed that runs past the derived page count', async () => {
    const database = openTestDatabase();
    serve({ total: 150, delivered: 150, version: 'v-a', truncated: false });
    await refreshFieldValidationAssignments({ database, ownerIdentity: OWNER, token: 't' });

    request.mockReset().mockImplementation(async (path: string) => ({
      data: [], links: { next: `/api/v1/mobile/assignments?per_page=100&page=${path.length}&sync_before=${BEFORE}` },
      sync: { before: BEFORE, version: 'v-b', total: 0, truncated: false, unchanged: false },
    }));
    await expect(refreshFieldValidationAssignments({ database, ownerIdentity: OWNER, token: 't2' })).rejects.toMatchObject({ code: 'MALFORMED_RESPONSE' });
    await expect(readSyncCheckpoint(database, OWNER, 'assignments')).resolves.toMatchObject({ version: 'v-a', total: 150 });
  });

  // Proves: a mid-download change (SYNC_RESTART) discards the partial pages and records only the restarted download.
  it('restarts the download once when the server reports the set changed', async () => {
    const database = openTestDatabase();
    let calls = 0;
    request.mockImplementation(async (path: string) => {
      calls += 1;
      if (calls === 1) {
        return { data: [row(1)], links: { next: `/api/v1/mobile/assignments?per_page=100&start=1&sync_before=${BEFORE}` }, sync: { before: BEFORE, version: 'v-old', total: 150, truncated: false, unchanged: false } };
      }
      if (calls === 2) throw new ApiHttpError(409, 'changed', { body: { code: 'SYNC_RESTART' } });
      expect(path).not.toContain('since=');
      return { data: [row(7), row(8)], links: { next: null }, sync: { before: BEFORE, version: 'v-new', total: 2, truncated: false, unchanged: false } };
    });

    await refreshFieldValidationAssignments({ database, ownerIdentity: OWNER, token: 't' });

    await expect(readSyncCheckpoint(database, OWNER, 'assignments')).resolves.toMatchObject({ version: 'v-new', total: 2, pageCount: 1 });
    await expect(listCachedFieldValidationAssignments(database, OWNER)).resolves.toHaveLength(2);
  });
});
