import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import RecordDetailsScreen from '@/app/record-details';
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
  managedImageUri: `file:///documents/caneguard/scan-images/${RECORD_ID}.jpg`,
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

    await fireEvent.press(screen.getByLabelText('Show Technical details'));
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

    await fireEvent.press(screen.getByLabelText('Show Technical details'));
    expect(useScanRecordDetails).toHaveBeenCalledWith(RECORD_ID);
    expect(screen.getByText('Possible result: Rust')).toBeOnTheScreen();
    expect(screen.getByTestId('records.result-title')).toHaveTextContent(
      'Possible result: Rust',
    );
    expect(screen.getByText('82% AI confidence')).toBeOnTheScreen();
    expect(screen.getByText('Checklist consistent')).toBeOnTheScreen();
    expect(screen.getByText('Moderate')).toBeOnTheScreen();
    expect(
      screen.getByText('Rust-colored or orange-brown spots or pustules'),
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
    expect(screen.getByText('Possible result: Rust')).toBeOnTheScreen();
  });

  it('requires confirmation and deletes before returning to records', async () => {
    await render(<RecordDetailsScreen />);
    await fireEvent.press(
      screen.getByLabelText('Delete this local record and saved image'),
    );

    const confirmation = jest.mocked(Alert.alert).mock.calls[0];
    expect(confirmation[0]).toBe('Delete local record?');
    expect(confirmation[1]).toContain('saved image');
    expect(confirmation[1]).toContain('Field Report');
    const deleteAction = confirmation[2]?.find(
      (action) => action.style === 'destructive',
    );

    await act(async () => {
      deleteAction?.onPress?.();
    });

    expect(mockDeleteScanRecord).toHaveBeenCalledWith(
      mockDatabase,
      RECORD_ID,
      SUBMITTER_ID,
    );
    expect(mockRouterReplace).toHaveBeenCalledWith('/records');
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

    await fireEvent.press(screen.getByLabelText('Show Technical details'));
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
