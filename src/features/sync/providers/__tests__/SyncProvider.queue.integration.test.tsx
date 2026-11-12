import { readFileSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue, type StatementSync } from 'node:sqlite';

import NetInfo from '@react-native-community/netinfo';
import { act, render, waitFor } from '@testing-library/react-native';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import type { SQLiteDatabase, SQLiteStatement } from 'expo-sqlite';
import { AppState, Text } from 'react-native';

import { useCaneGuardDatabase } from '@/database/DatabaseProvider';
import type { CaneGuardDatabase } from '@/database/database';
import * as schema from '@/database/schema';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { createOrGetFieldReportDraft, finalizeFieldReport, saveFieldReportDraft, setLocationUnavailable } from '@/features/reports/data/fieldReportRepository';
import { findFieldReportById } from '@/features/reports/data/fieldReportRepository';
import { markFieldSurveyPending, updateFieldSurveySyncResult } from '@/features/surveys/data/fieldSurveyRepository';
import { findOwnedFieldSurvey, saveFieldSurveyDraft } from '@/features/surveys/data/fieldSurveyRepository';
import { ringArea, type SurveyPolygon, type SurveyWaypoint } from '@/features/surveys/domain/fieldSurvey';
import { SyncProvider } from '@/features/sync/providers/SyncProvider';
import { apiRequest } from '@/features/shared/api/apiClient';

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn(), fetch: jest.fn() },
}));
jest.mock('@/database/DatabaseProvider', () => ({ useCaneGuardDatabase: jest.fn() }));
jest.mock('@/database/localDataLifecycle', () => ({ purgeExpiredLocalData: jest.fn(async () => undefined) }));
jest.mock('@/features/auth/hooks/useAuth', () => ({ useAuth: jest.fn() }));
jest.mock('@/features/shared/api/apiClient', () => ({ apiRequest: jest.fn() }));

const ownerId = 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17';
const reportId = '7ea3e6f0-b893-4fd3-b414-0b797e62ec8e';
const surveyId = '6aa3e3f0-b893-4fd3-b414-0b797e62ec8e';
const scanId = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2';
const online = { isConnected: true, isInternetReachable: true, type: 'wifi' } as never;
const unavailablePolygon: SurveyPolygon = {
  type: 'Polygon',
  coordinates: [[[120, 14], [120.001, 14], [120.001, 14.001], [120, 14.001], [120, 14]]],
};
const waypoints: SurveyWaypoint[] = [
  { latitude: 14, longitude: 120, source: 'map', accuracyMeters: null, capturedAt: '2026-07-25T05:30:00.000Z' },
  { latitude: 14, longitude: 120.001, source: 'map', accuracyMeters: null, capturedAt: '2026-07-25T05:31:00.000Z' },
  { latitude: 14.001, longitude: 120.001, source: 'map', accuracyMeters: null, capturedAt: '2026-07-25T05:32:00.000Z' },
  { latitude: 14.001, longitude: 120, source: 'map', accuracyMeters: null, capturedAt: '2026-07-25T05:33:00.000Z' },
];
const imageReady = {
  imageExists: () => true,
  prepareSubmissionImage: async (input: { sourceUri: string }) => ({
    artifact: { mimeType: 'image/jpeg' as const, sizeBytes: 4096, uri: input.sourceUri },
    created: false,
    requiresPersistence: true,
  }),
};

function migration(name: string) {
  return readFileSync(`drizzle/${name}`, 'utf8').replaceAll('--> statement-breakpoint', '');
}
function statementAdapter(statement: StatementSync): SQLiteStatement {
  return {
    executeSync(params: unknown[] = []) {
      const result = statement.run(...(params as SQLInputValue[]));
      return { changes: Number(result.changes), lastInsertRowId: Number(result.lastInsertRowid), getAllSync: () => [], getFirstSync: () => null } as never;
    },
    executeForRawResultSync(params: unknown[] = []) {
      const rows = statement.all(...(params as SQLInputValue[])) as Record<string, unknown>[];
      const columns = statement.columns();
      return { getAllSync: () => rows.map((row) => columns.map((column) => row[column.name])) } as never;
    },
  } as unknown as SQLiteStatement;
}
function openDatabase() {
  const native = new DatabaseSync(':memory:');
  native.exec('PRAGMA foreign_keys = ON');
  for (const name of [
    '0000_complex_johnny_blaze.sql', '0001_loving_amazoness.sql', '0002_talented_kat_farrell.sql',
    '0003_careful_marauders.sql', '0004_sour_namora.sql', '0005_tricky_the_santerians.sql',
    '0006_curvy_piledriver.sql', '0007_familiar_old_lace.sql', '0008_field_validation_assignments.sql',
    '0009_scope_field_validation_assignment_cache_by_owner.sql', '0010_numerous_princess_powerful.sql',
    '0011_tidy_meteorite.sql', '0012_dapper_sumo.sql', '0013_v1_local_scan_migration.sql',
    '0014_safe_songbird.sql', '0019_add_field_surveys.sql',
    '0021_field_survey_affected_areas.sql', '0022_peaceful_titania.sql', '0023_affected_area_waypoints.sql',
    '0024_active_affected_waypoints.sql', '0025_field_survey_author_role.sql', '0028_field_report_survey_link.sql',
    '0029_scan_personal_place.sql',
  ]) native.exec(migration(name));
  native.prepare(`INSERT INTO scan_records (
    id, owner_identity, managed_image_uri, image_source_type, predicted_label, confidence,
    checklist_consistency, model_version, preprocess_ms, inference_ms, total_ms, source_width,
    source_height, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    scanId, ownerId, `file:///caneguard/scan-images/${scanId}.jpg`, 'camera', 'rust', 0.8,
    'consistent', 'v1.0-mobilenetv2', 5, 8, 13, 1200, 900, '2026-07-25T05:30:00.000Z', '2026-07-25T05:30:00.000Z',
  );
  const sqlite = { prepareSync: (sql: string) => statementAdapter(native.prepare(sql)) } as unknown as SQLiteDatabase;
  native.prepare('INSERT INTO scan_class_scores (scan_record_id, label, score) VALUES (?, ?, ?)').run(scanId, 'healthy', 0.1);
  for (const label of ['mosaic', 'rust', 'smut']) native.prepare('INSERT INTO scan_class_scores (scan_record_id, label, score) VALUES (?, ?, ?)').run(scanId, label, label === 'rust' ? 0.8 : 0.05);
  return { database: drizzle(sqlite, { schema }) as CaneGuardDatabase, native };
}

async function seedHeldQueues(database: CaneGuardDatabase, native: DatabaseSync, boundaryCooling = true) {
  const draft = await saveFieldSurveyDraft(database, {
    authorRole: 'field_reporter', capturedAt: '2026-07-25T05:30:00.000Z', clientUuid: surveyId,
    districtCode: 'D-01', ownerIdentity: ownerId, waypoints,
  });
  markFieldSurveyPending(database, surveyId, ownerId, 'D-01', unavailablePolygon, ringArea(unavailablePolygon.coordinates[0]), '2026-07-25T05:30:00.000Z');
  await createOrGetFieldReportDraft(database, {
    id: reportId, scanRecordId: scanId, createdAt: '2026-08-10T01:00:00.000Z', submitterIdentity: ownerId, submitterRole: 'field_reporter',
  });
  await saveFieldReportDraft(database, reportId, ownerId, {
    affectedAreaHectares: null, affectedAreaMeasurement: 'not_measured', affectedPortionPercent: null,
    affectedPortionMeasurement: 'not_measured', barangay: 'Wawa', farmerOrFarmOwnerName: 'Maria Santos',
    fieldSurveyClientUuid: surveyId, updatedAt: '2026-08-10T01:05:00.000Z',
  });
  await setLocationUnavailable(database, reportId, ownerId, { reason: 'low_accuracy', updatedAt: '2026-08-10T01:06:00.000Z' });
  const result = await finalizeFieldReport(database, reportId, ownerId, {
    affectedAreaHectares: null, affectedAreaMeasurement: 'not_measured', affectedPortionPercent: null,
    affectedPortionMeasurement: 'not_measured', barangay: 'Wawa', districtCode: 'D-01',
    farmerOrFarmOwnerName: 'Maria Santos', submittedAt: '2026-08-10T02:00:00.000Z', updatedAt: '2026-08-10T02:00:00.000Z',
  }, imageReady);
  expect(result.status).toBe('finalized');
  updateFieldSurveySyncResult(database, surveyId, ownerId, { status: 'failed', lastSyncErrorCode: 'NETWORK_UNAVAILABLE' });
  if (!boundaryCooling) {
    native.prepare('UPDATE field_surveys SET updated_at = ? WHERE client_uuid = ? AND owner_identity = ?')
      .run(new Date(Date.now() - 120_000).toISOString(), surveyId, ownerId);
  }
  return { draft, report: reportId, survey: surveyId };
}

function authState(verification: string, retrySessionVerification?: () => Promise<string>) {
  return {
    status: 'authenticated', session: { token: 'secure-token', user: { uuid: ownerId, role: 'field_reporter', districtCode: 'D-01' } },
    sessionVerification: verification, retrySessionVerification, markSessionExpired: jest.fn(async () => undefined),
  } as never;
}

function mockNetworkListener() {
  let listener: ((state: never) => void) | undefined;
  jest.mocked(NetInfo.addEventListener).mockImplementation((callback) => { listener = callback; return jest.fn(); });
  jest.mocked(NetInfo.fetch).mockResolvedValue(online);
  return async () => {
    await waitFor(() => expect(listener).toBeDefined());
    await act(async () => { listener?.(online); await Promise.resolve(); });
  };
}

describe('SyncProvider held-queue integration', () => {
  beforeEach(() => {
    Object.defineProperty(AppState, 'currentState', { configurable: true, value: 'active' });
    jest.mocked(apiRequest).mockImplementation(async (path) => path === '/api/v3/mobile/reports'
      ? { identity: { uuid: 'report-remote' } } as never
      : { id: 'survey-remote', status: 'kept' } as never);
  });

  it('immediately uploads a non-cooling queue when verification completes', async () => {
    jest.useFakeTimers();
    try {
      const { database, native } = openDatabase();
      jest.mocked(useCaneGuardDatabase).mockReturnValue(database);
      await seedHeldQueues(database, native, false);
      jest.mocked(useAuth).mockReturnValue(authState('pending'));
      const triggerOnline = mockNetworkListener();
      const view = await render(<SyncProvider><Text>ready</Text></SyncProvider>);
      await act(async () => { jest.runOnlyPendingTimers(); await Promise.resolve(); });
      await triggerOnline();
      await waitFor(() => expect(findOwnedFieldSurvey(database, surveyId, ownerId)?.status).toBe('failed'));
      jest.mocked(useAuth).mockReturnValue(authState('verified'));
      await view.rerender(<SyncProvider><Text>ready</Text></SyncProvider>);
      await waitFor(() => expect(jest.mocked(apiRequest)).toHaveBeenCalled());
      await waitFor(async () => expect((await findFieldReportById(database, reportId, ownerId))?.syncStatus).toBe('synced'));
      expect(jest.mocked(apiRequest)).toHaveBeenCalledTimes(2);
      expect(jest.mocked(apiRequest).mock.calls.map(([path]) => path).sort()).toEqual([
        '/api/v1/mobile/field-surveys', '/api/v3/mobile/reports',
      ]);
      expect(findOwnedFieldSurvey(database, surveyId, ownerId)).toMatchObject({ status: 'synced', remoteId: 'survey-remote' });
      native.close();
    } finally {
      jest.useRealTimers();
    }
  });

  it('keeps a cooling boundary held until the retry timer reaches cooldown', async () => {
    jest.useFakeTimers();
    try {
      const { database, native } = openDatabase();
      jest.mocked(useCaneGuardDatabase).mockReturnValue(database);
      await seedHeldQueues(database, native, true);
      jest.mocked(useAuth).mockReturnValue(authState('pending'));
      const triggerOnline = mockNetworkListener();
      const view = await render(<SyncProvider><Text>ready</Text></SyncProvider>);
      await act(async () => { jest.runOnlyPendingTimers(); await Promise.resolve(); });
      await triggerOnline();
      await waitFor(() => expect(findOwnedFieldSurvey(database, surveyId, ownerId)?.status).toBe('failed'));
      jest.mocked(useAuth).mockReturnValue(authState('verified'));
      await view.rerender(<SyncProvider><Text>ready</Text></SyncProvider>);
      await act(async () => { await Promise.resolve(); await Promise.resolve(); });
      expect(jest.mocked(apiRequest)).not.toHaveBeenCalled();
      expect(findOwnedFieldSurvey(database, surveyId, ownerId)).toMatchObject({
        status: 'failed', lastSyncErrorCode: 'NETWORK_UNAVAILABLE',
      });

      await act(async () => { await jest.advanceTimersByTimeAsync(60_001); });
      await waitFor(() => expect(jest.mocked(apiRequest)).toHaveBeenCalled());
      await waitFor(async () => expect((await findFieldReportById(database, reportId, ownerId))?.syncStatus).toBe('synced'));
      expect(findOwnedFieldSurvey(database, surveyId, ownerId)).toMatchObject({ status: 'synced', remoteId: 'survey-remote' });
      native.close();
    } finally {
      jest.useRealTimers();
    }
  });

  it('retries verification on the timer and uploads held records after success', async () => {
    jest.useFakeTimers();
    const { database, native } = openDatabase();
    jest.mocked(useCaneGuardDatabase).mockReturnValue(database);
    await seedHeldQueues(database, native);
    let rerenderVerified: () => Promise<void> = async () => undefined;
    const retry = jest.fn(async () => {
      jest.mocked(useAuth).mockReturnValue(authState('verified', retry));
      await rerenderVerified();
      return 'verified';
    });
    jest.mocked(useAuth).mockReturnValue(authState('unavailable', retry));
    let listener: ((state: never) => void) | undefined;
    jest.mocked(NetInfo.addEventListener).mockImplementation((callback) => { listener = callback; return jest.fn(); });
    jest.mocked(NetInfo.fetch).mockResolvedValue(online);
    const view = await render(<SyncProvider><Text>ready</Text></SyncProvider>);
    rerenderVerified = async () => { await view.rerender(<SyncProvider><Text>ready</Text></SyncProvider>); };
    await act(async () => { jest.runOnlyPendingTimers(); await Promise.resolve(); });
    await waitFor(() => expect(listener).toBeDefined());
    await act(async () => { listener?.(online); await Promise.resolve(); });
    await waitFor(() => expect(jest.getTimerCount()).toBeGreaterThan(0));
    await act(async () => { await jest.advanceTimersByTimeAsync(60_001); });
    await waitFor(() => expect(retry).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(jest.mocked(apiRequest)).toHaveBeenCalled());
    await waitFor(async () => expect((await findFieldReportById(database, reportId, ownerId))?.syncStatus).toBe('synced'));
    expect(jest.mocked(apiRequest)).toHaveBeenCalledTimes(2);
    expect(findOwnedFieldSurvey(database, surveyId, ownerId)).toMatchObject({ status: 'synced', remoteId: 'survey-remote' });
    native.close();
    jest.useRealTimers();
  });

  it('keeps persisted queues held while verification remains unavailable', async () => {
    jest.useFakeTimers();
    const { database, native } = openDatabase();
    jest.mocked(useCaneGuardDatabase).mockReturnValue(database);
    await seedHeldQueues(database, native);
    const retry = jest.fn(async () => 'unavailable');
    jest.mocked(useAuth).mockReturnValue(authState('unavailable', retry));
    let listener: ((state: never) => void) | undefined;
    jest.mocked(NetInfo.addEventListener).mockImplementation((callback) => { listener = callback; return jest.fn(); });
    jest.mocked(NetInfo.fetch).mockResolvedValue(online);
    await render(<SyncProvider><Text>ready</Text></SyncProvider>);
    await act(async () => { jest.runOnlyPendingTimers(); await Promise.resolve(); });
    await waitFor(() => expect(listener).toBeDefined());
    await act(async () => { listener?.(online); await Promise.resolve(); });
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      await waitFor(() => expect(jest.getTimerCount()).toBeGreaterThan(0));
      await act(async () => { await jest.advanceTimersByTimeAsync(60_001); });
      await waitFor(() => expect(retry).toHaveBeenCalledTimes(attempt));
    }
    expect(jest.mocked(apiRequest)).not.toHaveBeenCalled();
    expect(findOwnedFieldSurvey(database, surveyId, ownerId)).toMatchObject({ status: 'failed', lastSyncErrorCode: 'NETWORK_UNAVAILABLE' });
    await expect(findFieldReportById(database, reportId, ownerId)).resolves.toMatchObject({ syncStatus: 'pending' });
    native.close();
    jest.useRealTimers();
  });
});
