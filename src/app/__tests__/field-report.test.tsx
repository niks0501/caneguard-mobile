import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Linking } from 'react-native';

import FieldReportScreen from '@/app/field-report';
import type {
  FieldReport,
  FieldReportSubmissionRequirement,
} from '@/features/reports/domain/fieldReportTypes';
import type { ScanRecordDetails } from '@/features/records/domain/recordTypes';

const SCAN_ID = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2';
const REPORT_ID = '7ea3e6f0-b893-4fd3-b414-0b797e62ec8e';

interface FormValues {
  affectedAreaHectares?: number | null;
  affectedPortionPercent?: number | null;
  barangay: string;
  caneClass?: string;
  cropAge?: string;
  farmerOrFarmOwnerName: string;
  fieldNotes?: string;
  municipality?: string;
  province?: string;
  sugarcaneVariety?: string;
}

const mockSave = jest.fn(async () => null);
const mockCaptureLocation = jest.fn(async () => null);
const mockFinalize = jest.fn<Promise<FieldReport | null>, [FormValues]>(
  async () => null,
);
const mockSaveManualLocation = jest.fn(async () => null);
const mockRefresh = jest.fn(async () => undefined);
let mockAuthorityError: string | null = null;
const mockRetryReport = jest.fn(async () => null);
const mockSyncNow = jest.fn(async () => null);
let mockIsOnline: boolean | null = true;
const mockReferenceDataRefresh = jest.fn(async () => undefined);
let mockDraftState: {
  data: FieldReport | null;
  errorMessage: string | null;
  loading: boolean;
  captureLocation: typeof mockCaptureLocation;
  capturingLocation: boolean;
  finalize: typeof mockFinalize;
  finalizing: boolean;
  locationServicesDisabled: boolean;
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
jest.mock('@/features/reports/hooks/useLocationReferenceData', () => ({
  useLocationReferenceData: () => ({
    data: jest.requireActual(
      '@/features/reports/referenceData/nasugbuSeed',
    ).SEED_LOCATION_REFERENCE_DATA,
    errorMessage: null,
    loading: false,
    refresh: mockReferenceDataRefresh,
    refreshing: false,
    source: 'seed',
  }),
}));
jest.mock('@/features/reports/hooks/useAuthorityReviewStatus', () => ({
  useAuthorityReviewStatus: () => ({
    capabilityUnavailable: false,
    errorMessage: mockAuthorityError,
    lastSuccessfulAt: mockAuthorityError ? '2026-08-13T12:01:00.000Z' : null,
    refreshing: false,
    refresh: mockRefresh,
  }),
}));
jest.mock('@/features/sync/hooks/useSync', () => ({
  useSync: () => ({
    isOnline: mockIsOnline,
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
  authorityReview: null,
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
  symptoms: ['rust'],
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
    authorityReview: null,
    id: REPORT_ID,
    scanRecordId: SCAN_ID,
    authoringState: 'draft',
    farmerOrFarmOwnerName: null,
    province: 'Batangas',
    municipality: 'Nasugbu',
    barangay: null,
    affectedAreaHectares: null,
    affectedPortionPercent: null,
    sugarcaneVariety: null,
    cropAge: null,
    caneClass: null,
    fieldNotes: null,
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

function expectFormValues(values: Partial<FormValues> = {}): FormValues {
  const base: FormValues = {
    affectedAreaHectares: null,
    affectedPortionPercent: null,
    barangay: '',
    caneClass: '',
    cropAge: '',
    farmerOrFarmOwnerName: '',
    fieldNotes: '',
    municipality: 'Nasugbu',
    province: 'Batangas',
    sugarcaneVariety: '',
  };
  return { ...base, ...values };
}

describe('FieldReportScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthorityError = null;
    mockIsOnline = true;
    mockUseLocalSearchParams.mockReturnValue({ scanRecordId: SCAN_ID });
    mockDraftState = {
      data: draft(),
      errorMessage: null,
      loading: false,
      captureLocation: mockCaptureLocation,
      capturingLocation: false,
      finalize: mockFinalize,
      finalizing: false,
      locationServicesDisabled: false,
      refresh: mockRefresh,
      save: mockSave,
      saveManualLocation: mockSaveManualLocation,
      saved: false,
      saving: false,
      savingManualLocation: false,
      submissionIssues: [],
    };
  });

  it('shows the automatic summary prefilled and saves incomplete values as a Draft', async () => {
    await render(<FieldReportScreen />);

    await act(async () => undefined);

    expect(screen.getByText('Draft')).toBeOnTheScreen();
    expect(
      screen.getByText(/Drafts are stored only on this device and are not queued/),
    ).toBeOnTheScreen();
    expect(screen.getByTestId('field-report.summary')).toBeOnTheScreen();
    expect(screen.getByText('Nasugbu, Batangas')).toBeOnTheScreen();
    expect(screen.getByTestId('field-report.submitter')).toHaveTextContent(
      'Ana Reyes · Field reporter',
    );
    expect(screen.getByText('Possible result: Rust · 82% confidence')).toBeOnTheScreen();
    expect(screen.getByText('Rust-colored or orange-brown spots or pustules')).toBeOnTheScreen();

    await act(async () => {
      fireEvent.changeText(
        screen.getByTestId('field-report.farmer-name-input'),
        'Maria Santos',
      );
    });
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Save Field Report draft'));
    });

    expect(mockSave).toHaveBeenCalledWith(
      expectFormValues({ farmerOrFarmOwnerName: 'Maria Santos' }),
    );
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

  it('prompts to enable location services and opens device settings', async () => {
    const openSettings = jest
      .spyOn(Linking, 'openSettings')
      .mockResolvedValue(undefined);
    mockDraftState = {
      ...mockDraftState,
      locationServicesDisabled: true,
      data: draft({
        gpsCaptureOutcome: 'unavailable',
        gpsOutcomeRecordedAt: '2026-08-10T01:04:00.000Z',
      }),
    };

    await render(<FieldReportScreen />);
    await act(async () => undefined);

    expect(screen.getByTestId('field-report.location-services-off')).toHaveTextContent(
      /Location services are off/,
    );
    expect(
      screen.getByText(/Enable location services in device settings, then retry GPS capture/),
    ).toBeOnTheScreen();
    expect(screen.getByTestId('field-report.gps-status')).toHaveTextContent(
      /Location services or an accurate device reading are unavailable/,
    );

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Open device location settings'));
    });
    expect(openSettings).toHaveBeenCalledTimes(1);
  });

  it('hides the location-services prompt when capture is possible again', async () => {
    mockDraftState = {
      ...mockDraftState,
      locationServicesDisabled: false,
      data: draft({
        gpsCaptureOutcome: 'low_accuracy',
        gpsOutcomeRecordedAt: '2026-08-10T01:04:00.000Z',
      }),
    };

    await render(<FieldReportScreen />);
    await act(async () => undefined);

    expect(screen.queryByTestId('field-report.location-services-off')).not.toBeOnTheScreen();
    expect(screen.queryByLabelText('Open device location settings')).not.toBeOnTheScreen();
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

  it('selects a barangay from the searchable picker', async () => {
    await render(<FieldReportScreen />);

    await act(async () => {
      fireEvent.press(screen.getByTestId('field-report.barangay-input'));
    });
    await act(async () => {
      fireEvent.changeText(
        screen.getByTestId('field-report.barangay-input-search'),
        'Lumb',
      );
    });
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Lumbangan'));
    });

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Save Field Report draft'));
    });
    expect(mockSave).toHaveBeenCalledWith(
      expectFormValues({ barangay: 'Lumbangan' }),
    );
  });

  it('keeps a legacy free-text barangay that is not in the reference list', async () => {
    mockDraftState = {
      ...mockDraftState,
      data: draft({ barangay: 'Old Barrio' }),
    };

    await render(<FieldReportScreen />);
    await act(async () => undefined);

    expect(screen.getByTestId('field-report.barangay-input')).toHaveTextContent(
      'Old Barrio',
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId('field-report.barangay-input'));
    });
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Keep “Old Barrio”'));
    });
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Save Field Report draft'));
    });
    expect(mockSave).toHaveBeenCalledWith(
      expectFormValues({ barangay: 'Old Barrio' }),
    );
  });

  it('saves a typed barangay that matches nothing as-is', async () => {
    await render(<FieldReportScreen />);

    await act(async () => {
      fireEvent.press(screen.getByTestId('field-report.barangay-input'));
    });
    await act(async () => {
      fireEvent.changeText(
        screen.getByTestId('field-report.barangay-input-search'),
        'San Isidro Norte',
      );
    });
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Use “San Isidro Norte” as typed'));
    });
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Save Field Report draft'));
    });
    expect(mockSave).toHaveBeenCalledWith(
      expectFormValues({ barangay: 'San Isidro Norte' }),
    );
  });

  it('saves affected numbers with locale-safe decimal parsing', async () => {
    await render(<FieldReportScreen />);

    await act(async () => {
      fireEvent.changeText(
        screen.getByTestId('field-report.affected-area-input'),
        '0,5',
      );
    });
    await act(async () => {
      fireEvent.changeText(
        screen.getByTestId('field-report.affected-portion-input'),
        '30',
      );
    });
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Save Field Report draft'));
    });

    expect(mockSave).toHaveBeenCalledWith(
      expectFormValues({
        affectedAreaHectares: 0.5,
        affectedPortionPercent: 30,
      }),
    );
  });

  it('blocks Draft save with an inline error when a number is invalid', async () => {
    await render(<FieldReportScreen />);

    await act(async () => {
      fireEvent.changeText(
        screen.getByTestId('field-report.affected-area-input'),
        '-2',
      );
    });
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Save Field Report draft'));
    });

    expect(mockSave).not.toHaveBeenCalled();
    expect(
      screen.getByText(/Enter an area greater than 0/),
    ).toBeOnTheScreen();
  });

  it('finalizes using the latest form values including affected numbers', async () => {
    await render(<FieldReportScreen />);
    await act(async () => {
      fireEvent.changeText(screen.getByTestId('field-report.farmer-name-input'), 'Maria Santos');
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('field-report.barangay-input'));
    });
    await act(async () => {
      fireEvent.changeText(
        screen.getByTestId('field-report.barangay-input-search'),
        'Wawa',
      );
    });
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Wawa'));
    });
    await act(async () => {
      fireEvent.changeText(
        screen.getByTestId('field-report.affected-area-input'),
        '1.25',
      );
    });
    await act(async () => {
      fireEvent.changeText(
        screen.getByTestId('field-report.affected-portion-input'),
        '40',
      );
    });
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Finalize Field Report'));
    });

    expect(mockFinalize).toHaveBeenCalledWith(
      expectFormValues({
        affectedAreaHectares: 1.25,
        affectedPortionPercent: 40,
        barangay: 'Wawa',
        farmerOrFarmOwnerName: 'Maria Santos',
      }),
    );
  });

  it('requires affected numbers before finalizing', async () => {
    await render(<FieldReportScreen />);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Finalize Field Report'));
    });

    expect(mockFinalize).not.toHaveBeenCalled();
    expect(screen.getByText('Affected area is required to finalize.')).toBeOnTheScreen();
    expect(
      screen.getByText('Estimated affected portion is required to finalize.'),
    ).toBeOnTheScreen();
  });

  it('starts foreground synchronization after successful local finalization', async () => {
    const finalized = draft({
      authoringState: 'finalized',
      syncStatus: 'pending',
      submittedAt: '2026-08-10T03:00:00.000Z',
    });
    mockFinalize.mockResolvedValueOnce(finalized);

    await render(<FieldReportScreen />);
    await act(async () => {
      fireEvent.changeText(screen.getByTestId('field-report.affected-area-input'), '0.5');
    });
    await act(async () => {
      fireEvent.changeText(screen.getByTestId('field-report.affected-portion-input'), '30');
    });
    await fireEvent.press(screen.getByLabelText('Finalize Field Report'));

    expect(mockSyncNow).toHaveBeenCalledWith('after-save');
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('finalizes locally while offline without starting synchronization', async () => {
    mockIsOnline = false;
    mockFinalize.mockResolvedValueOnce(
      draft({
        authoringState: 'finalized',
        syncStatus: 'pending',
        submittedAt: '2026-08-10T03:00:00.000Z',
      }),
    );

    await render(<FieldReportScreen />);

    expect(screen.queryByTestId('field-report.offline-finalize-block')).not.toBeOnTheScreen();
    expect(screen.getByLabelText('Finalize Field Report')).not.toBeDisabled();
    await act(async () => {
      fireEvent.changeText(
        screen.getByTestId('field-report.affected-area-input'),
        '0.5',
      );
    });
    await act(async () => {
      fireEvent.changeText(
        screen.getByTestId('field-report.affected-portion-input'),
        '30',
      );
    });
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Finalize Field Report'));
    });

    expect(mockFinalize).toHaveBeenCalledWith(
      expectFormValues({
        affectedAreaHectares: 0.5,
        affectedPortionPercent: 30,
      }),
    );
    expect(mockSyncNow).not.toHaveBeenCalled();
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('disables Draft save while finalization is in flight', async () => {
    mockDraftState = { ...mockDraftState, finalizing: true };

    await render(<FieldReportScreen />);

    const saveButton = screen.getByLabelText(
      'Save Field Report draft unavailable while finalizing',
    );
    expect(saveButton).toBeDisabled();
    await fireEvent.press(saveButton);
    expect(mockSave).not.toHaveBeenCalled();
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
        affectedAreaHectares: 0.5,
        affectedPortionPercent: 30,
        finalLatitude: 14.0667,
        finalLongitude: 120.6319,
        gpsAccuracy: 4.2,
        locationSource: 'gps',
        submittedAt: '2026-08-10T03:00:00.000Z',
        syncStatus: 'pending',
      }),
    };

    const view = await render(<FieldReportScreen />);
    await act(async () => undefined);

    expect(screen.getByText('Finalized · Pending upload')).toBeOnTheScreen();
    expect(
      screen.getByText(
        'This report is finalized locally. Current synchronization status: Pending upload.',
      ),
    ).toBeOnTheScreen();
    expect(screen.queryByTestId('field-report.finalize')).not.toBeOnTheScreen();
    expect(screen.getByText('GPS')).toBeOnTheScreen();
    expect(screen.getByText('0.5 ha')).toBeOnTheScreen();
    expect(screen.getByText('30%')).toBeOnTheScreen();

    mockDraftState = {
      ...mockDraftState,
      data: { ...mockDraftState.data!, syncStatus: 'synced' },
    };
    await view.rerender(<FieldReportScreen />);
    expect(
      screen.getByText(
        'This report is finalized locally. Current synchronization status: Synced.',
      ),
    ).toBeOnTheScreen();
  });

  it('keeps delivery and authority review separate and renders cached feedback', async () => {
    mockDraftState = {
      ...mockDraftState,
      data: draft({
        authoringState: 'finalized',
        syncStatus: 'synced',
        remoteId: 'remote-report-1',
        submittedAt: '2026-08-10T03:00:00.000Z',
        authorityReview: {
          rawStatus: 'verified_by_staff',
          statusKind: 'verified_by_staff',
          statusLabel: 'Verified by staff',
          referenceCode: 'CG-100',
          feedback: {
            authorLabel: 'Authority staff',
            message: 'Please inspect the affected area.',
            updatedAt: '2026-08-13T12:00:00.000Z',
          },
          reviewedAt: '2026-08-13T12:00:00.000Z',
          statusUpdatedAt: '2026-08-13T12:00:00.000Z',
          fetchedAt: '2026-08-13T12:01:00.000Z',
        },
      }),
    };

    const view = await render(<FieldReportScreen />);

    expect(screen.getByTestId('field-report.submission-section')).toBeOnTheScreen();
    expect(screen.getByTestId('field-report.authority-review-section')).toBeOnTheScreen();
    expect(screen.getByText('Verified by staff')).toBeOnTheScreen();
    expect(screen.getByText('Please inspect the affected area.')).toBeOnTheScreen();
    expect(screen.getByText(/Authority staff · Updated/)).toBeOnTheScreen();
    expect(screen.getByText('CG-100')).toBeOnTheScreen();
    expect(screen.getByLabelText('Refresh authority review status')).toBeOnTheScreen();

    mockDraftState = {
      ...mockDraftState,
      data: { ...mockDraftState.data!, syncStatus: 'pending', authorityReview: null },
    };
    await view.rerender(<FieldReportScreen />);
    expect(screen.queryByTestId('field-report.authority-review-section')).not.toBeOnTheScreen();
    expect(screen.getByText('Finalized · Pending upload')).toBeOnTheScreen();
  });

  it('keeps cached authority feedback visible when refresh fails', async () => {
    mockAuthorityError = 'Couldn’t refresh—showing the last update.';
    mockDraftState = {
      ...mockDraftState,
      data: draft({
        authoringState: 'finalized',
        syncStatus: 'synced',
        remoteId: 'remote-report-1',
        submittedAt: '2026-08-10T03:00:00.000Z',
        authorityReview: {
          rawStatus: 'for_field_validation',
          statusKind: 'for_field_validation',
          statusLabel: 'Field validation needed',
          referenceCode: null,
          feedback: {
            authorLabel: 'Authority staff',
            message: 'Cached feedback remains available offline.',
            updatedAt: '2026-08-13T12:00:00.000Z',
          },
          reviewedAt: '2026-08-13T12:00:00.000Z',
          statusUpdatedAt: '2026-08-13T12:00:00.000Z',
          fetchedAt: '2026-08-13T12:01:00.000Z',
        },
      }),
    };

    await render(<FieldReportScreen />);

    expect(screen.getByText('Cached feedback remains available offline.')).toBeOnTheScreen();
    expect(screen.getByTestId('field-report.authority-refresh-error')).toHaveTextContent(
      'Couldn’t refresh—showing the last update.',
    );
  });

  it('shows a neutral unavailable state without inventing authority status', async () => {
    mockDraftState = {
      ...mockDraftState,
      data: draft({
        authoringState: 'finalized',
        syncStatus: 'synced',
        remoteId: 'remote-report-1',
        submittedAt: '2026-08-10T03:00:00.000Z',
      }),
    };

    await render(<FieldReportScreen />);

    expect(screen.getByTestId('field-report.authority-status-unavailable')).toHaveTextContent(
      'Authority review status is unavailable for this synchronized report.',
    );
    expect(screen.queryByText('Under review')).not.toBeOnTheScreen();
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
        affectedAreaHectares: 0.5,
        affectedPortionPercent: 30,
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
    expect(screen.getByTestId('field-report.affected-area-input')).toHaveProp(
      'value',
      '0.5',
    );
    expect(screen.getByTestId('field-report.affected-portion-input')).toHaveProp(
      'value',
      '30',
    );
    expect(screen.getByText(`Report ID: ${REPORT_ID}`)).toBeOnTheScreen();
    expect(screen.getByTestId('field-report.saved')).toHaveTextContent(
      'Draft saved on this device.',
    );
  });

  it('collects optional more-details values into the Draft save', async () => {
    await render(<FieldReportScreen />);

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Show More field details'));
    });
    await act(async () => {
      fireEvent.changeText(
        screen.getByTestId('field-report.variety-input'),
        'Phil 2000',
      );
    });
    await act(async () => {
      fireEvent.changeText(
        screen.getByTestId('field-report.crop-age-input'),
        '~3 months',
      );
    });
    await act(async () => {
      fireEvent.changeText(
        screen.getByTestId('field-report.cane-class-input'),
        'Plant cane',
      );
    });
    await act(async () => {
      fireEvent.changeText(
        screen.getByTestId('field-report.notes-input'),
        'Near the river',
      );
    });
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Save Field Report draft'));
    });

    expect(mockSave).toHaveBeenCalledWith(
      expectFormValues({
        caneClass: 'Plant cane',
        cropAge: '~3 months',
        fieldNotes: 'Near the river',
        sugarcaneVariety: 'Phil 2000',
      }),
    );
  });
});
