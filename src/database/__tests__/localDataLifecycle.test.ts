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
import {
  clearCachedOfficeDataForOwner,
  clearLocalDataForOwner,
  getLocalDataRemovalPreview,
  purgeExpiredLocalData,
} from '@/database/localDataLifecycle';
import * as schema from '@/database/schema';
import { getFieldValidationPhotoDirectory } from '@/features/assignments/services/fieldValidationPhotoStorage';
import { getManagedScanImageDirectory } from '@/features/records/services/scanImageStorage';

const mockFsFiles = new Map<string, { size: number }>();
const mockFsDirectories = new Set<string>();

jest.mock('expo-file-system', () => {
  function joinParts(parts: unknown[]): string {
    const values = parts.map((part) =>
      typeof part === 'string' ? part : (part as { uri: string }).uri,
    );
    const [first, ...rest] = values;
    return [
      first.replace(/\/+$/, ''),
      ...rest.map((value) => value.replace(/^\/+|\/+$/g, '')),
    ]
      .filter(Boolean)
      .join('/');
  }

  class MockFile {
    readonly uri: string;

    constructor(...parts: unknown[]) {
      this.uri = joinParts(parts);
    }

    get exists() {
      return mockFsFiles.has(this.uri);
    }

    delete() {
      if (!mockFsFiles.delete(this.uri)) {
        throw new Error('File missing.');
      }
    }
  }

  class MockDirectory {
    readonly uri: string;

    constructor(...parts: unknown[]) {
      this.uri = joinParts(parts);
    }

    get exists() {
      return mockFsDirectories.has(this.uri);
    }

    create() {
      mockFsDirectories.add(this.uri);
    }

    list() {
      if (!mockFsDirectories.has(this.uri)) {
        throw new Error('Directory missing.');
      }
      const prefix = `${this.uri}/`;
      return [...mockFsFiles.keys()]
        .filter(
          (uri) =>
            uri.startsWith(prefix) && !uri.slice(prefix.length).includes('/'),
        )
        .map((uri) => new MockFile(uri));
    }
  }

  return {
    Directory: MockDirectory,
    File: MockFile,
    Paths: { document: new MockDirectory('file:///documents') },
  };
});

const OWNER_ID = 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17';
const OTHER_OWNER_ID = '51214146-7439-48e0-aef4-d0e003f194b4';
const NOW = '2026-10-01T00:00:00.000Z';
const OLD = '2026-01-01T00:00:00.000Z';
const RECENT = '2026-09-01T00:00:00.000Z';

const MIGRATIONS = [
  '0000_complex_johnny_blaze.sql',
  '0001_loving_amazoness.sql',
  '0002_talented_kat_farrell.sql',
  '0003_careful_marauders.sql',
  '0004_sour_namora.sql',
  '0005_tricky_the_santerians.sql',
  '0006_curvy_piledriver.sql',
  '0007_familiar_old_lace.sql',
  '0008_field_validation_assignments.sql',
  '0009_scope_field_validation_assignment_cache_by_owner.sql',
  '0010_numerous_princess_powerful.sql',
  '0011_tidy_meteorite.sql',
  '0012_dapper_sumo.sql',
  '0013_v1_local_scan_migration.sql',
    '0014_safe_songbird.sql',
  '0015_sour_riptide.sql',
  '0016_nervous_gateway.sql',
  '0017_silky_rick_jones.sql',
  '0018_notification_advisory_content_cache.sql',
  '0019_add_field_surveys.sql',
  '0020_nasty_captain_midlands.sql',
] as const;

function readMigration(filename: string): string {
  return readFileSync(join(process.cwd(), 'drizzle', filename), 'utf8').replaceAll(
    '--> statement-breakpoint',
    '',
  );
}

function openTestDatabase(): { database: CaneGuardDatabase; native: DatabaseSync } {
  const native = new DatabaseSync(':memory:');
  native.exec('PRAGMA foreign_keys = ON');
  for (const migration of MIGRATIONS) {
    native.exec(readMigration(migration));
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

function insertScan(
  native: DatabaseSync,
  id: string,
  ownerIdentity: string,
  syncStatus: 'local_only' | 'pending' | 'synced' | 'syncing',
  createdAt: string,
): void {
  native
    .prepare(`
      INSERT INTO scan_records (
        id, owner_identity, managed_image_uri, image_source_type,
        predicted_label, confidence, checklist_consistency, model_version,
        preprocess_ms, inference_ms, total_ms, sync_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      id,
      ownerIdentity,
      `${getManagedScanImageDirectory(ownerIdentity).uri}/${id}.jpg`,
      'camera',
      'rust',
      0.8,
      'consistent',
      'v0.1-baseline',
      5,
      8,
      13,
      syncStatus,
      createdAt,
      createdAt,
    );
}

function insertReport(
  native: DatabaseSync,
  id: string,
  scanRecordId: string,
  ownerIdentity: string,
  updatedAt: string,
): void {
  native
    .prepare(`
      INSERT INTO field_reports (
        id, scan_record_id, authoring_state, submitter_identity,
        submitter_role, observed_at, sync_status, created_at, updated_at
      ) VALUES (?, ?, 'finalized', ?, 'field_reporter', ?, 'synced', ?, ?)
    `)
    .run(id, scanRecordId, ownerIdentity, updatedAt, updatedAt, updatedAt);
}

function insertAssignment(
  native: DatabaseSync,
  id: string,
  ownerIdentity: string,
  updatedAt: string,
): void {
  native
    .prepare(`
      INSERT INTO field_validation_assignments (
        id, owner_identity, report_uuid, report_client_uuid, reference_code,
        submitter_uuid, submitter_name, assignee_uuid, assignee_name,
        submitter_is_assignee, field_validation_state, assigned_at, updated_at,
        cached_at, barangay, captured_at, submitted_at, predicted_label, confidence
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'assigned', ?, ?, ?, ?, ?, ?, 'rust', 0.8)
    `)
    .run(
      id,
      ownerIdentity,
      `${id}-report`,
      `${id}-client`,
      `REF-${id}`,
      ownerIdentity,
      'Field Reporter',
      ownerIdentity,
      'Field Reporter',
      updatedAt,
      updatedAt,
      updatedAt,
      'Wawa',
      updatedAt,
      updatedAt,
    );
}

function insertCompletion(
  native: DatabaseSync,
  id: string,
  ownerIdentity: string,
  createdAt: string,
): void {
  native
    .prepare(`
      INSERT INTO field_validation_completions (
        id, owner_identity, assignment_id, report_uuid, field_observation,
        field_finding, action_taken, visited_at, gps_outcome, gps_attempted_at,
        fresh_photo_uri, created_at, updated_at, sync_status
      ) VALUES (?, ?, ?, ?, 'observation', 'finding', 'action', ?, 'unavailable', ?, ?, ?, ?, 'synced')
    `)
    .run(
      id,
      ownerIdentity,
      `${id}-assignment`,
      `${id}-report`,
      createdAt,
      createdAt,
      `${getFieldValidationPhotoDirectory(ownerIdentity).uri}/${id}.jpg`,
      createdAt,
      createdAt,
    );
}

function insertNotification(
  native: DatabaseSync,
  id: string,
  ownerIdentity: string,
  cachedAt: string,
): void {
  native
    .prepare(`
      INSERT INTO notifications_cache (
        id, owner_identity, event_type, title, message, is_read, cached_at
      ) VALUES (?, ?, 'assignment.updated', 'Title', 'Message', 0, ?)
    `)
    .run(id, ownerIdentity, cachedAt);
}

function insertSurvey(
  native: DatabaseSync,
  clientUuid: string,
  ownerIdentity: string,
  status: 'pending' | 'synced',
  updatedAt: string,
): void {
  native.prepare(`
    INSERT INTO field_surveys (
      client_uuid, owner_identity, district_code, waypoints_json, captured_at,
      status, created_at, updated_at
    ) VALUES (?, ?, 'D-01', '[]', ?, ?, ?, ?)
  `).run(clientUuid, ownerIdentity, updatedAt, status, updatedAt, updatedAt);
}

function insertLocalDraft(
  native: DatabaseSync,
  ownerIdentity: string,
  kind: 'scan' | 'field_report' | 'field_validation',
  draftKey: string,
  updatedAt: string,
): void {
  native
    .prepare(`
      INSERT INTO local_drafts (
        owner_identity, kind, draft_key, version, payload_json, created_at, updated_at
      ) VALUES (?, ?, ?, 1, '{}', ?, ?)
    `)
    .run(ownerIdentity, kind, draftKey, updatedAt, updatedAt);
}

function countRows(
  native: DatabaseSync,
  table: string,
  ownerIdentity: string,
  ownerColumn = 'owner_identity',
): number {
  const row = native
    .prepare(`SELECT count(*) AS count FROM ${table} WHERE ${ownerColumn} = ?`)
    .get(ownerIdentity) as { count?: number } | undefined;
  return Number(row?.count ?? 0);
}

describe('local data lifecycle', () => {
  beforeEach(() => {
    mockFsFiles.clear();
    mockFsDirectories.clear();
  });

  it('purges only old synchronized data for the requested owner', async () => {
    const { database, native } = openTestDatabase();
    const oldScanId = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2';
    const recentScanId = 'c863a5af-e9ad-44fe-a0dc-73f9d3436cac';
    const pendingScanId = '51214146-7439-48e0-aef4-d0e003f194b4';
    const localScanId = '7ea3e6f0-b893-4fd3-b414-0b797e62ec8e';
    const otherScanId = 'd4f6c5e6-9c02-4d4e-8e8b-42e0c85df0fb';

    insertScan(native, oldScanId, OWNER_ID, 'synced', OLD);
    insertReport(native, `${oldScanId}-report`, oldScanId, OWNER_ID, OLD);
    insertScan(native, recentScanId, OWNER_ID, 'synced', RECENT);
    insertScan(native, pendingScanId, OWNER_ID, 'pending', OLD);
    insertScan(native, localScanId, OWNER_ID, 'local_only', OLD);
    insertScan(native, otherScanId, OTHER_OWNER_ID, 'synced', OLD);
    insertReport(native, `${otherScanId}-report`, otherScanId, OTHER_OWNER_ID, OLD);

    insertAssignment(native, '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed3', OWNER_ID, OLD);
    insertAssignment(native, 'c863a5af-e9ad-44fe-a0dc-73f9d3436ca0', OTHER_OWNER_ID, OLD);
    insertCompletion(native, '7ea3e6f0-b893-4fd3-b414-0b797e62ec81', OWNER_ID, OLD);
    insertCompletion(native, 'd4f6c5e6-9c02-4d4e-8e8b-42e0c85df0f1', OTHER_OWNER_ID, OLD);
    insertNotification(native, '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed4', OWNER_ID, OLD);
    insertNotification(native, 'c863a5af-e9ad-44fe-a0dc-73f9d3436ca1', OTHER_OWNER_ID, OLD);
    insertSurvey(native, 'survey-expired', OWNER_ID, 'synced', OLD);
    insertSurvey(native, 'survey-pending', OWNER_ID, 'pending', OLD);
    insertSurvey(native, 'survey-other', OTHER_OWNER_ID, 'synced', OLD);

    const result = await purgeExpiredLocalData(
      database,
      OWNER_ID,
      new Date(NOW),
    );

    expect(result.imageCleanupErrors).toEqual([]);
    expect(
      native
        .prepare('SELECT id FROM scan_records ORDER BY id')
        .all()
        .map((row) => row.id),
    ).toEqual([localScanId, otherScanId, pendingScanId, recentScanId].sort());
    expect(countRows(native, 'field_reports', OWNER_ID, 'submitter_identity')).toBe(0);
    expect(countRows(native, 'field_reports', OTHER_OWNER_ID, 'submitter_identity')).toBe(1);
    expect(countRows(native, 'field_validation_completions', OWNER_ID)).toBe(0);
    expect(countRows(native, 'field_validation_completions', OTHER_OWNER_ID)).toBe(1);
    expect(countRows(native, 'field_validation_assignments', OWNER_ID)).toBe(0);
    expect(countRows(native, 'field_validation_assignments', OTHER_OWNER_ID)).toBe(1);
    expect(countRows(native, 'notifications_cache', OWNER_ID)).toBe(0);
    expect(countRows(native, 'notifications_cache', OTHER_OWNER_ID)).toBe(1);
    expect(countRows(native, 'field_surveys', OWNER_ID)).toBe(1);
    expect(countRows(native, 'field_surveys', OTHER_OWNER_ID)).toBe(1);
    expect(native.prepare('SELECT client_uuid FROM field_surveys WHERE owner_identity = ?').get(OWNER_ID)).toEqual({ client_uuid: 'survey-pending' });
    expect(result.deletedRows).toBeGreaterThanOrEqual(6);
    native.close();
  });

  it('clears every local table and image reference only for the requested owner', async () => {
    const { database, native } = openTestDatabase();
    const ownerScanId = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2';
    const otherScanId = 'c863a5af-e9ad-44fe-a0dc-73f9d3436cac';

    insertScan(native, ownerScanId, OWNER_ID, 'pending', OLD);
    insertReport(native, `${ownerScanId}-report`, ownerScanId, OWNER_ID, OLD);
    insertAssignment(native, '51214146-7439-48e0-aef4-d0e003f194b4', OWNER_ID, OLD);
    insertCompletion(native, '7ea3e6f0-b893-4fd3-b414-0b797e62ec81', OWNER_ID, OLD);
    insertNotification(native, 'd4f6c5e6-9c02-4d4e-8e8b-42e0c85df0fb', OWNER_ID, OLD);

    insertScan(native, otherScanId, OTHER_OWNER_ID, 'pending', OLD);
    insertAssignment(native, '51214146-7439-48e0-aef4-d0e003f194b4', OTHER_OWNER_ID, OLD);
    insertCompletion(native, '7ea3e6f0-b893-4fd3-b414-0b797e62ec82', OTHER_OWNER_ID, OLD);
    insertNotification(native, 'd4f6c5e6-9c02-4d4e-8e8b-42e0c85df0fc', OTHER_OWNER_ID, OLD);
    insertSurvey(native, 'survey-owner', OWNER_ID, 'pending', OLD);
    insertSurvey(native, 'survey-other', OTHER_OWNER_ID, 'pending', OLD);

    const result = await clearLocalDataForOwner(database, OWNER_ID);

    expect(result.imageCleanupErrors).toEqual([]);
    expect(result.deletedRows).toBeGreaterThanOrEqual(5);
    expect(countRows(native, 'scan_records', OWNER_ID)).toBe(0);
    expect(countRows(native, 'field_reports', OWNER_ID, 'submitter_identity')).toBe(0);
    expect(countRows(native, 'field_validation_assignments', OWNER_ID)).toBe(0);
    expect(countRows(native, 'field_validation_completions', OWNER_ID)).toBe(0);
    expect(countRows(native, 'notifications_cache', OWNER_ID)).toBe(0);
    expect(countRows(native, 'scan_records', OTHER_OWNER_ID)).toBe(1);
    expect(countRows(native, 'field_validation_assignments', OTHER_OWNER_ID)).toBe(1);
    expect(countRows(native, 'field_validation_completions', OTHER_OWNER_ID)).toBe(1);
    expect(countRows(native, 'notifications_cache', OTHER_OWNER_ID)).toBe(1);
    expect(countRows(native, 'field_surveys', OWNER_ID)).toBe(0);
    expect(countRows(native, 'field_surveys', OTHER_OWNER_ID)).toBe(1);
    native.close();
  });

  it('routine cleanup removes only re-downloadable office data', async () => {
    const { database, native } = openTestDatabase();
    const scanId = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2';

    insertScan(native, scanId, OWNER_ID, 'pending', OLD);
    insertReport(native, `${scanId}-report`, scanId, OWNER_ID, OLD);
    insertAssignment(native, '51214146-7439-48e0-aef4-d0e003f194b4', OWNER_ID, OLD);
    insertCompletion(native, '7ea3e6f0-b893-4fd3-b414-0b797e62ec81', OWNER_ID, OLD);
    insertNotification(native, 'd4f6c5e6-9c02-4d4e-8e8b-42e0c85df0fb', OWNER_ID, OLD);
    insertSurvey(native, 'survey-pending', OWNER_ID, 'pending', OLD);
    insertLocalDraft(native, OWNER_ID, 'field_report', `${scanId}-report`, OLD);
    insertLocalDraft(native, OWNER_ID, 'scan', 'current', OLD);
    insertLocalDraft(native, OWNER_ID, 'field_validation', 'visit-1', OLD);
    insertAssignment(native, 'c863a5af-e9ad-44fe-a0dc-73f9d3436ca0', OTHER_OWNER_ID, OLD);
    insertNotification(native, 'c863a5af-e9ad-44fe-a0dc-73f9d3436ca1', OTHER_OWNER_ID, OLD);

    const result = await clearCachedOfficeDataForOwner(database, OWNER_ID);

    expect(result.deletedRows).toBe(2);
    // Everything unsent, drafted, or already captured stays exactly as it was.
    expect(countRows(native, 'scan_records', OWNER_ID)).toBe(1);
    expect(countRows(native, 'field_reports', OWNER_ID, 'submitter_identity')).toBe(1);
    expect(countRows(native, 'field_validation_completions', OWNER_ID)).toBe(1);
    expect(countRows(native, 'field_surveys', OWNER_ID)).toBe(1);
    expect(countRows(native, 'local_drafts', OWNER_ID)).toBe(3);
    // Only the re-downloadable caches were cleared.
    expect(countRows(native, 'field_validation_assignments', OWNER_ID)).toBe(0);
    expect(countRows(native, 'notifications_cache', OWNER_ID)).toBe(0);
    // Other owners are untouched.
    expect(countRows(native, 'field_validation_assignments', OTHER_OWNER_ID)).toBe(1);
    expect(countRows(native, 'notifications_cache', OTHER_OWNER_ID)).toBe(1);
    native.close();
  });

  it('previews every affected kind and reports an upload in flight', async () => {
    const { database, native } = openTestDatabase();
    const scanId = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2';

    insertScan(native, scanId, OWNER_ID, 'syncing', OLD);
    insertReport(native, `${scanId}-report`, scanId, OWNER_ID, OLD);
    native
      .prepare('UPDATE field_reports SET sync_status = ? WHERE id = ?')
      .run('syncing', `${scanId}-report`);
    insertCompletion(native, '7ea3e6f0-b893-4fd3-b414-0b797e62ec81', OWNER_ID, OLD);
    insertSurvey(native, 'survey-pending', OWNER_ID, 'pending', OLD);
    insertAssignment(native, '51214146-7439-48e0-aef4-d0e003f194b4', OWNER_ID, OLD);
    insertLocalDraft(native, OWNER_ID, 'scan', 'current', OLD);

    const preview = getLocalDataRemovalPreview(database, OWNER_ID);

    expect(preview).toMatchObject({
      assignments: 1,
      boundaries: 1,
      draftCheckpoints: 1,
      reports: 1,
      scans: 1,
      uploadInFlight: true,
      unsentBoundaries: 1,
      visits: 1,
    });
    expect(preview.totalUnsent).toBeGreaterThan(0);
    expect(preview.totalRecords).toBe(6);
    native.close();
  });

  it('refuses permanent removal while an upload is in flight', async () => {
    const { database, native } = openTestDatabase();
    const scanId = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2';
    insertScan(native, scanId, OWNER_ID, 'pending', OLD);
    insertReport(native, `${scanId}-report`, scanId, OWNER_ID, OLD);
    native.prepare('UPDATE field_reports SET sync_status = ? WHERE id = ?').run('syncing', `${scanId}-report`);

    await expect(clearLocalDataForOwner(database, OWNER_ID)).rejects.toThrow(
      /Wait for it to finish/,
    );
    expect(countRows(native, 'field_reports', OWNER_ID, 'submitter_identity')).toBe(1);
    native.close();
  });

  it('refuses a confirmation whose counts changed and keeps the records', async () => {
    const { database, native } = openTestDatabase();
    const scanId = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2';
    insertScan(native, scanId, OWNER_ID, 'pending', OLD);
    insertReport(native, `${scanId}-report`, scanId, OWNER_ID, OLD);

    const stalePreview = getLocalDataRemovalPreview(database, OWNER_ID);
    insertLocalDraft(native, OWNER_ID, 'field_report', `${scanId}-report`, OLD);

    await expect(
      clearLocalDataForOwner(database, OWNER_ID, {
        expectedPreview: stalePreview,
      }),
    ).rejects.toThrow(/confirm again/);
    expect(countRows(native, 'scan_records', OWNER_ID)).toBe(1);
    expect(countRows(native, 'field_reports', OWNER_ID, 'submitter_identity')).toBe(1);
    expect(countRows(native, 'local_drafts', OWNER_ID)).toBe(1);
    native.close();
  });

  it('removes draft checkpoints with the confirmed owner records', async () => {
    const { database, native } = openTestDatabase();
    insertLocalDraft(native, OWNER_ID, 'field_report', 'report-1', OLD);
    insertLocalDraft(native, OTHER_OWNER_ID, 'field_report', 'report-2', OLD);

    const preview = getLocalDataRemovalPreview(database, OWNER_ID);
    expect(preview.draftCheckpoints).toBe(1);
    await clearLocalDataForOwner(database, OWNER_ID, {
      expectedPreview: preview,
    });

    expect(countRows(native, 'local_drafts', OWNER_ID)).toBe(0);
    expect(countRows(native, 'local_drafts', OTHER_OWNER_ID)).toBe(1);
    native.close();
  });
  it('counts saved draft checkpoints and unsent scans as unsent work', async () => {
    const { database, native } = openTestDatabase();
    const scanId = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2';
    insertScan(native, scanId, OWNER_ID, 'local_only', NOW);
    insertLocalDraft(native, OWNER_ID, 'scan', 'current', NOW);

    const preview = getLocalDataRemovalPreview(database, OWNER_ID);

    expect(preview.scans).toBe(1);
    expect(preview.unsentScans).toBe(1);
    expect(preview.draftCheckpoints).toBe(1);
    expect(preview.totalUnsent).toBe(2);
    native.close();
  });

  it('counts a saved scan from its linked report status instead of the scan row', async () => {
    const { database, native } = openTestDatabase();
    const sentScanId = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2';
    const unsentScanId = '11111111-1111-4111-8111-111111111111';
    insertScan(native, sentScanId, OWNER_ID, 'local_only', NOW);
    insertReport(native, `${sentScanId}-report`, sentScanId, OWNER_ID, NOW);
    insertScan(native, unsentScanId, OWNER_ID, 'local_only', NOW);
    insertReport(native, `${unsentScanId}-report`, unsentScanId, OWNER_ID, NOW);
    native
      .prepare('UPDATE field_reports SET sync_status = ? WHERE id = ?')
      .run('failed', `${unsentScanId}-report`);

    const preview = getLocalDataRemovalPreview(database, OWNER_ID);

    expect(preview.scans).toBe(2);
    expect(preview.unsentScans).toBe(1);
    expect(preview.finalizedUnsentReports).toBe(1);
    expect(preview.totalUnsent).toBe(2);
    native.close();
  });

  it('removes leftover owner images that no record or draft names any more', async () => {
    const { database, native } = openTestDatabase();
    const scanId = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2';
    insertScan(native, scanId, OWNER_ID, 'local_only', NOW);
    const scanDirectory = getManagedScanImageDirectory(OWNER_ID);
    const photoDirectory = getFieldValidationPhotoDirectory(OWNER_ID);
    mockFsDirectories.add(scanDirectory.uri);
    mockFsDirectories.add(photoDirectory.uri);
    mockFsFiles.set(`${scanDirectory.uri}/${scanId}.jpg`, { size: 10 });
    mockFsFiles.set(`${scanDirectory.uri}/11111111-1111-4111-8111-111111111111.jpg`, { size: 10 });
    mockFsFiles.set(`${photoDirectory.uri}/abandoned-visit.jpg`, { size: 10 });

    const result = await clearLocalDataForOwner(database, OWNER_ID);

    expect(result.imageCleanupErrors).toEqual([]);
    expect(mockFsFiles.has(`${scanDirectory.uri}/${scanId}.jpg`)).toBe(false);
    expect(mockFsFiles.has(`${scanDirectory.uri}/11111111-1111-4111-8111-111111111111.jpg`)).toBe(false);
    expect(mockFsFiles.has(`${photoDirectory.uri}/abandoned-visit.jpg`)).toBe(false);
    native.close();
  });

  it('keeps images that a surviving scan record still names during retention purging', async () => {
    const { database, native } = openTestDatabase();
    const scanId = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2';
    insertScan(native, scanId, OWNER_ID, 'synced', RECENT);
    const scanDirectory = getManagedScanImageDirectory(OWNER_ID);
    const photoDirectory = getFieldValidationPhotoDirectory(OWNER_ID);
    mockFsDirectories.add(scanDirectory.uri);
    mockFsDirectories.add(photoDirectory.uri);
    mockFsFiles.set(`${scanDirectory.uri}/${scanId}.jpg`, { size: 10 });
    mockFsFiles.set(`${scanDirectory.uri}/11111111-1111-4111-8111-111111111111.jpg`, { size: 10 });

    const result = await purgeExpiredLocalData(database, OWNER_ID, new Date(NOW));

    expect(result.imageCleanupErrors).toEqual([]);
    expect(mockFsFiles.has(`${scanDirectory.uri}/${scanId}.jpg`)).toBe(true);
    expect(mockFsFiles.has(`${scanDirectory.uri}/11111111-1111-4111-8111-111111111111.jpg`)).toBe(false);
    native.close();
  });
});
