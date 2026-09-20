import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Linking } from 'react-native';

import FieldReportScreen from '@/app/field-report';
import { ToastProvider } from '@/components/ui/Toast';
import type {
  FieldReport,
  FieldReportSubmissionRequirement,
} from '@/features/reports/domain/fieldReportTypes';
import type {
  PossibleRecentMatch,
} from '@/features/reports/domain/possibleMatch';
import type { PossibleRecentMatchState } from '@/features/reports/hooks/usePossibleRecentMatch';
import type { ScanRecordDetails } from '@/features/records/domain/recordTypes';

const SCAN_ID = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2';
const REPORT_ID = '7ea3e6f0-b893-4fd3-b414-0b797e62ec8e';

interface FormValues {
  affectedAreaHectares?: number | null;
  affectedAreaMeasurement?: 'measured' | 'not_measured';
  affectedPortionPercent?: number | null;
  affectedPortionMeasurement?: 'measured' | 'not_measured';
  barangay: string;
  caneClass?: string;
  cropAge?: string;
  farmerOrFarmOwnerName: string;
  fieldNotes?: string;
  mismatchReported: boolean | null;
  reporterObservationText: string;
  reporterSuspectedCondition: string;
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
const mockMarkLocationUnavailable = jest.fn(async () => null);
const mockClearLocationUnavailable = jest.fn(async () => null);
const mockRefresh = jest.fn(async () => undefined);
let mockAuthorityError: string | null = null;
const mockRetryReport = jest.fn(async () => null);
const mockSyncNow = jest.fn(async () => null);
let mockIsOnline: boolean | null = true;
const mockReferenceDataRefresh = jest.fn(async () => undefined);
let mockPossibleRecentMatchState: PossibleRecentMatchState = {
  match: null,
  unavailable: false,
  loading: false,
};
const mockDiscardDraft = jest.fn(async () => true);
let mockDraftState: {
  data: FieldReport | null;
  errorMessage: string | null;
  loading: boolean;
  captureLocation: typeof mockCaptureLocation;
  capturingLocation: boolean;
  discardDraft?: typeof mockDiscardDraft;
  finalize: typeof mockFinalize;
  finalizing: boolean;
  locationServicesDisabled: boolean;
  refresh: typeof mockRefresh;
  save: typeof mockSave;
  saveManualLocation: typeof mockSaveManualLocation;
  saved: boolean;
  saving: boolean;
  savingManualLocation: boolean;
  markLocationUnavailable: typeof mockMarkLocationUnavailable;
  clearLocationUnavailable: typeof mockClearLocationUnavailable;
  markingLocationUnavailable: boolean;
  submissionIssues: FieldReportSubmissionRequirement[];
};

jest.mock('@/features/reports/hooks/useFieldReportDraft', () => ({
  useFieldReportDraft: () => mockDraftState,
}));
jest.mock('@/features/reports/hooks/usePossibleRecentMatch', () => ({
  usePossibleRecentMatch: () => mockPossibleRecentMatchState,
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
  ownerIdentity: 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17',
  managedImageUri: `file:///caneguard/scan-images/${SCAN_ID}.jpg`,
  submissionImageUri: `file:///caneguard/scan-images/${SCAN_ID}.jpg`,
  submissionImageMimeType: 'image/jpeg',
  submissionImageSizeBytes: 4096,
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
  decisionSupportWording: 'Possible result only. This output does not confirm a disease.',
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

const possibleRecentMatch: PossibleRecentMatch = {
  barangay: 'Wawa',
  distanceMeters: 12,
  farmerOrFarmOwnerName: 'Maria Santos Farm',
  finalLatitude: 14.0667,
  finalLongitude: 120.6319,
  locationSource: 'gps',
  municipality: 'Nasugbu',
  observedAt: '2026-08-09T12:00:00.000Z',
  predictedLabel: 'rust',
  province: 'Batangas',
  reportId: '51214146-7439-48e0-aef4-d0e003f194b4',
  scanRecordId: '6f80a15d-3f9f-4e0a-bf79-7cf2c37e2fa1',
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
    affectedAreaMeasurement: 'not_measured',
    affectedPortionPercent: null,
    affectedPortionMeasurement: 'not_measured',
    sugarcaneVariety: null,
    cropAge: null,
    caneClass: null,
    fieldNotes: null,
    mismatchReported: null,
    reporterObservationText: null,
    reporterSuspectedCondition: null,
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
    affectedAreaMeasurement: 'not_measured',
    affectedPortionPercent: null,
    affectedPortionMeasurement: 'not_measured',
    barangay: '',
    caneClass: '',
    cropAge: '',
    farmerOrFarmOwnerName: '',
    fieldNotes: '',
    mismatchReported: null,
    reporterObservationText: '',
    reporterSuspectedCondition: '',
    municipality: 'Nasugbu',
    province: 'Batangas',
    sugarcaneVariety: '',
  };
  return { ...base, ...values };
}

async function goToStep(step: 1 | 2 | 3 | 4 | 5): Promise<void> {
  await act(async () => {
    fireEvent.press(screen.getByTestId(`field-report.step-${step}`));
  });
}

describe('FieldReportScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthorityError = null;
    mockIsOnline = true;
    mockPossibleRecentMatchState = {
      match: null,
      unavailable: false,
      loading: false,
    };
    mockUseLocalSearchParams.mockReturnValue({ scanRecordId: SCAN_ID });
    mockDraftState = {
      data: draft(),
      errorMessage: null,
      loading: false,
      captureLocation: mockCaptureLocation,
      capturingLocation: false,
      discardDraft: mockDiscardDraft,
      finalize: mockFinalize,
      finalizing: false,
      locationServicesDisabled: false,
      refresh: mockRefresh,
      save: mockSave,
      saveManualLocation: mockSaveManualLocation,
      saved: false,
      saving: false,
      savingManualLocation: false,
      markLocationUnavailable: mockMarkLocationUnavailable,
      clearLocationUnavailable: mockClearLocationUnavailable,
      markingLocationUnavailable: false,
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
    expect(screen.queryByTestId('field-report.possible-match-warning')).not.toBeOnTheScreen();
    expect(screen.getByText('Nasugbu, Batangas')).toBeOnTheScreen();
    expect(screen.getByTestId('field-report.submitter')).toHaveTextContent(
      'Ana Reyes · Field Inspector',
    );
    expect(screen.getByText('Possible Condition: Rust · 82% confidence')).toBeOnTheScreen();
    expect(screen.getByText('Raised rust-colored or orange-brown spots or pustules, mainly on the leaf underside')).toBeOnTheScreen();

    await goToStep(2);
    expect(screen.getByLabelText('Farmer or farm reference')).toHaveProp(
      'placeholder',
      'Farmer, farm name, or local farm ID',
    );

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

    await goToStep(5);
    expect(screen.getByTestId('field-report.ready-to-submit')).toHaveTextContent(
      /Ready to submit/,
    );
  });

  it('accepts a local farm reference in place of a farmer name', async () => {
    await render(<FieldReportScreen />);
    await goToStep(2);
    await act(async () => {
      fireEvent.changeText(
        screen.getByTestId('field-report.farmer-name-input'),
        'North Block Farm 12',
      );
    });
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
    await goToStep(5);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Finalize Field Report'));
    });

    expect(mockFinalize).toHaveBeenCalledWith(
      expectFormValues({
        farmerOrFarmOwnerName: 'North Block Farm 12',
        affectedAreaHectares: 0.5,
        affectedAreaMeasurement: 'measured',
        affectedPortionPercent: 30,
        affectedPortionMeasurement: 'measured',
      }),
    );
  });

  it('reports an observed concern without declaring the Possible Condition wrong', async () => {
    await render(<FieldReportScreen />);
    await act(async () => undefined);

    expect(screen.getByText('Possible Condition: Rust · 82% confidence')).toBeOnTheScreen();
    expect(screen.getByText('healthy: 8% · mosaic: 10% · rust: 82%')).toBeOnTheScreen();

    await goToStep(3);
    // The concern choices are independent of the Possible Condition agreement
    // question, so they are available before it is answered.
    expect(screen.getByTestId('field-report.concern-option-none')).toBeOnTheScreen();
    expect(screen.getByTestId('field-report.concern-option-rssi')).toBeOnTheScreen();
    expect(screen.getByTestId('field-report.concern-option-other')).toBeOnTheScreen();

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Report RSSI as a field concern'));
    });

    expect(screen.getByTestId('field-report.rssi-not-model-copy')).toHaveTextContent(
      /RSSI can be reported as a field concern, but the current Model V1 does not detect RSSI\./,
    );
    await act(async () => {
      fireEvent.changeText(
        screen.getByTestId('field-report.reporter-observation-input'),
        'Leaves show suspected rust-like symptoms and RSSI concern in the field.',
      );
    });
    await goToStep(2);
    await act(async () => {
      fireEvent.changeText(screen.getByTestId('field-report.affected-area-input'), '0.5');
    });
    await act(async () => {
      fireEvent.changeText(screen.getByTestId('field-report.affected-portion-input'), '30');
    });
    await goToStep(5);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Finalize Field Report'));
    });

    expect(mockFinalize).toHaveBeenCalledWith(
      expectFormValues({
        affectedAreaHectares: 0.5,
        affectedAreaMeasurement: 'measured',
        affectedPortionPercent: 30,
        affectedPortionMeasurement: 'measured',
        mismatchReported: null,
        reporterSuspectedCondition: 'RSSI',
        reporterObservationText: 'Leaves show suspected rust-like symptoms and RSSI concern in the field.',
      }),
    );
    expect(mockScan.predictedLabel).toBe('rust');
    expect(mockScan.classScores).toEqual([
      { label: 'healthy', score: 0.08 },
      { label: 'mosaic', score: 0.1 },
      { label: 'rust', score: 0.82 },
    ]);
  });

  it('maps the concern choices to the stored reporter value', async () => {
    await render(<FieldReportScreen />);
    await act(async () => undefined);

    await goToStep(3);
    await act(async () => {
      fireEvent.press(screen.getByTestId('field-report.concern-option-rssi'));
    });
    // Switching to Other starts from an empty free-text value instead of
    // silently inheriting the RSSI concern.
    await act(async () => {
      fireEvent.press(screen.getByTestId('field-report.concern-option-other'));
    });
    expect(screen.getByTestId('field-report.reporter-condition-input')).toHaveProp('value', '');

    await act(async () => {
      fireEvent.press(screen.getByTestId('field-report.concern-option-none'));
    });
    expect(screen.queryByTestId('field-report.reporter-condition-input')).not.toBeOnTheScreen();
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Save Field Report draft'));
    });

    expect(mockSave).toHaveBeenCalledWith(
      expectFormValues({ reporterSuspectedCondition: '', mismatchReported: null }),
    );
  });

  it("keeps the reporter's observation and concern when the Possible Condition matches", async () => {
    await render(<FieldReportScreen />);
    await act(async () => undefined);

    await goToStep(3);
    await act(async () => {
      fireEvent.changeText(
        screen.getByTestId('field-report.reporter-observation-input'),
        'Long whip-like growth near the stalk.',
      );
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('field-report.concern-option-other'));
    });
    await act(async () => {
      fireEvent.changeText(
        screen.getByTestId('field-report.reporter-condition-input'),
        'Local field observation',
      );
    });
    await act(async () => {
      fireEvent.press(
        screen.getByLabelText('The Possible Condition matches what I see'),
      );
    });
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Save Field Report draft'));
    });

    expect(screen.getByTestId('field-report.reporter-observation-input')).toBeOnTheScreen();
    expect(mockSave).toHaveBeenCalledWith(
      expectFormValues({
        mismatchReported: false,
        reporterObservationText: 'Long whip-like growth near the stalk.',
        reporterSuspectedCondition: 'Local field observation',
      }),
    );
  });

  it('finalizes fresh observation, concern, and agreement together without blocking', async () => {
    await render(<FieldReportScreen />);
    await act(async () => undefined);

    await goToStep(3);
    await act(async () => {
      fireEvent.press(screen.getByTestId('field-report.mismatch-toggle'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('field-report.concern-option-other'));
    });
    await act(async () => {
      fireEvent.changeText(
        screen.getByTestId('field-report.reporter-observation-input'),
        'Long whip-like growth near the stalk.',
      );
    });
    await act(async () => {
      fireEvent.changeText(
        screen.getByTestId('field-report.reporter-condition-input'),
        'Local field observation',
      );
    });
    await goToStep(2);
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
    await goToStep(5);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Finalize Field Report'));
    });

    expect(mockFinalize).toHaveBeenCalledWith(
      expectFormValues({
        affectedAreaHectares: 0.5,
        affectedAreaMeasurement: 'measured',
        affectedPortionPercent: 30,
        affectedPortionMeasurement: 'measured',
        mismatchReported: true,
        reporterObservationText: 'Long whip-like growth near the stalk.',
        reporterSuspectedCondition: 'Local field observation',
      }),
    );
  });

  it('captures GPS without discarding unsaved form values', async () => {
    await render(<FieldReportScreen />);

    await goToStep(2);
    await act(async () => {
      fireEvent.changeText(
        screen.getByTestId('field-report.farmer-name-input'),
        'Maria Santos',
      );
    });
    await goToStep(4);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Capture GPS Location'));
    });

    expect(mockCaptureLocation).toHaveBeenCalledTimes(1);
    await goToStep(2);
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

    await goToStep(4);
    expect(screen.getByTestId('field-report.gps-status')).toHaveTextContent(
      /did not meet the preferred quality target/,
    );
    expect(screen.getByTestId('field-report.gps-evidence')).toHaveTextContent(
      /±38 m/,
    );
    expect(screen.getByLabelText('Retry GPS Location')).toBeOnTheScreen();
  });

  it('does not block finalization on poor GPS accuracy and keeps retry available', async () => {
    mockDraftState = {
      ...mockDraftState,
      data: draft({
        finalLatitude: 14.0667,
        finalLongitude: 120.6319,
        locationSource: 'gps',
        gpsAccuracy: 38,
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

    await goToStep(4);
    expect(screen.getByTestId('field-report.gps-status')).toHaveTextContent(
      /did not meet the preferred quality target/,
    );
    expect(screen.getByLabelText('Retry GPS Location')).toBeOnTheScreen();
    expect(screen.getByLabelText('Open online manual map')).toBeOnTheScreen();

    await goToStep(5);
    expect(screen.queryByTestId('field-report.ready.final_coordinates')).not.toBeOnTheScreen();
    expect(screen.queryByTestId('field-report.ready.location_source')).not.toBeOnTheScreen();
    expect(screen.queryByTestId('field-report.ready.gps_accuracy')).not.toBeOnTheScreen();
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

    await goToStep(4);
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

    await goToStep(4);
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

    await goToStep(4);
    expect(screen.getByTestId('field-report.gps-status')).toHaveTextContent(
      /permission was denied/,
    );
    await goToStep(2);
    expect(screen.getByTestId('field-report.farmer-name-input')).toHaveProp(
      'value',
      'Maria Santos',
    );
    await goToStep(4);
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

    await goToStep(4);
    expect(screen.getByTestId('field-report.manual-location')).toHaveTextContent(
      'Manual map · 14.071000, 120.635000 · GPS accuracy not applicable',
    );
    expect(screen.getByTestId('field-report.gps-evidence')).toHaveTextContent(/±38 m/);
  });

  it('selects a barangay from the searchable picker', async () => {
    await render(<FieldReportScreen />);

    await goToStep(2);
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

    await goToStep(2);
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

    await goToStep(2);
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

    await goToStep(2);
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
        affectedAreaMeasurement: 'measured',
        affectedPortionPercent: 30,
        affectedPortionMeasurement: 'measured',
      }),
    );
  });

  it('blocks Draft save with an inline error when a number is invalid', async () => {
    await render(<FieldReportScreen />);

    await goToStep(2);
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
    await goToStep(2);
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
    await goToStep(5);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Finalize Field Report'));
    });

    expect(mockFinalize).toHaveBeenCalledWith(
      expectFormValues({
        affectedAreaHectares: 1.25,
        affectedAreaMeasurement: 'measured',
        affectedPortionPercent: 40,
        affectedPortionMeasurement: 'measured',
        barangay: 'Wawa',
        farmerOrFarmOwnerName: 'Maria Santos',
      }),
    );
  });

  it('requires an explicit measured or not-measured decision before finalizing', async () => {
    await render(<FieldReportScreen />);
    await goToStep(5);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Finalize Field Report'));
    });

    expect(mockFinalize).not.toHaveBeenCalled();
    expect(
      screen.getByText('Enter the affected area, or mark it as Not measured.'),
    ).toBeOnTheScreen();
    expect(
      screen.getByText(
        'Enter the estimated affected portion, or mark it as Not measured.',
      ),
    ).toBeOnTheScreen();
  });

  it('finalizes with explicit not-measured provenance instead of a guessed number', async () => {
    mockFinalize.mockResolvedValueOnce(
      draft({ authoringState: 'finalized', syncStatus: 'pending' }),
    );

    await render(<FieldReportScreen />);

    await goToStep(2);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Affected area: Not measured'));
      fireEvent.press(
        screen.getByLabelText('Estimated affected portion: Not measured'),
      );
    });
    await goToStep(5);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Finalize Field Report'));
    });

    expect(mockFinalize).toHaveBeenCalledWith(
      expect.objectContaining({
        affectedAreaHectares: null,
        affectedAreaMeasurement: 'not_measured',
        affectedPortionPercent: null,
        affectedPortionMeasurement: 'not_measured',
      }),
    );
  });

  it('restores explicit not-measured choices when reopening a draft', async () => {
    mockDraftState = {
      ...mockDraftState,
      data: draft({
        affectedAreaMeasurement: 'not_measured',
        affectedAreaMeasurementExplicit: true,
        affectedPortionMeasurement: 'not_measured',
        affectedPortionMeasurementExplicit: true,
      }),
    };

    await render(<FieldReportScreen />);

    await goToStep(2);
    expect(
      screen.getByLabelText('Affected area: Not measured'),
    ).toHaveProp('accessibilityState', { selected: true });
    expect(
      screen.getByLabelText('Estimated affected portion: Not measured'),
    ).toHaveProp('accessibilityState', { selected: true });
  });

  it('shows a possible recent match without blocking a new submission', async () => {
    mockPossibleRecentMatchState = {
      match: possibleRecentMatch,
      unavailable: false,
      loading: false,
    };
    mockFinalize.mockResolvedValueOnce(
      draft({
        authoringState: 'finalized',
        syncStatus: 'pending',
        submittedAt: '2026-08-10T03:00:00.000Z',
      }),
    );

    await render(<FieldReportScreen />);
    await act(async () => undefined);

    await goToStep(5);
    expect(screen.getByTestId('field-report.possible-match-warning')).toHaveTextContent(
      /Possible recent match.*only a possible match, not a duplicate decision/s,
    );
    await goToStep(2);
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
    await goToStep(5);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Finalize Field Report'));
    });

    expect(mockFinalize).toHaveBeenCalledWith(
      expectFormValues({
        affectedAreaHectares: 0.5,
        affectedAreaMeasurement: 'measured',
        affectedPortionPercent: 30,
        affectedPortionMeasurement: 'measured',
      }),
    );
    expect(mockSyncNow).toHaveBeenCalledWith('after-save');
  });

  it('starts foreground synchronization after successful local finalization', async () => {
    const finalized = draft({
      authoringState: 'finalized',
      syncStatus: 'pending',
      submittedAt: '2026-08-10T03:00:00.000Z',
    });
    mockFinalize.mockResolvedValueOnce(finalized);

    await render(<FieldReportScreen />);
    await goToStep(2);
    await act(async () => {
      fireEvent.changeText(screen.getByTestId('field-report.affected-area-input'), '0.5');
    });
    await act(async () => {
      fireEvent.changeText(screen.getByTestId('field-report.affected-portion-input'), '30');
    });
    await goToStep(5);
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

    await goToStep(5);
    expect(screen.queryByTestId('field-report.offline-finalize-block')).not.toBeOnTheScreen();
    expect(screen.getByLabelText('Finalize Field Report')).not.toBeDisabled();
    await goToStep(2);
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
    await goToStep(5);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Finalize Field Report'));
    });

    expect(mockFinalize).toHaveBeenCalledWith(
      expectFormValues({
        affectedAreaHectares: 0.5,
        affectedAreaMeasurement: 'measured',
        affectedPortionPercent: 30,
        affectedPortionMeasurement: 'measured',
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

    await goToStep(5);
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
        affectedAreaMeasurement: 'measured',
        affectedPortionPercent: 30,
        affectedPortionMeasurement: 'measured',
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

    expect(screen.getByText('Finalized · Waiting to sync')).toBeOnTheScreen();
    expect(
      screen.getByText(
        'This report is finalized locally. Current synchronization status: Waiting to sync.',
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
    expect(screen.getByText('Finalized · Waiting to sync')).toBeOnTheScreen();
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
        affectedAreaMeasurement: 'measured',
        affectedPortionPercent: 30,
        affectedPortionMeasurement: 'measured',
        updatedAt: '2026-08-10T01:05:00.000Z',
      }),
      saved: true,
    };

    await render(<FieldReportScreen />);

    await act(async () => undefined);

    await goToStep(2);
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
    await goToStep(5);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Show Technical details'));
    });
    expect(screen.getByText(REPORT_ID)).toBeOnTheScreen();
    expect(screen.getByTestId('field-report.saved')).toHaveTextContent(
      'Draft saved on this device.',
    );
  });

  it('collects optional more-details values into the Draft save', async () => {
    await render(<FieldReportScreen />);

    await goToStep(5);
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
  it('lists every real blocker in one Ready to submit checklist', async () => {
    mockDraftState = {
      ...mockDraftState,
      data: draft({
        affectedAreaHectares: null,
        affectedAreaMeasurement: 'not_measured',
        affectedPortionPercent: null,
        affectedPortionMeasurement: 'not_measured',
        affectedAreaMeasurementExplicit: true,
        affectedPortionMeasurementExplicit: true,
        barangay: null,
        farmerOrFarmOwnerName: null,
        finalLatitude: null,
        finalLongitude: null,
        gpsAccuracy: null,
        locationSource: null,
        locationUnavailableReason: null,
      }),
    };

    await render(<FieldReportScreen />);
    await act(async () => undefined);

    await goToStep(5);
    const checklist = screen.getByTestId('field-report.ready-to-submit');
    expect(checklist).toHaveTextContent(/requirements still block finalizing/);
    expect(screen.getByTestId('field-report.ready.farmer_or_farm_owner_name')).toBeOnTheScreen();
    expect(screen.getByTestId('field-report.ready.barangay')).toBeOnTheScreen();
    expect(screen.getByTestId('field-report.ready.final_coordinates')).toBeOnTheScreen();
    // D-01 removes the measurement blockers once they are explicitly declared.
    expect(screen.queryByTestId('field-report.ready.affected_area_hectares')).not.toBeOnTheScreen();
    expect(screen.queryByTestId('field-report.ready.affected_portion_percent')).not.toBeOnTheScreen();
    expect(screen.getByTestId('field-report.ready.complete-count')).toBeOnTheScreen();
  });

  it('records an unavailable location with a reason instead of forcing coordinates', async () => {
    await render(<FieldReportScreen />);
    await act(async () => undefined);

    await goToStep(4);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('I cannot capture a location'));
    });

    expect(screen.getByTestId('field-report.mark-location-unavailable')).toBeDisabled();

    await act(async () => {
      fireEvent.press(
        screen.getByLabelText('Offline, so the online map could not be used'),
      );
    });
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Send without an exact location'));
    });

    expect(mockMarkLocationUnavailable).toHaveBeenCalledWith('offline_no_map');
  });

  it('can recover from unavailable provenance into location capture', async () => {
    mockDraftState = {
      ...mockDraftState,
      data: draft({
        locationSource: 'unavailable',
        locationUnavailableReason: 'offline_no_map',
      }),
    };

    await render(<FieldReportScreen />);
    await goToStep(4);
    await fireEvent.press(screen.getByLabelText('Capture a location instead'));

    expect(mockClearLocationUnavailable).toHaveBeenCalledTimes(1);
  });

  it('shows the recorded unavailable location with its reason', async () => {
    mockDraftState = {
      ...mockDraftState,
      data: draft({
        finalLatitude: null,
        finalLongitude: null,
        gpsAccuracy: null,
        locationSource: 'unavailable',
        locationUnavailableReason: 'low_accuracy',
      }),
    };

    await render(<FieldReportScreen />);
    await act(async () => undefined);

    await goToStep(4);
    expect(screen.getByTestId('field-report.location-unavailable')).toHaveTextContent(
      /GPS never reached a usable accuracy/,
    );
    expect(screen.getByLabelText('Capture a location instead')).toBeOnTheScreen();
  });

  describe('stepped wizard navigation and requirements handling', () => {
    it('supports sequential navigation between steps with Next and Prev buttons', async () => {
      await render(<FieldReportScreen />);
      await act(async () => undefined);

      expect(screen.getByTestId('field-report.wizard-step-title')).toHaveTextContent(
        'Step 1 of 5: Scan evidence',
      );
      expect(screen.queryByTestId('field-report.wizard-prev')).not.toBeOnTheScreen();
      expect(screen.getByTestId('field-report.wizard-next')).toBeOnTheScreen();

      await act(async () => {
        fireEvent.press(screen.getByTestId('field-report.wizard-next'));
      });
      expect(screen.getByTestId('field-report.wizard-step-title')).toHaveTextContent(
        'Step 2 of 5: Farm & area',
      );
      expect(screen.getByTestId('field-report.wizard-prev')).toBeOnTheScreen();

      await act(async () => {
        fireEvent.press(screen.getByTestId('field-report.wizard-prev'));
      });
      expect(screen.getByTestId('field-report.wizard-step-title')).toHaveTextContent(
        'Step 1 of 5: Scan evidence',
      );
    });

    it('allows non-blocking Next navigation even when required fields are empty (W-2)', async () => {
      await render(<FieldReportScreen />);
      await act(async () => undefined);

      await goToStep(2);
      expect(screen.getByTestId('field-report.wizard-step-title')).toHaveTextContent(
        'Step 2 of 5: Farm & area',
      );
      await act(async () => {
        fireEvent.press(screen.getByTestId('field-report.wizard-next'));
      });
      expect(screen.getByTestId('field-report.wizard-step-title')).toHaveTextContent(
        'Step 3 of 5: Your observation',
      );
    });

    it('indicates incomplete steps on tab pills (W-2)', async () => {
      await render(<FieldReportScreen />);
      await act(async () => undefined);

      expect(screen.getByTestId('field-report.step-2')).toHaveProp(
        'accessibilityLabel',
        'Step 2: Farm & area (incomplete)',
      );
      expect(screen.getByTestId('field-report.step-4')).toHaveProp(
        'accessibilityLabel',
        'Step 4: Location (incomplete)',
      );
      expect(screen.getByTestId('field-report.step-5')).toHaveProp(
        'accessibilityLabel',
        'Step 5: Review & submit (incomplete)',
      );
    });

    it('renders step-aware labels to prevent stepper overflow', async () => {
      await render(<FieldReportScreen />);
      await act(async () => undefined);

      // On Step 1: Step 1 shows full label, others show step number
      expect(screen.getByTestId('field-report.step-1')).toHaveTextContent('1. Evidence');
      expect(screen.getByTestId('field-report.step-2')).toHaveTextContent('2');
      expect(screen.getByTestId('field-report.step-3')).toHaveTextContent('3');

      // Navigate to Step 3: Step 3 shows condensed full label "3. Observe"
      await goToStep(3);
      expect(screen.getByTestId('field-report.step-1')).toHaveTextContent('1');
      expect(screen.getByTestId('field-report.step-3')).toHaveTextContent('3. Observe');
      expect(screen.getByTestId('field-report.step-4')).toHaveTextContent('4');
    });

    it('jumps directly to owning step when tapping a missing requirement on Step 5 (W-3)', async () => {
      await render(<FieldReportScreen />);
      await act(async () => undefined);

      await goToStep(5);
      expect(screen.getByTestId('field-report.ready.farmer_or_farm_owner_name')).toBeOnTheScreen();

      await act(async () => {
        fireEvent.press(screen.getByTestId('field-report.ready.farmer_or_farm_owner_name'));
      });
      expect(screen.getByTestId('field-report.wizard-step-title')).toHaveTextContent(
        'Step 2 of 5: Farm & area',
      );
      expect(screen.getByTestId('field-report.farmer-name-input')).toBeOnTheScreen();

      await goToStep(5);
      await act(async () => {
        fireEvent.press(screen.getByTestId('field-report.ready.final_coordinates'));
      });
      expect(screen.getByTestId('field-report.wizard-step-title')).toHaveTextContent(
        'Step 4 of 5: Location',
      );
      expect(screen.getByLabelText('Capture GPS Location')).toBeOnTheScreen();
    });

    it('holds all 20 submission requirements inside disclosure on Step 5 (W-3, Rule 4)', async () => {
      await render(<FieldReportScreen />);
      await act(async () => undefined);

      await goToStep(5);
      await act(async () => {
        fireEvent.press(screen.getByLabelText('Show All requirements (20)'));
      });

      const disclosure = within(screen.getByTestId('field-report.all-requirements-disclosure'));
      expect(disclosure.getByText('Original scan image')).toBeOnTheScreen();
      expect(disclosure.getByText('Farmer or farm reference')).toBeOnTheScreen();
      expect(disclosure.getByText('Final coordinates')).toBeOnTheScreen();
      expect(disclosure.getByText('Observation time')).toBeOnTheScreen();
      expect(disclosure.getByText('Affected area (hectares)')).toBeOnTheScreen();
      expect(disclosure.getByText('Device-reported GPS accuracy')).toBeOnTheScreen();
    });

    it('keeps Report ID UUID in Technical details disclosure and off main scroll (E11)', async () => {
      await render(<FieldReportScreen />);
      await act(async () => undefined);

      expect(screen.queryByText(REPORT_ID)).not.toBeOnTheScreen();

      await goToStep(5);
      expect(screen.queryByText(REPORT_ID)).not.toBeOnTheScreen();

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Show Technical details'));
      });
      expect(screen.getByText(REPORT_ID)).toBeOnTheScreen();
    });
  });

  describe('cancel and return home', () => {
    it('opens cancel dialog from header close button', async () => {
      await render(<FieldReportScreen />);
      await act(async () => undefined);

      expect(screen.queryByTestId('field-report.cancel-dialog')).not.toBeOnTheScreen();
      await act(async () => {
        fireEvent.press(screen.getByTestId('field-report.header-close'));
      });

      expect(screen.getByTestId('field-report.cancel-dialog')).toBeOnTheScreen();
      expect(screen.getByText('Cancel field report?')).toBeOnTheScreen();
      expect(screen.getByText('Keep draft')).toBeOnTheScreen();
      expect(screen.getByText('Discard draft')).toBeOnTheScreen();
    });

    it('opens cancel dialog from on-screen Cancel Report button', async () => {
      await render(<FieldReportScreen />);
      await act(async () => undefined);

      expect(screen.queryByTestId('field-report.cancel-dialog')).not.toBeOnTheScreen();
      await act(async () => {
        fireEvent.press(screen.getByTestId('field-report.cancel'));
      });

      expect(screen.getByTestId('field-report.cancel-dialog')).toBeOnTheScreen();
    });

    it('saves draft and routes home when Keep draft is chosen', async () => {
      await render(<FieldReportScreen />);
      await act(async () => undefined);

      await act(async () => {
        fireEvent.press(screen.getByTestId('field-report.cancel'));
      });
      await act(async () => {
        fireEvent.press(screen.getByTestId('field-report.cancel-dialog.cancel'));
      });

      expect(mockSave).toHaveBeenCalledTimes(1);
      expect(mockDiscardDraft).not.toHaveBeenCalled();
      expect(router.replace).toHaveBeenCalledWith('/home');
    });

    it('discards draft and routes home when Discard draft is chosen', async () => {
      await render(<FieldReportScreen />);
      await act(async () => undefined);

      await act(async () => {
        fireEvent.press(screen.getByTestId('field-report.cancel'));
      });
      await act(async () => {
        fireEvent.press(screen.getByTestId('field-report.cancel-dialog.confirm'));
      });

      expect(mockDiscardDraft).toHaveBeenCalledTimes(1);
      expect(router.replace).toHaveBeenCalledWith('/home');
    });

    it('displays visible confirmation toast when draft is saved with barangay only', async () => {
      mockDraftState.data = draft({
        authoringState: 'draft',
        barangay: 'Wawa',
        farmerOrFarmOwnerName: null,
      });
      await render(
        <ToastProvider>
          <FieldReportScreen />
        </ToastProvider>,
      );
      await act(async () => undefined);

      await act(async () => {
        fireEvent.press(screen.getByTestId('field-report.save-draft'));
      });

      expect(mockSave).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('app-toast')).toBeOnTheScreen();
      expect(screen.getByTestId('app-toast')).toHaveTextContent('Draft saved');
    });

    it('hides the header close button when the report is finalized', async () => {
      mockDraftState.data = draft({
        authoringState: 'finalized',
        syncStatus: 'pending',
      });
      await render(
        <ToastProvider>
          <FieldReportScreen />
        </ToastProvider>,
      );
      await act(async () => undefined);

      expect(screen.queryByTestId('field-report.header-close')).toBeNull();
    });
  });
});
