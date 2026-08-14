import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync, type SQLInputValue, type StatementSync } from 'node:sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import type { SQLiteDatabase, SQLiteStatement } from 'expo-sqlite';

import type { CaneGuardDatabase } from '@/database/database';
import * as schema from '@/database/schema';
import {
  applyAuthorityReviewUpdates,
  findLatestAuthorityReviewUpdatedAt,
  findLastAuthorityReviewFetchedAt,
  hasStaleAuthorityReviewCache,
} from '@/features/reports/data/fieldReportReviewRepository';

const OWNER = 'owner-1';
const OTHER_OWNER = 'owner-2';
const REPORT_ID = 'report-1';
const OTHER_REPORT_ID = 'report-2';
const REMOTE_ID = 'remote-1';
const OTHER_REMOTE_ID = 'remote-2';
const NEW_TIME = '2026-08-13T12:00:00.000Z';
const FETCHED_AT = '2026-08-13T12:01:00.000Z';

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
  ]) {
    native.exec(readMigration(migration));
  }

  const insertScan = native.prepare(`
    INSERT INTO scan_records (
      id, managed_image_uri, image_source_type, predicted_label, confidence,
      checklist_consistency, model_version, preprocess_ms, inference_ms,
      total_ms, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const timestamp = '2026-08-10T00:00:00.000Z';
  insertScan.run(
    'scan-1', 'file:///caneguard/scan-1.jpg', 'camera', 'rust', 0.8,
    'consistent', 'v0.1-baseline', 1, 2, 3, timestamp, timestamp,
  );
  insertScan.run(
    'scan-2', 'file:///caneguard/scan-2.jpg', 'camera', 'mosaic', 0.7,
    'consistent', 'v0.1-baseline', 1, 2, 3, timestamp, timestamp,
  );
  const insertReport = native.prepare(`
    INSERT INTO field_reports (
      id, scan_record_id, authoring_state, submitter_identity, submitter_role,
      observed_at, sync_status, remote_id, created_at, updated_at
    ) VALUES (?, ?, 'finalized', ?, 'field_reporter', ?, 'synced', ?, ?, ?)
  `);
  insertReport.run(REPORT_ID, 'scan-1', OWNER, timestamp, REMOTE_ID, timestamp, timestamp);
  insertReport.run(OTHER_REPORT_ID, 'scan-2', OTHER_OWNER, timestamp, OTHER_REMOTE_ID, timestamp, timestamp);

  const client = {
    prepareSync(sql: string) {
      return createStatementAdapter(native.prepare(sql));
    },
  } as unknown as SQLiteDatabase;

  return { database: drizzle(client, { schema }) as CaneGuardDatabase, native };
}

describe('Field Report authority review repository', () => {
  it('applies newer owned snapshots, preserves unknown values, and rejects stale updates', async () => {
    const { database, native } = openTestDatabase();

    await expect(
      applyAuthorityReviewUpdates(database, OWNER, [
        {
          clientUuid: REPORT_ID,
          feedback: 'Please inspect the affected area.',
          referenceCode: 'CG-100',
          reviewedAt: NEW_TIME,
          remoteUuid: REMOTE_ID,
          rawStatus: 'future_authority_state',
          statusUpdatedAt: NEW_TIME,
        },
      ], FETCHED_AT),
    ).resolves.toEqual({ applied: 1, eligible: 1 });

    expect(
      native.prepare(`
        SELECT authority_status_raw, authority_feedback, authority_updated_at,
               authority_fetched_at
        FROM field_reports WHERE id = ?
      `).get(REPORT_ID),
    ).toEqual({
      authority_status_raw: 'future_authority_state',
      authority_feedback: 'Please inspect the affected area.',
      authority_updated_at: NEW_TIME,
      authority_fetched_at: FETCHED_AT,
    });

    await expect(
      applyAuthorityReviewUpdates(database, OWNER, [
        {
          clientUuid: REPORT_ID,
          feedback: 'Older note',
          referenceCode: 'CG-OLD',
          reviewedAt: '2026-08-13T11:00:00.000Z',
          remoteUuid: REMOTE_ID,
          rawStatus: 'unable_to_verify',
          statusUpdatedAt: '2026-08-13T11:00:00.000Z',
        },
      ], '2026-08-13T12:02:00.000Z'),
    ).resolves.toEqual({ applied: 0, eligible: 1 });
    expect(
      native.prepare('SELECT authority_status_raw, authority_feedback FROM field_reports WHERE id = ?').get(REPORT_ID),
    ).toEqual({
      authority_status_raw: 'future_authority_state',
      authority_feedback: 'Please inspect the affected area.',
    });
    native.close();
  });

  it('guards owner, client UUID, and remote UUID boundaries', async () => {
    const { database, native } = openTestDatabase();
    const update = (clientUuid: string, remoteUuid: string) => ({
      clientUuid,
      feedback: null,
      referenceCode: null,
      reviewedAt: null,
      remoteUuid,
      rawStatus: 'verified_by_staff',
      statusUpdatedAt: NEW_TIME,
    });

    await expect(
      applyAuthorityReviewUpdates(database, OWNER, [
        update(REPORT_ID, 'wrong-remote'),
        update('server-only-report', 'server-only-remote'),
      ], FETCHED_AT),
    ).resolves.toEqual({ applied: 0, eligible: 1 });
    await expect(
      applyAuthorityReviewUpdates(database, OTHER_OWNER, [
        update(REPORT_ID, REMOTE_ID),
      ], FETCHED_AT),
    ).resolves.toEqual({ applied: 0, eligible: 1 });

    expect(
      native.prepare('SELECT authority_status_raw FROM field_reports WHERE id = ?').get(REPORT_ID),
    ).toEqual({ authority_status_raw: null });
    expect(
      native.prepare('SELECT authority_status_raw FROM field_reports WHERE id = ?').get(OTHER_REPORT_ID),
    ).toEqual({ authority_status_raw: null });
    native.close();
  });

  it('keeps a complete cache unchanged when the batch is invalid', async () => {
    const { database, native } = openTestDatabase();
    const valid = {
      clientUuid: REPORT_ID,
      feedback: 'Keep this only if the whole page is valid.',
      referenceCode: 'CG-100',
      reviewedAt: NEW_TIME,
      remoteUuid: REMOTE_ID,
      rawStatus: 'verified_by_staff',
      statusUpdatedAt: NEW_TIME,
    };

    await expect(
      applyAuthorityReviewUpdates(database, OWNER, [
        valid,
        { ...valid, clientUuid: 'duplicate-client', remoteUuid: REMOTE_ID },
      ], FETCHED_AT),
    ).rejects.toMatchObject({ code: 'UPDATE_FAILED' });
    expect(
      native.prepare('SELECT authority_status_raw, authority_feedback FROM field_reports WHERE id = ?').get(REPORT_ID),
    ).toEqual({ authority_status_raw: null, authority_feedback: null });
    native.close();
  });

  it('records the last successful refresh per owner for stale checks', async () => {
    const { database, native } = openTestDatabase();
    await expect(findLastAuthorityReviewFetchedAt(database, OWNER)).resolves.toBeNull();
    await applyAuthorityReviewUpdates(database, OWNER, [], FETCHED_AT);
    await expect(findLastAuthorityReviewFetchedAt(database, OWNER)).resolves.toBe(FETCHED_AT);
    await expect(
      hasStaleAuthorityReviewCache(database, OWNER, '2026-08-13T12:00:00.000Z'),
    ).resolves.toBe(false);
    await expect(findLatestAuthorityReviewUpdatedAt(database, OWNER)).resolves.toBeNull();
    await applyAuthorityReviewUpdates(database, OWNER, [{
      clientUuid: REPORT_ID,
      feedback: null,
      referenceCode: null,
      reviewedAt: null,
      remoteUuid: REMOTE_ID,
      rawStatus: 'submitted_unverified',
      statusUpdatedAt: NEW_TIME,
    }], '2026-08-13T12:02:00.000Z');
    await expect(findLatestAuthorityReviewUpdatedAt(database, OWNER)).resolves.toBe(NEW_TIME);
    await expect(findLastAuthorityReviewFetchedAt(database, OTHER_OWNER)).resolves.toBeNull();
    native.close();
  });
});
