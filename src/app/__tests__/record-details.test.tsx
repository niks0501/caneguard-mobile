import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import RecordDetailsScreen from '@/app/record-details';
import { ToastProvider } from '@/components/ui/Toast';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { ScanRecordDetails } from '@/features/records/domain/recordTypes';
import { useScanRecordDetails } from '@/features/records/hooks/useRecords';
import { deleteScanRecord } from '@/features/records/services/deleteScanRecord';
import type { FieldReport } from '@/features/reports/domain/fieldReportTypes';

const RECORD_ID = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2';
const SUBMITTER_ID = 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17';
const mockRefresh = jest.fn(async () => undefined);
const mockDatabase = {};
let mockDetailsState: ReturnType<typeof useScanRecordDetails>;
let mockFieldReportState: {
  data: FieldReport | null;
  errorMessage: string | null;
  hasOtherOwnerReport: boolean;
  loading: boolean;
  refresh: jest.Mock;
};

jest.mock('@/database/DatabaseProvider', () => ({
  useCaneGuardDatabase: () => mockDatabase,
}));
jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));
jest.mock('@/features/records/hooks/useRecords', () => ({
  useScanRecordDetails: jest.fn(() => mockDetailsState),
}));
jest.mock('@/features/records/services/deleteScanRecord', () => ({
  deleteScanRecord: jest.fn(),
}));
jest.mock('@/features/reports/hooks/useFieldReportDraft', () => ({
  useFieldReportForScan: () => mockFieldReportState,
}));
jest.mock('@/features/sync/hooks/useSync', () => ({
  useSync: () => ({
    isOnline: true,
    isSyncing: false,
    retryReport: jest.fn(async () => null),
  }),
}));

const mockUseLocalSearchParams = jest.mocked(useLocalSearchParams);
const mockDeleteScanRecord = jest.mocked(deleteScanRecord);
const mockRouterReplace = router.replace as jest.Mock;
const mockRouterPush = router.push as jest.Mock;
const DETAILS: ScanRecordDetails = {
  authorityReview: null,
  id: RECORD_ID,
  ownerIdentity: SUBMITTER_ID,
  managedImageUri: `file:///documents/caneguard/scan-images/${RECORD_ID}.jpg`,
  submissionImageUri: `file:///documents/caneguard/scan-images/${RECORD_ID}.jpg`,
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
  reportedSeverity: 'Moderate',
  decisionSupportWording: 'Possible result only. This output does not confirm a disease.',
  modelVersion: 'v0.1-baseline',
  preprocessMs: 4.25,
  inferenceMs: 8.5,
  totalMs: 12.75,
  remoteId: null,
  updatedAt: '2026-07-25T05:30:00.000Z',
  classScores: [
    { label: 'healthy', score: 0.05 },
    { label: 'mosaic', score: 0.13 },
    { label: 'rust', score: 0.82 },
  ],
  symptoms: ['rust'],
  qualityWarnings: ['too-dark'],
  syncAttemptCount: 0,
  lastSyncErrorCode: null,
  lastSyncAttemptAt: null,
  lastSyncedAt: null,
};

describe('RecordDetailsScreen', () => {
  beforeEach(() => {
    jest.mocked(useAuth).mockReturnValue({
      user: { uuid: SUBMITTER_ID },
    } as never);
    mockUseLocalSearchParams.mockReturnValue({ id: RECORD_ID });
    mockDetailsState = {
      data: DETAILS,
      errorMessage: null,
      loading: false,
      refresh: mockRefresh,
    };
    mockFieldReportState = {
      data: null,
      errorMessage: null,
      hasOtherOwnerReport: false,
      loading: false,
      refresh: jest.fn(),
    };
    mockDeleteScanRecord.mockResolvedValue({
      id: RECORD_ID,
      imageCleanupError: null,
    });
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
  });

  it('creates or resumes the Field Report associated with this scan', async () => {
    const view = await render(<RecordDetailsScreen />);

    await fireEvent.press(screen.getByLabelText('Create Field Report draft'));
    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: '/field-report',
      params: { scanRecordId: RECORD_ID },
    });

    mockFieldReportState = {
      ...mockFieldReportState,
      data: {
        authorityReview: null,
        id: '7ea3e6f0-b893-4fd3-b414-0b797e62ec8e',
        scanRecordId: RECORD_ID,
        authoringState: 'draft',
        farmerOrFarmOwnerName: 'Maria Santos',
        province: 'Batangas',
        municipality: 'Nasugbu',
        barangay: null,
        affectedAreaHectares: null,
        affectedAreaMeasurement: 'not_measured',
        affectedPortionMeasurement: 'not_measured',
        locationUnavailableReason: null,
        affectedPortionPercent: null,
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
        observedAt: DETAILS.createdAt,
        remoteId: null,
        submittedAt: null,
        submitterIdentity: 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17',
        submitterRole: 'field_reporter',
        syncAttemptCount: 0,
        syncStatus: 'local_only',
        createdAt: '2026-08-10T01:00:00.000Z',
        updatedAt: '2026-08-10T01:05:00.000Z',
      },
    };
    await view.rerender(<RecordDetailsScreen />);
    expect(screen.getByLabelText('Resume Field Report draft')).toBeOnTheScreen();
  });

  it('opens a finalized Field Report without presenting it as an editable Draft', async () => {
    mockFieldReportState = {
      ...mockFieldReportState,
      data: {
        authorityReview: null,
        id: '7ea3e6f0-b893-4fd3-b414-0b797e62ec8e',
        scanRecordId: RECORD_ID,
        authoringState: 'finalized',
        affectedAreaMeasurement: 'not_measured',
        affectedPortionMeasurement: 'not_measured',
        locationUnavailableReason: null,
        farmerOrFarmOwnerName: 'Maria Santos',
        province: 'Batangas',
        municipality: 'Nasugbu',
        barangay: 'Lumbangan',
        affectedAreaHectares: null,
        affectedPortionPercent: null,
        caneClass: null,
        cropAge: null,
        fieldNotes: null,
        mismatchReported: null,
        reporterObservationText: null,
        reporterSuspectedCondition: null,
        sugarcaneVariety: null,
        finalLatitude: 14.0667,
        finalLongitude: 120.6319,
        locationSource: 'gps',
        lastSyncAttemptAt: null,
        lastSyncErrorCode: null,
        lastSyncedAt: null,
        manualLocationSelectedAt: null,
        gpsAccuracy: 4.2,
        gpsAttemptAccuracy: 4.2,
        gpsAttemptLatitude: 14.0667,
        gpsAttemptLongitude: 120.6319,
        gpsAttemptedAt: '2026-08-10T01:04:00.000Z',
        gpsCaptureOutcome: 'resolved',
        gpsOutcomeRecordedAt: '2026-08-10T01:04:00.000Z',
        observedAt: DETAILS.createdAt,
        remoteId: null,
        submittedAt: '2026-08-10T03:00:00.000Z',
        submitterIdentity: 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17',
        submitterRole: 'field_reporter',
        syncAttemptCount: 0,
        syncStatus: 'pending',
        createdAt: '2026-08-10T01:00:00.000Z',
        updatedAt: '2026-08-10T03:00:00.000Z',
      },
    };
    mockDetailsState = {
      ...mockDetailsState,
      data: {
        ...DETAILS,
        lastSyncErrorCode: 'NETWORK_UNAVAILABLE',
        lastSyncedAt: '2026-08-10T03:01:00.000Z',
        remoteId: 'legacy-remote-id',
      },
    };

    const view = await render(<RecordDetailsScreen />);

    await fireEvent.press(screen.getByLabelText('Show Saved record details'));
    expect(screen.getByLabelText('Open finalized Field Report')).toBeOnTheScreen();
    expect(screen.getByText('View Finalized Report')).toBeOnTheScreen();
    expect(
      screen.getByText('This Field Report is finalized locally: Waiting to sync.'),
    ).toBeOnTheScreen();
    expect(screen.getByText('Not assigned')).toBeOnTheScreen();
    expect(screen.getByText('Not yet synchronized')).toBeOnTheScreen();
    expect(
      screen.queryByText('The connection was unavailable. Retry when online.'),
    ).not.toBeOnTheScreen();
    expect(screen.queryByText('Resume Draft')).not.toBeOnTheScreen();

    mockFieldReportState = {
      ...mockFieldReportState,
      data: { ...mockFieldReportState.data!, syncStatus: 'synced' },
    };
    await view.rerender(<RecordDetailsScreen />);
    expect(
      screen.getByText('This Field Report is finalized locally: Synced.'),
    ).toBeOnTheScreen();
  });

  it('does not offer a Field Report action owned by another submitter', async () => {
    mockFieldReportState = {
      ...mockFieldReportState,
      hasOtherOwnerReport: true,
    };

    await render(<RecordDetailsScreen />);

    expect(
      screen.getByLabelText('Field Report owned by another submitter'),
    ).toBeDisabled();
    expect(screen.getByText('Report Unavailable')).toBeOnTheScreen();
    expect(
      screen.getByText(/belongs to another submitter/),
    ).toBeOnTheScreen();
    expect(screen.queryByLabelText('Create Field Report draft')).not.toBeOnTheScreen();
  });

  it('loads complete stored metadata by UUID', async () => {
    await render(<RecordDetailsScreen />);

    await fireEvent.press(screen.getByLabelText('Show Model details'));
    expect(useScanRecordDetails).toHaveBeenCalledWith(RECORD_ID);
    expect(screen.getByText('Possible Condition: Rust')).toBeOnTheScreen();
    expect(screen.getByTestId('records.result-title')).toHaveTextContent(
      'Possible Condition: Rust',
    );
    expect(screen.getByText('82% AI confidence')).toBeOnTheScreen();
    expect(screen.getByText('Checklist consistent')).toBeOnTheScreen();
    expect(screen.getByText('Moderate')).toBeOnTheScreen();
    expect(
      screen.getByText('Raised rust-colored or orange-brown spots or pustules, mainly on the leaf underside'),
    ).toBeOnTheScreen();
    expect(
      screen.getByText(
        'The image may be too dark. Retake the photo in better lighting for a more reliable input.',
      ),
    ).toBeOnTheScreen();
    expect(screen.getByText('v0.1-baseline')).toBeOnTheScreen();
    expect(screen.getByText('Local only')).toBeOnTheScreen();
  });

  it('keeps metadata visible when the managed image is missing', async () => {
    await render(<RecordDetailsScreen />);

    await act(() =>
      screen.getByLabelText('Saved sugarcane scan image').props.onError(),
    );

    expect(
      screen.getByLabelText(
        'Saved image unavailable; record metadata remains available',
      ),
    ).toBeOnTheScreen();
    expect(screen.getByText('Possible Condition: Rust')).toBeOnTheScreen();
  });

  it('requires one confirmation and deletes before returning to records', async () => {
    await render(
      <ToastProvider>
        <RecordDetailsScreen />
      </ToastProvider>,
    );
    await fireEvent.press(
      screen.getByLabelText('Delete this local record and saved image'),
    );

    // C3: exactly one in-app confirmation gate — no native Alert.
    expect(jest.mocked(Alert.alert)).not.toHaveBeenCalled();
    expect(screen.getByTestId('records.confirm-delete')).toBeOnTheScreen();
    expect(screen.getByTestId('records.confirm-delete')).toHaveTextContent(/cannot be undone/);

    await fireEvent.press(screen.getByTestId('records.confirm-delete.confirm'));

    expect(mockDeleteScanRecord).toHaveBeenCalledWith(
      mockDatabase,
      RECORD_ID,
      SUBMITTER_ID,
    );
    expect(screen.getByTestId('app-toast')).toBeOnTheScreen();
    expect(screen.getByTestId('app-toast')).toHaveTextContent('Record deleted');
    expect(mockRouterReplace).toHaveBeenCalledWith('/activity');
  });

  it('deletes nothing when the single delete confirmation is cancelled', async () => {
    await render(
      <ToastProvider>
        <RecordDetailsScreen />
      </ToastProvider>,
    );
    await fireEvent.press(
      screen.getByLabelText('Delete this local record and saved image'),
    );
    expect(screen.getByTestId('records.confirm-delete')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('records.confirm-delete.cancel'));

    expect(jest.mocked(Alert.alert)).not.toHaveBeenCalled();
    expect(mockDeleteScanRecord).not.toHaveBeenCalled();
    expect(screen.queryByTestId('records.confirm-delete')).toBeNull();
  });

  it('splits model and saved details into two counted disclosures', async () => {
    await render(<RecordDetailsScreen />);

    // Both disclosures replace the bare Technical details block.
    expect(screen.queryByText('Technical details')).toBeNull();
    expect(screen.getByText('Model details')).toBeOnTheScreen();
    expect(screen.getByText('Saved record details')).toBeOnTheScreen();
    expect(screen.getByText('All 7 model details')).toBeOnTheScreen();
    expect(screen.getByText('All 4 saved details')).toBeOnTheScreen();

    // Model rows stay behind their tap; the hero keeps the single answer.
    expect(screen.queryByText('v0.1-baseline')).not.toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Show Model details'));
    expect(screen.getByText('v0.1-baseline')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Rust score 82%')).not.toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Show All condition scores'));
    expect(screen.getByLabelText('Rust score 82%')).toBeOnTheScreen();

    // Saved rows live in the other disclosure.
    expect(screen.queryByText('Not assigned')).not.toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Show Saved record details'));
    expect(screen.getByText('Not assigned')).toBeOnTheScreen();
    expect(screen.getByText('Not yet synchronized')).toBeOnTheScreen();
  });

  it('caps long observation lists behind a Show remaining control', async () => {
    mockDetailsState = {
      ...mockDetailsState,
      data: {
        ...DETAILS,
        symptoms: ['rust', 'mosaic', 'smut', 'yellow-midrib'],
      },
    };
    await render(<RecordDetailsScreen />);

    expect(
      screen.getByText('Raised rust-colored or orange-brown spots or pustules, mainly on the leaf underside'),
    ).toBeOnTheScreen();
    expect(screen.getByText('Show remaining 1')).toBeOnTheScreen();
    expect(
      screen.queryByText('Bright yellow midrib on lower or older leaves, or yellowing spreading outward from the midrib'),
    ).not.toBeOnTheScreen();

    await fireEvent.press(
      screen.getByText('Show remaining 1'),
    );
    expect(screen.getByText('Show less')).toBeOnTheScreen();
    expect(
      screen.getByText('Bright yellow midrib on lower or older leaves, or yellowing spreading outward from the midrib'),
    ).toBeOnTheScreen();
  });

  it('preserves legacy synced identity without offering resubmission', async () => {
    mockDetailsState = {
      ...mockDetailsState,
      data: {
        ...DETAILS,
        syncStatus: 'synced',
        remoteId: 'legacy-remote-id',
        lastSyncedAt: '2026-07-25T06:00:00.000Z',
      },
    };

    await render(<RecordDetailsScreen />);

    await fireEvent.press(screen.getByLabelText('Show Saved record details'));
    expect(screen.getByText('Legacy Report Synced')).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Legacy report already synchronized'),
    ).toBeDisabled();
    expect(screen.getByText('legacy-remote-id')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Create Field Report draft')).not.toBeOnTheScreen();
  });

  it('offers an actionable draft for an older unsent scan', async () => {
    mockDetailsState = {
      ...mockDetailsState,
      data: { ...DETAILS, syncStatus: 'failed' },
    };

    await render(<RecordDetailsScreen />);
    await fireEvent.press(
      screen.getByLabelText('Complete legacy Field Report draft'),
    );

    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: '/field-report',
      params: { scanRecordId: RECORD_ID },
    });
  });

  it('shows a retryable record query error', async () => {
    mockDetailsState = {
      data: null,
      errorMessage: 'This saved record could not be found.',
      loading: false,
      refresh: mockRefresh,
    };

    await render(<RecordDetailsScreen />);

    expect(screen.getByText('Saved record unavailable')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Try Again'));
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });
});
