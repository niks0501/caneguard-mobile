import { act, renderHook, waitFor } from '@testing-library/react-native';
import { randomUUID } from 'expo-crypto';

import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  createOrGetFieldReportDraft,
  finalizeFieldReport,
  findFieldReportByScanRecordId,
  saveFieldReportDraft,
} from '@/features/reports/data/fieldReportRepository';
import type { FieldReport } from '@/features/reports/domain/fieldReportTypes';
import { useFieldReportDraft } from '@/features/reports/hooks/useFieldReportDraft';

const DATABASE = {};
const SCAN_A = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2';
const SCAN_B = '51214146-7439-48e0-aef4-d0e003f194b4';
const REPORT_A = '7ea3e6f0-b893-4fd3-b414-0b797e62ec8e';
const REPORT_B = '6f80a15d-3f9f-4e0a-bf79-7cf2c37e2fa1';
const SUBMITTER_ID = 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17';

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(),
}));
jest.mock('expo-router', () => {
  const React = require('react') as typeof import('react');
  return {
    useFocusEffect: (callback: () => void) => {
      React.useEffect(callback, [callback]);
    },
  };
});
jest.mock('@/database/DatabaseProvider', () => ({
  useCaneGuardDatabase: () => DATABASE,
}));
jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));
jest.mock('@/features/reports/data/fieldReportRepository', () => ({
  createOrGetFieldReportDraft: jest.fn(),
  findFieldReportByScanRecordId: jest.fn(),
  finalizeFieldReport: jest.fn(),
  hasFieldReportOwnedByAnotherSubmitter: jest.fn(),
  saveFieldReportDraft: jest.fn(),
  saveGpsCapture: jest.fn(),
  saveManualMapLocation: jest.fn(),
}));
jest.mock('@/features/reports/services/captureGpsLocation', () => ({
  captureGpsLocation: jest.fn(),
}));
jest.mock('@/features/reports/services/expoForegroundLocationClient', () => ({
  expoForegroundLocationClient: {},
}));
jest.mock('@/features/sync/hooks/useSyncRecordsRevision', () => ({
  useSyncRecordsRefresh: jest.fn(),
}));

const mockRandomUUID = jest.mocked(randomUUID);
const mockCreateOrGetFieldReportDraft = jest.mocked(createOrGetFieldReportDraft);
const mockFinalizeFieldReport = jest.mocked(finalizeFieldReport);
const mockFindFieldReportByScanRecordId = jest.mocked(findFieldReportByScanRecordId);
const mockSaveFieldReportDraft = jest.mocked(saveFieldReportDraft);

function createdReport(id: string, scanRecordId: string): FieldReport {
  return {
    id,
    scanRecordId,
    authoringState: 'draft',
    farmerOrFarmOwnerName: null,
    province: 'Batangas',
    municipality: 'Nasugbu',
    barangay: null,
    finalLatitude: null,
    finalLongitude: null,
    locationSource: null,
    lastSyncAttemptAt: null,
    lastSyncErrorCode: null,
    lastSyncedAt: null,
    manualLocationSelectedAt: null,
    gpsAccuracy: null,
    gpsAttemptAccuracy: null,
    gpsAttemptLatitude: null,
    gpsAttemptLongitude: null,
    gpsAttemptedAt: null,
    gpsCaptureOutcome: null,
    gpsOutcomeRecordedAt: null,
    observedAt: '2026-07-25T05:30:00.000Z',
    remoteId: null,
    submittedAt: null,
    submitterIdentity: SUBMITTER_ID,
    submitterRole: 'field_reporter',
    syncAttemptCount: 0,
    syncStatus: 'local_only',
    createdAt: '2026-08-10T01:00:00.000Z',
    updatedAt: '2026-08-10T01:00:00.000Z',
  };
}

describe('useFieldReportDraft', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useAuth).mockReturnValue({
      user: { uuid: SUBMITTER_ID, role: 'field_reporter' },
    } as never);
    mockFindFieldReportByScanRecordId.mockResolvedValue(null);
    mockRandomUUID.mockReturnValueOnce(REPORT_A).mockReturnValueOnce(REPORT_B);
    mockCreateOrGetFieldReportDraft.mockImplementation(async (_database, input) =>
      createdReport(input.id, input.scanRecordId),
    );
  });

  it('does not reuse a Draft identity when the scan changes', async () => {
    const { rerender } = await renderHook(
      ({ scanRecordId }) => useFieldReportDraft(scanRecordId),
      { initialProps: { scanRecordId: SCAN_A } },
    );

    await waitFor(() =>
      expect(mockCreateOrGetFieldReportDraft).toHaveBeenCalledTimes(1),
    );
    rerender({ scanRecordId: SCAN_B });
    await waitFor(() =>
      expect(mockCreateOrGetFieldReportDraft).toHaveBeenCalledTimes(2),
    );

    expect(mockCreateOrGetFieldReportDraft).toHaveBeenNthCalledWith(
      1,
      DATABASE,
      expect.objectContaining({ id: REPORT_A, scanRecordId: SCAN_A }),
    );
    expect(mockCreateOrGetFieldReportDraft).toHaveBeenNthCalledWith(
      2,
      DATABASE,
      expect.objectContaining({ id: REPORT_B, scanRecordId: SCAN_B }),
    );
  });

  it('ignores a stale refresh when the scan changes while loading', async () => {
    let resolveScanA: ((report: FieldReport | null) => void) | undefined;
    mockFindFieldReportByScanRecordId.mockImplementation(
      async (_database, scanRecordId) => {
        if (scanRecordId === SCAN_A) {
          return new Promise<FieldReport | null>((resolve) => {
            resolveScanA = resolve;
          });
        }
        return null;
      },
    );
    mockRandomUUID.mockReset().mockReturnValue(REPORT_B);

    const { result, rerender } = await renderHook(
      ({ scanRecordId }) => useFieldReportDraft(scanRecordId),
      { initialProps: { scanRecordId: SCAN_A } },
    );
    await waitFor(() =>
      expect(mockFindFieldReportByScanRecordId).toHaveBeenCalledWith(
        DATABASE,
        SCAN_A,
        SUBMITTER_ID,
      ),
    );

    rerender({ scanRecordId: SCAN_B });
    await waitFor(() =>
      expect(mockCreateOrGetFieldReportDraft).toHaveBeenCalledTimes(1),
    );
    expect(result.current.data?.scanRecordId).toBe(SCAN_B);

    await act(async () => {
      resolveScanA?.(createdReport(REPORT_A, SCAN_A));
    });

    expect(result.current.data?.scanRecordId).toBe(SCAN_B);
    expect(result.current.data?.id).toBe(REPORT_B);
  });

  it('blocks Draft saves while finalization is in flight', async () => {
    let resolveFinalize!: (
      result: Awaited<ReturnType<typeof finalizeFieldReport>>,
    ) => void;
    mockFinalizeFieldReport.mockImplementation(
      () =>
        new Promise<Awaited<ReturnType<typeof finalizeFieldReport>>>((resolve) => {
          resolveFinalize = resolve;
        }),
    );

    const { result } = await renderHook(() => useFieldReportDraft(SCAN_A));
    await waitFor(() =>
      expect(mockCreateOrGetFieldReportDraft).toHaveBeenCalledTimes(1),
    );

    let finalizePromise: Promise<FieldReport | null> | null = null;
    let saveResult: FieldReport | null = null;
    await act(async () => {
      finalizePromise = result.current.finalize({
        barangay: 'Lumbangan',
        farmerOrFarmOwnerName: 'Maria Santos',
      });
      saveResult = await result.current.save({
        barangay: 'Lumbangan',
        farmerOrFarmOwnerName: 'Maria Santos',
      });
    });

    expect(saveResult).toBeNull();
    expect(mockSaveFieldReportDraft).not.toHaveBeenCalled();

    await act(async () => {
      resolveFinalize({
        missingRequirements: [],
        report: createdReport(REPORT_A, SCAN_A),
        status: 'invalid',
      });
      await finalizePromise;
    });
  });
});
