import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';

import FieldReportScreen from '@/app/field-report';
import type {
  FieldReport,
  FieldReportSubmissionRequirement,
} from '@/features/reports/domain/fieldReportTypes';
import type { ScanRecordDetails } from '@/features/records/domain/recordTypes';

const SCAN_ID = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2';
const REPORT_ID = '7ea3e6f0-b893-4fd3-b414-0b797e62ec8e';
const mockSave = jest.fn(async () => null);
const mockCaptureLocation = jest.fn(async () => null);
const mockFinalize = jest.fn<
  Promise<FieldReport | null>,
  [{ barangay: string; farmerOrFarmOwnerName: string }]
>(async () => null);
const mockSaveManualLocation = jest.fn(async () => null);
const mockRefresh = jest.fn(async () => undefined);
const mockRetryReport = jest.fn(async () => null);
const mockSyncNow = jest.fn(async () => null);
let mockDraftState: {
  data: FieldReport | null;
  errorMessage: string | null;
  loading: boolean;
  captureLocation: typeof mockCaptureLocation;
  capturingLocation: boolean;
  finalize: typeof mockFinalize;
  finalizing: boolean;
  refresh: typeof mockRefresh;
  save: typeof mockSave;
  saveManualLocation: typeof mockSaveManualLocation;
  saved: boolean;
  saving: boolean;
  savingManualLocation: boolean;
  submissionIssues: FieldReportSubmissionRequirement[];
};

jest.mock('@/features/reports/hooks/useFieldReportDraft', () => ({
  useFieldReportDraft: () => mockDraftState,
}));
jest.mock('@/features/sync/hooks/useSync', () => ({
  useSync: () => ({
    isOnline: true,
    isSyncing: false,
    retryReport: mockRetryReport,
    syncNow: mockSyncNow,
  }),
}));
jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      uuid: 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17',
      name: 'Ana Reyes',
      email: 'ana@example.test',
      role: 'field_reporter',
    },
  }),
}));

const mockScan: ScanRecordDetails = {
  id: SCAN_ID,
  managedImageUri: `file:///caneguard/scan-images/${SCAN_ID}.jpg`,
  predictedLabel: 'rust',
  confidence: 0.82,
  barangay: null,
  syncStatus: 'local_only',
  createdAt: '2026-07-25T05:30:00.000Z',
  imageMimeType: 'image/jpeg',
  imageSizeBytes: 4096,
  imageSourceType: 'camera',
  sourceWidth: 1200,
  sourceHeight: 900,
  checklistConsistency: 'consistent',
  reportedSeverity: null,
  modelVersion: 'v0.1-baseline',
  preprocessMs: 4,
  inferenceMs: 8,
  totalMs: 12,
  remoteId: null,
  updatedAt: '2026-07-25T05:30:00.000Z',
  classScores: [
    { label: 'healthy', score: 0.08 },
    { label: 'mosaic', score: 0.1 },
    { label: 'rust', score: 0.82 },
  ],
  symptoms: ['orange-brown-pustules'],
  qualityWarnings: [],
  syncAttemptCount: 0,
  lastSyncErrorCode: null,
  lastSyncAttemptAt: null,
  lastSyncedAt: null,
};
jest.mock('@/features/records/hooks/useRecords', () => ({
  useScanRecordDetails: () => ({
    data: mockScan,
    errorMessage: null,
    loading: false,
    refresh: mockRefresh,
  }),
}));

const mockUseLocalSearchParams = jest.mocked(useLocalSearchParams);

function draft(overrides: Partial<FieldReport> = {}): FieldReport {
  return {
    id: REPORT_ID,
    scanRecordId: SCAN_ID,
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
    submitterIdentity: 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17',
    submitterRole: 'field_reporter',
    syncAttemptCount: 0,
    syncStatus: 'local_only',
    createdAt: '2026-08-10T01:00:00.000Z',
    updatedAt: '2026-08-10T01:00:00.000Z',
    ...overrides,
  };
}

describe('FieldReportScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({ scanRecordId: SCAN_ID });
    mockDraftState = {
      data: draft(),
      errorMessage: null,
      loading: false,
      captureLocation: mockCaptureLocation,
      capturingLocation: false,
      finalize: mockFinalize,
      finalizing: false,
      refresh: mockRefresh,
      save: mockSave,
      saveManualLocation: mockSaveManualLocation,
      saved: false,
      saving: false,
      savingManualLocation: false,
      submissionIssues: [],
    };
  });

  it('saves incomplete report values as a local Draft', async () => {
    await render(<FieldReportScreen />);

    await act(async () => undefined);

    expect(screen.getByText('Draft')).toBeOnTheScreen();
    expect(
      screen.getByText(/Drafts are stored only on this device and are not queued/),
    ).toBeOnTheScreen();
    expect(screen.getByText('Nasugbu, Batangas')).toBeOnTheScreen();
    expect(screen.getByTestId('field-report.submitter')).toHaveTextContent(
      'Ana Reyes · Field reporter',
    );
    expect(screen.getByText('Possible result: Rust')).toBeOnTheScreen();
    expect(screen.getByText('82%')).toBeOnTheScreen();

    await act(async () => {
      fireEvent.changeText(
        screen.getByTestId('field-report.farmer-name-input'),
        'Maria Santos',
      );
    });
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Save Field Report draft'));
    });

    expect(mockSave).toHaveBeenCalledWith({
      farmerOrFarmOwnerName: 'Maria Santos',
      barangay: '',
    });
  });

  it('captures GPS without discarding unsaved form values', async () => {
    await render(<FieldReportScreen />);

    await act(async () => {
      fireEvent.changeText(
        screen.getByTestId('field-report.farmer-name-input'),
        'Maria Santos',
      );
    });
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Capture GPS Location'));
    });

    expect(mockCaptureLocation).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('field-report.farmer-name-input')).toHaveProp(
      'value',
      'Maria Santos',
    );
  });

  it('shows retained poor GPS evidence and offers retry', async () => {
    mockDraftState = {
      ...mockDraftState,
      data: draft({
        gpsAttemptAccuracy: 38,
        gpsAttemptLatitude: 14.0667,
        gpsAttemptLongitude: 120.6319,
        gpsAttemptedAt: '2026-08-10T01:04:00.000Z',
        gpsCaptureOutcome: 'low_accuracy',
        gpsOutcomeRecordedAt: '2026-08-10T01:04:00.000Z',
      }),
    };

    await render(<FieldReportScreen />);
    await act(async () => undefined);

    expect(screen.getByTestId('field-report.gps-status')).toHaveTextContent(
      /did not meet the preferred quality target/,
    );
    expect(screen.getByTestId('field-report.gps-evidence')).toHaveTextContent(
      /±38 m/,
    );
    expect(screen.getByLabelText('Retry GPS Location')).toBeOnTheScreen();
  });

  it('shows permission denial as retryable while preserving the Draft', async () => {
    mockDraftState = {
      ...mockDraftState,
      data: draft({
        farmerOrFarmOwnerName: 'Maria Santos',
        gpsCaptureOutcome: 'permission_denied',
        gpsOutcomeRecordedAt: '2026-08-10T01:04:00.000Z',
      }),
    };

    await render(<FieldReportScreen />);
    await act(async () => undefined);

    expect(screen.getByTestId('field-report.gps-status')).toHaveTextContent(
      /permission was denied/,
    );
    expect(screen.getByTestId('field-report.farmer-name-input')).toHaveProp(
      'value',
      'Maria Santos',
    );
    expect(screen.getByLabelText('Retry GPS Permission')).toBeOnTheScreen();
    expect(screen.getByLabelText('Open online manual map')).toBeOnTheScreen();

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Open online manual map'));
    });
    expect(router.push).toHaveBeenCalledWith({
      pathname: './manual-map',
      params: { reportId: REPORT_ID, scanRecordId: SCAN_ID },
    });
  });

  it('shows manual-map provenance without inventing GPS accuracy', async () => {
    mockDraftState = {
      ...mockDraftState,
      data: draft({
        finalLatitude: 14.071,
        finalLongitude: 120.635,
        locationSource: 'manual_map',
        manualLocationSelectedAt: '2026-08-10T02:00:00.000Z',
        gpsCaptureOutcome: 'low_accuracy',
        gpsAttemptAccuracy: 38,
        gpsAttemptLatitude: 14.0667,
        gpsAttemptLongitude: 120.6319,
        gpsAttemptedAt: '2026-08-10T01:04:00.000Z',
      }),
    };

    await render(<FieldReportScreen />);
    await act(async () => undefined);

    expect(screen.getByTestId('field-report.manual-location')).toHaveTextContent(
      'Manual map · 14.071000, 120.635000 · GPS accuracy not applicable',
    );
    expect(screen.getByTestId('field-report.gps-evidence')).toHaveTextContent(/±38 m/);
  });

  it('finalizes using the latest form values', async () => {
    await render(<FieldReportScreen />);
    await act(async () => {
      fireEvent.changeText(screen.getByTestId('field-report.farmer-name-input'), 'Maria Santos');
    });
    await act(async () => {
      fireEvent.changeText(screen.getByTestId('field-report.barangay-input'), 'Lumbangan');
    });
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Finalize Field Report'));
    });

    expect(mockFinalize).toHaveBeenCalledWith({
      farmerOrFarmOwnerName: 'Maria Santos',
      barangay: 'Lumbangan',
    });
  });

  it('starts foreground synchronization after successful local finalization', async () => {
    const finalized = draft({
      authoringState: 'finalized',
      syncStatus: 'pending',
      submittedAt: '2026-08-10T03:00:00.000Z',
    });
    mockFinalize.mockResolvedValueOnce(finalized);

    await render(<FieldReportScreen />);
    await fireEvent.press(screen.getByLabelText('Finalize Field Report'));

    expect(mockSyncNow).toHaveBeenCalledWith('after-save');
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('shows actionable submission issues while retaining Draft status', async () => {
    mockDraftState = {
      ...mockDraftState,
      data: draft({ farmerOrFarmOwnerName: 'Maria Santos' }),
      saved: true,
      submissionIssues: ['barangay', 'final_coordinates', 'location_source'],
    };

    await render(<FieldReportScreen />);
    await act(async () => undefined);

    expect(screen.getByText('Draft')).toBeOnTheScreen();
    expect(screen.getByTestId('field-report.submission-issues')).toHaveTextContent(
      /Barangay.*Final coordinates.*GPS or manual-map location source.*latest entries were saved/s,
    );
  });

  it('shows the same report as finalized and pending without editable actions', async () => {
    mockDraftState = {
      ...mockDraftState,
      data: draft({
        authoringState: 'finalized',
        barangay: 'Lumbangan',
        farmerOrFarmOwnerName: 'Maria Santos',
        finalLatitude: 14.0667,
        finalLongitude: 120.6319,
        gpsAccuracy: 4.2,
        locationSource: 'gps',
        submittedAt: '2026-08-10T03:00:00.000Z',
        syncStatus: 'pending',
      }),
    };

    await render(<FieldReportScreen />);
    await act(async () => undefined);

    expect(screen.getByText('Finalized · Pending upload')).toBeOnTheScreen();
    expect(screen.queryByTestId('field-report.finalize')).not.toBeOnTheScreen();
    expect(screen.getByText('GPS')).toBeOnTheScreen();
  });

  it('manually retries using Field Report identity', async () => {
    mockDraftState = {
      ...mockDraftState,
      data: draft({
        authoringState: 'finalized',
        syncStatus: 'failed',
        submittedAt: '2026-08-10T03:00:00.000Z',
      }),
    };

    await render(<FieldReportScreen />);
    await fireEvent.press(screen.getByLabelText('Sync Field Report'));

    expect(mockRetryReport).toHaveBeenCalledWith(REPORT_ID);
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('recovers the retry action and surfaces a local retry failure', async () => {
    mockDraftState = {
      ...mockDraftState,
      data: draft({
        authoringState: 'finalized',
        syncStatus: 'failed',
        submittedAt: '2026-08-10T03:00:00.000Z',
      }),
    };
    mockRetryReport.mockRejectedValueOnce(new Error('storage unavailable'));

    await render(<FieldReportScreen />);
    await fireEvent.press(screen.getByLabelText('Sync Field Report'));

    expect(screen.getByTestId('field-report.retry-error')).toHaveTextContent(
      'The saved record could not be updated. Please try again.',
    );
    expect(screen.getByLabelText('Sync Field Report')).toBeEnabled();
  });

  it('reopens persisted partial values under the same report identity', async () => {
    mockDraftState = {
      ...mockDraftState,
      data: draft({
        farmerOrFarmOwnerName: 'Maria Santos',
        updatedAt: '2026-08-10T01:05:00.000Z',
      }),
      saved: true,
    };

    await render(<FieldReportScreen />);

    await act(async () => undefined);

    expect(screen.getByTestId('field-report.farmer-name-input')).toHaveProp(
      'value',
      'Maria Santos',
    );
    expect(screen.getByText(`Report ID: ${REPORT_ID}`)).toBeOnTheScreen();
    expect(screen.getByTestId('field-report.saved')).toHaveTextContent(
      'Draft saved on this device.',
    );
  });
});
