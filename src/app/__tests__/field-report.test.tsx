import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';

import FieldReportScreen from '@/app/field-report';
import type { FieldReport } from '@/features/reports/domain/fieldReportTypes';
import type { ScanRecordDetails } from '@/features/records/domain/recordTypes';

const SCAN_ID = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2';
const REPORT_ID = '7ea3e6f0-b893-4fd3-b414-0b797e62ec8e';
const mockSave = jest.fn(async () => null);
const mockCaptureLocation = jest.fn(async () => null);
const mockRefresh = jest.fn(async () => undefined);
let mockDraftState: {
  data: FieldReport | null;
  errorMessage: string | null;
  loading: boolean;
  captureLocation: typeof mockCaptureLocation;
  capturingLocation: boolean;
  refresh: typeof mockRefresh;
  save: typeof mockSave;
  saved: boolean;
  saving: boolean;
};

jest.mock('@/features/reports/hooks/useFieldReportDraft', () => ({
  useFieldReportDraft: () => mockDraftState,
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
    gpsAccuracy: null,
    gpsAttemptAccuracy: null,
    gpsAttemptLatitude: null,
    gpsAttemptLongitude: null,
    gpsAttemptedAt: null,
    gpsCaptureOutcome: null,
    gpsOutcomeRecordedAt: null,
    observedAt: '2026-07-25T05:30:00.000Z',
    submittedAt: null,
    submitterIdentity: 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17',
    submitterRole: 'field_reporter',
    syncStatus: 'local_only',
    createdAt: '2026-08-10T01:00:00.000Z',
    updatedAt: '2026-08-10T01:00:00.000Z',
    ...overrides,
  };
}

describe('FieldReportScreen', () => {
  beforeEach(() => {
    mockUseLocalSearchParams.mockReturnValue({ scanRecordId: SCAN_ID });
    mockDraftState = {
      data: draft(),
      errorMessage: null,
      loading: false,
      captureLocation: mockCaptureLocation,
      capturingLocation: false,
      refresh: mockRefresh,
      save: mockSave,
      saved: false,
      saving: false,
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
