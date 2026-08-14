import { act, renderHook, waitFor } from '@testing-library/react-native';
import { randomUUID } from 'expo-crypto';

import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  createOrGetFieldReportDraft,
  finalizeFieldReport,
  findFieldReportByScanRecordId,
  saveFieldReportDraft,
  saveGpsCapture,
} from '@/features/reports/data/fieldReportRepository';
import type { FieldReport } from '@/features/reports/domain/fieldReportTypes';
import { useFieldReportDraft } from '@/features/reports/hooks/useFieldReportDraft';
import { captureGpsLocation } from '@/features/reports/services/captureGpsLocation';

const DATABASE = {};
const SCAN_A = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2';
const SCAN_B = '51214146-7439-48e0-aef4-d0e003f194b4';
const REPORT_A = '7ea3e6f0-b893-4fd3-b414-0b797e62ec8e';
const REPORT_B = '6f80a15d-3f9f-4e0a-bf79-7cf2c37e2fa1';
const SUBMITTER_ID = 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17';
type ScanProps = { scanRecordId: string };

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(),
}));
jest.mock('expo-router', () => {
  const mockReact = jest.requireActual('react') as typeof import('react');
  return {
    useFocusEffect: (callback: () => void) => {
      mockReact.useEffect(callback, [callback]);
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
const mockCaptureGpsLocation = jest.mocked(captureGpsLocation);
const mockCreateOrGetFieldReportDraft = jest.mocked(createOrGetFieldReportDraft);
const mockFinalizeFieldReport = jest.mocked(finalizeFieldReport);
const mockFindFieldReportByScanRecordId = jest.mocked(findFieldReportByScanRecordId);
const mockSaveFieldReportDraft = jest.mocked(saveFieldReportDraft);
const mockSaveGpsCapture = jest.mocked(saveGpsCapture);

function createdReport(
  id: string,
  scanRecordId: string,
  overrides: Partial<FieldReport> = {},
): FieldReport {
  return {
    authorityReview: null,
    id,
    scanRecordId,
    authoringState: 'draft',
    farmerOrFarmOwnerName: null,
    province: 'Batangas',
    municipality: 'Nasugbu',
    barangay: null,
    affectedAreaHectares: null,
    affectedPortionPercent: null,
    caneClass: null,
    cropAge: null,
    fieldNotes: null,
    sugarcaneVariety: null,
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
    ...overrides,
  };
}

describe('useFieldReportDraft', () => {
  beforeEach(() => {
    // resetAllMocks (not clearAllMocks): the D5 automatic GPS capture fires on
    // every brand-new Draft, so `mockResolvedValueOnce`/`mockReturnValueOnce`
    // queues must not leak between tests.
    jest.resetAllMocks();
    jest.mocked(useAuth).mockReturnValue({
      user: { uuid: SUBMITTER_ID, role: 'field_reporter' },
    } as never);
    mockFindFieldReportByScanRecordId.mockResolvedValue(null);
    // Persistent default: every test creates exactly one Draft (id REPORT_A).
    // Test 1 (two scans) overrides locally; `resetAllMocks` above prevents
    // `mockReturnValueOnce` queues from leaking across tests.
    mockRandomUUID.mockReset().mockReturnValue(REPORT_A);
    mockCreateOrGetFieldReportDraft.mockImplementation(async (_database, input) =>
      createdReport(input.id, input.scanRecordId),
    );
    mockSaveGpsCapture.mockImplementation(async (_database, id) =>
      createdReport(id, id === REPORT_A ? SCAN_A : SCAN_B),
    );
    mockCaptureGpsLocation.mockResolvedValue({
      capturedAt: '2026-08-10T01:02:00.000Z',
      outcome: 'permission_denied',
    });
  });

  it('does not reuse a Draft identity when the scan changes', async () => {
    mockRandomUUID.mockReset().mockReturnValueOnce(REPORT_A).mockReturnValueOnce(REPORT_B);
    const { rerender } = await renderHook(
      ({ scanRecordId }: ScanProps) => useFieldReportDraft(scanRecordId),
      { initialProps: { scanRecordId: SCAN_A } },
    );

    await waitFor(() =>
      expect(mockCreateOrGetFieldReportDraft).toHaveBeenCalledTimes(1),
    );
    await rerender({ scanRecordId: SCAN_B });
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
      ({ scanRecordId }: ScanProps) => useFieldReportDraft(scanRecordId),
      { initialProps: { scanRecordId: SCAN_A } },
    );
    await waitFor(() =>
      expect(mockFindFieldReportByScanRecordId).toHaveBeenCalledWith(
        DATABASE,
        SCAN_A,
        SUBMITTER_ID,
      ),
    );

    await rerender({ scanRecordId: SCAN_B });
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

  it('hides the previous Draft and blocks its actions while the next scan loads', async () => {
    let resolveScanB: ((report: FieldReport | null) => void) | undefined;
    mockFindFieldReportByScanRecordId.mockImplementation(
      async (_database, scanRecordId) => {
        if (scanRecordId === SCAN_A) {
          return createdReport(REPORT_A, SCAN_A);
        }
        return new Promise<FieldReport | null>((resolve) => {
          resolveScanB = resolve;
        });
      },
    );

    const { result, rerender } = await renderHook(
      ({ scanRecordId }: ScanProps) => useFieldReportDraft(scanRecordId),
      { initialProps: { scanRecordId: SCAN_A } },
    );
    await waitFor(() => expect(result.current.data?.id).toBe(REPORT_A));

    await rerender({ scanRecordId: SCAN_B });
    await waitFor(() =>
      expect(mockFindFieldReportByScanRecordId).toHaveBeenLastCalledWith(
        DATABASE,
        SCAN_B,
        SUBMITTER_ID,
      ),
    );
    expect(result.current.data).toBeNull();

    let saveResult: FieldReport | null = null;
    await act(async () => {
      saveResult = await result.current.save({
        barangay: 'Lumbangan',
        farmerOrFarmOwnerName: 'Maria Santos',
      });
    });
    expect(saveResult).toBeNull();
    expect(mockSaveFieldReportDraft).not.toHaveBeenCalled();

    await act(async () => {
      resolveScanB?.(createdReport(REPORT_B, SCAN_B));
    });
    await waitFor(() => expect(result.current.data?.id).toBe(REPORT_B));
  });

  it('flags location services off when capture reports them disabled', async () => {
    mockCaptureGpsLocation.mockResolvedValue({
      capturedAt: '2026-08-10T01:04:00.000Z',
      outcome: 'unavailable',
      reason: 'location_services_disabled',
    });
    mockSaveGpsCapture.mockResolvedValue(createdReport(REPORT_A, SCAN_A));

    const { result } = await renderHook(() => useFieldReportDraft(SCAN_A));
    await waitFor(() =>
      expect(mockCreateOrGetFieldReportDraft).toHaveBeenCalledTimes(1),
    );

    await act(async () => {
      await result.current.captureLocation();
    });

    expect(result.current.locationServicesDisabled).toBe(true);
    expect(mockSaveGpsCapture).toHaveBeenCalledWith(
      DATABASE,
      REPORT_A,
      SUBMITTER_ID,
      expect.objectContaining({
        capturedAt: '2026-08-10T01:04:00.000Z',
        outcome: 'unavailable',
        reason: 'location_services_disabled',
      }),
    );
  });

  it('does not blame location services when the reading itself is unavailable', async () => {
    mockCaptureGpsLocation.mockResolvedValue({
      capturedAt: '2026-08-10T01:04:00.000Z',
      outcome: 'unavailable',
      reason: 'reading_unavailable',
    });
    mockSaveGpsCapture.mockResolvedValue(createdReport(REPORT_A, SCAN_A));

    const { result } = await renderHook(() => useFieldReportDraft(SCAN_A));
    await waitFor(() =>
      expect(mockCreateOrGetFieldReportDraft).toHaveBeenCalledTimes(1),
    );

    await act(async () => {
      await result.current.captureLocation();
    });

    expect(result.current.locationServicesDisabled).toBe(false);
  });

  it('clears the services-off flag once a later capture resolves', async () => {
    // The automatic capture (D5) fires once on Draft creation and consumes the
    // first reading, so queue three: auto + explicit fail, then explicit ok.
    mockCaptureGpsLocation
      .mockResolvedValueOnce({
        capturedAt: '2026-08-10T01:04:00.000Z',
        outcome: 'unavailable',
        reason: 'location_services_disabled',
      })
      .mockResolvedValueOnce({
        capturedAt: '2026-08-10T01:04:30.000Z',
        outcome: 'unavailable',
        reason: 'location_services_disabled',
      })
      .mockResolvedValueOnce({
        accuracy: 4.4,
        capturedAt: '2026-08-10T01:05:00.000Z',
        latitude: 14.0667,
        longitude: 120.6319,
        outcome: 'resolved',
      });
    mockSaveGpsCapture.mockResolvedValue(createdReport(REPORT_A, SCAN_A));

    const { result } = await renderHook(() => useFieldReportDraft(SCAN_A));
    await waitFor(() =>
      expect(mockCreateOrGetFieldReportDraft).toHaveBeenCalledTimes(1),
    );
    await waitFor(() =>
      expect(result.current.capturingLocation).toBe(false),
    );

    await act(async () => {
      await result.current.captureLocation();
    });
    expect(result.current.locationServicesDisabled).toBe(true);

    await act(async () => {
      await result.current.captureLocation();
    });
    expect(result.current.locationServicesDisabled).toBe(false);
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
    // Let the automatic capture (D5) settle so it cannot trip the
    // `capturingLocation` guard inside `finalize`.
    await waitFor(() =>
      expect(result.current.capturingLocation).toBe(false),
    );

    let finalizePromise: Promise<FieldReport | null> | null = null;
    let saveResult: FieldReport | null = null;
    await act(async () => {
      finalizePromise = result.current.finalize({
        affectedAreaHectares: 0.5,
        affectedPortionPercent: 30,
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

describe('useFieldReportDraft automatic location capture (D5)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useAuth).mockReturnValue({
      user: { uuid: SUBMITTER_ID, role: 'field_reporter' },
    } as never);
    mockFindFieldReportByScanRecordId.mockResolvedValue(null);
    mockRandomUUID.mockReset().mockReturnValue(REPORT_A);
    mockCreateOrGetFieldReportDraft.mockImplementation(async (_database, input) =>
      createdReport(input.id, input.scanRecordId),
    );
    mockSaveGpsCapture.mockImplementation(async (_database, id) =>
      createdReport(id, SCAN_A),
    );
  });

  it('attempts one GPS reading when a brand-new Draft is created', async () => {
    mockCaptureGpsLocation.mockResolvedValue({
      capturedAt: '2026-08-10T01:02:00.000Z',
      outcome: 'permission_denied',
    });

    const { result } = await renderHook(() => useFieldReportDraft(SCAN_A));

    await waitFor(() => expect(result.current.data?.id).toBe(REPORT_A));
    await waitFor(() =>
      expect(mockCaptureGpsLocation).toHaveBeenCalledTimes(1),
    );
    expect(mockSaveGpsCapture).toHaveBeenCalledWith(
      DATABASE,
      REPORT_A,
      SUBMITTER_ID,
      expect.objectContaining({ outcome: 'permission_denied' }),
    );
  });

  it('does not auto-capture again after a refresh, and never on an existing Draft', async () => {
    mockCaptureGpsLocation.mockResolvedValue({
      capturedAt: '2026-08-10T01:02:00.000Z',
      outcome: 'permission_denied',
    });

    const { result } = await renderHook(() => useFieldReportDraft(SCAN_A));

    await waitFor(() =>
      expect(mockCaptureGpsLocation).toHaveBeenCalledTimes(1),
    );
    await act(async () => {
      await result.current.refresh();
    });
    expect(mockCaptureGpsLocation).toHaveBeenCalledTimes(1);

    // An existing Draft must never trigger the automatic attempt.
    jest.clearAllMocks();
    mockFindFieldReportByScanRecordId.mockResolvedValue(
      createdReport(REPORT_A, SCAN_A),
    );
    mockCaptureGpsLocation.mockResolvedValue({
      capturedAt: '2026-08-10T02:00:00.000Z',
      outcome: 'permission_denied',
    });
    mockSaveGpsCapture.mockImplementation(async () =>
      createdReport(REPORT_A, SCAN_A),
    );
    const reopened = await renderHook(() => useFieldReportDraft(SCAN_A));
    await waitFor(() => expect(reopened.result.current.data?.id).toBe(REPORT_A));
    expect(mockCaptureGpsLocation).not.toHaveBeenCalled();
  });

  it('never overwrites a manual-map final location', async () => {
    mockFindFieldReportByScanRecordId.mockResolvedValue(null);
    mockCaptureGpsLocation.mockResolvedValue({
      capturedAt: '2026-08-10T01:02:00.000Z',
      outcome: 'permission_denied',
    });
    mockCreateOrGetFieldReportDraft.mockImplementation(async (_database, input) =>
      createdReport(input.id, input.scanRecordId, {
        finalLatitude: 14.071,
        finalLongitude: 120.635,
        locationSource: 'manual_map',
        manualLocationSelectedAt: '2026-08-10T00:59:00.000Z',
      }),
    );

    const { result } = await renderHook(() => useFieldReportDraft(SCAN_A));

    await waitFor(() => expect(result.current.data?.id).toBe(REPORT_A));
    expect(mockCaptureGpsLocation).not.toHaveBeenCalled();
    expect(mockSaveGpsCapture).not.toHaveBeenCalled();
  });

  it('seeds the region defaults from the reference-data store', async () => {
    const { result } = await renderHook(() =>
      useFieldReportDraft(SCAN_A, true, {
        province: 'Batangas',
        municipality: 'Nasugbu',
      }),
    );

    await waitFor(() => expect(result.current.data?.id).toBe(REPORT_A));
    expect(mockCreateOrGetFieldReportDraft).toHaveBeenCalledWith(
      DATABASE,
      expect.objectContaining({
        province: 'Batangas',
        municipality: 'Nasugbu',
      }),
    );
  });
});
