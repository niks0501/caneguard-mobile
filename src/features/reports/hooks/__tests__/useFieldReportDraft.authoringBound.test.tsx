import { act, renderHook, waitFor } from '@testing-library/react-native';
import { randomUUID } from 'expo-crypto';

import { AUTHORING_WINDOW_COPY } from '@/constants/copy';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  createOrGetFieldReportDraft,
  finalizeFieldReport,
  findFieldReportByScanRecordId,
  saveGpsCapture,
} from '@/features/reports/data/fieldReportRepository';
import type { FieldReport } from '@/features/reports/domain/fieldReportTypes';
import { useFieldReportDraft } from '@/features/reports/hooks/useFieldReportDraft';
import { captureGpsLocation } from '@/features/reports/services/captureGpsLocation';

const DATABASE = {};
const SCAN = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2';
const REPORT = '7ea3e6f0-b893-4fd3-b414-0b797e62ec8e';
const SUBMITTER = 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17';
const VALUES = {
  affectedAreaHectares: 0.5,
  affectedPortionPercent: 30,
  barangay: 'Lumbangan',
  farmerOrFarmOwnerName: 'Maria Santos',
};

jest.mock('expo-crypto', () => ({ randomUUID: jest.fn() }));
jest.mock('expo-router', () => {
  const mockReact = jest.requireActual('react') as typeof import('react');
  return { useFocusEffect: (callback: () => void) => { mockReact.useEffect(callback, [callback]); } };
});
jest.mock('@/database/DatabaseProvider', () => ({ useCaneGuardDatabase: () => DATABASE }));
jest.mock('@/features/auth/hooks/useAuth', () => ({ useAuth: jest.fn() }));
jest.mock('@/features/reports/data/fieldReportRepository', () => ({
  createOrGetFieldReportDraft: jest.fn(),
  deleteFieldReportDraft: jest.fn(),
  findFieldReportByScanRecordId: jest.fn(),
  finalizeFieldReport: jest.fn(),
  hasFieldReportOwnedByAnotherSubmitter: jest.fn(),
  clearLocationUnavailable: jest.fn(),
  saveFieldReportDraft: jest.fn(),
  saveGpsCapture: jest.fn(),
  saveManualMapLocation: jest.fn(),
  setLocationUnavailable: jest.fn(),
}));
jest.mock('@/features/reports/services/captureGpsLocation', () => ({ captureGpsLocation: jest.fn() }));
jest.mock('@/features/reports/services/expoForegroundLocationClient', () => ({ expoForegroundLocationClient: {} }));
jest.mock('@/features/sync/hooks/useSyncRecordsRevision', () => ({ useSyncRecordsRefresh: jest.fn() }));

function draft(): FieldReport {
  return {
    authorityReview: null,
    id: REPORT,
    scanRecordId: SCAN,
    authoringState: 'draft',
    farmerOrFarmOwnerName: null,
    province: 'Batangas',
    municipality: 'Nasugbu',
    barangay: null,
    affectedAreaHectares: null,
    affectedAreaMeasurement: 'not_measured',
    affectedPortionPercent: null,
    affectedPortionMeasurement: 'not_measured',
    caneClass: null,
    cropAge: null,
    fieldNotes: null,
    mismatchReported: null,
    reporterObservationText: null,
    reporterSuspectedCondition: null,
    sugarcaneVariety: null,
    finalLatitude: null,
    finalLongitude: null,
    locationSource: null,
    locationUnavailableReason: null,
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
    submitterIdentity: SUBMITTER,
    submitterRole: 'field_reporter',
    syncAttemptCount: 0,
    syncStatus: 'local_only',
    createdAt: '2026-08-10T01:00:00.000Z',
    updatedAt: '2026-08-10T01:00:00.000Z',
  };
}

describe('report finalize authoring bound (NET-3)', () => {
  const getAuthoringProvenance = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(useAuth).mockReturnValue({
      getAuthoringProvenance,
      user: { uuid: SUBMITTER, role: 'field_reporter', capabilities: ['report:submit'], districtCode: 'D-01' },
    } as never);
    jest.mocked(randomUUID).mockReturnValue(REPORT);
    jest.mocked(findFieldReportByScanRecordId).mockResolvedValue(null);
    jest.mocked(createOrGetFieldReportDraft).mockImplementation(async () => draft());
    jest.mocked(saveGpsCapture).mockImplementation(async () => draft());
    jest.mocked(captureGpsLocation).mockResolvedValue({
      capturedAt: '2026-08-10T01:02:00.000Z',
      canAskAgain: false,
      outcome: 'permission_denied',
    });
  });

  async function ready() {
    const hook = await renderHook(() => useFieldReportDraft(SCAN));
    await waitFor(() => expect(createOrGetFieldReportDraft).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(hook.result.current.capturingLocation).toBe(false));
    return hook;
  }

  // Intent: "the authoring bound": a report cannot be finished once the window has closed, and the inspector is told why.
  it('refuses to finalize when the session may not author, and says why', async () => {
    getAuthoringProvenance.mockReturnValue(null);
    const { result } = await ready();

    let outcome: unknown = null;
    await act(async () => {
      outcome = await result.current.finalizeWithOutcome(VALUES);
    });

    expect(outcome).toEqual({ status: 'failed' });
    expect(finalizeFieldReport).not.toHaveBeenCalled();
    expect(result.current.errorMessage).toBe(AUTHORING_WINDOW_COPY.ended);
  });

  // Intent: "freeze provenance at finish": the report is finalized with the basis the session gives at that moment.
  it('finalizes with the provenance the session gives at that moment', async () => {
    getAuthoringProvenance.mockReturnValue({ basis: 'carryover', verifiedAt: '2026-11-12T08:00:00.000Z' });
    jest.mocked(finalizeFieldReport).mockResolvedValue({
      missingRequirements: [],
      report: draft(),
      status: 'invalid',
    });
    const { result } = await ready();

    await act(async () => {
      await result.current.finalizeWithOutcome(VALUES);
    });

    expect(finalizeFieldReport).toHaveBeenCalledWith(
      DATABASE,
      REPORT,
      SUBMITTER,
      expect.objectContaining({ provenance: { basis: 'carryover', verifiedAt: '2026-11-12T08:00:00.000Z' } }),
    );
  });
});
