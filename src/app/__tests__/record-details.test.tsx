import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import RecordDetailsScreen from '@/app/record-details';
import type { ScanRecordDetails } from '@/features/records/domain/recordTypes';
import { useScanRecordDetails } from '@/features/records/hooks/useRecords';
import { deleteScanRecord } from '@/features/records/services/deleteScanRecord';

const RECORD_ID = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2';
const mockRefresh = jest.fn(async () => undefined);
const mockDatabase = {};
let mockDetailsState: ReturnType<typeof useScanRecordDetails>;

jest.mock('@/database/DatabaseProvider', () => ({
  useCaneGuardDatabase: () => mockDatabase,
}));
jest.mock('@/features/records/hooks/useRecords', () => ({
  useScanRecordDetails: jest.fn(() => mockDetailsState),
}));
jest.mock('@/features/records/services/deleteScanRecord', () => ({
  deleteScanRecord: jest.fn(),
}));
jest.mock('@/features/sync/hooks/useSync', () => ({
  useSync: () => ({
    isOnline: true,
    isSyncing: false,
    retryRecord: jest.fn(async () => null),
  }),
}));

const mockUseLocalSearchParams = jest.mocked(useLocalSearchParams);
const mockDeleteScanRecord = jest.mocked(deleteScanRecord);
const mockRouterReplace = router.replace as jest.Mock;
const DETAILS: ScanRecordDetails = {
  id: RECORD_ID,
  managedImageUri: `file:///documents/caneguard/scan-images/${RECORD_ID}.jpg`,
  predictedLabel: 'rust',
  confidence: 0.82,
  barangay: null,
  syncStatus: 'pending',
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
    mockUseLocalSearchParams.mockReturnValue({ id: RECORD_ID });
    mockDetailsState = {
      data: DETAILS,
      errorMessage: null,
      loading: false,
      refresh: mockRefresh,
    };
    mockDeleteScanRecord.mockResolvedValue({
      id: RECORD_ID,
      imageCleanupError: null,
    });
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
  });

  it('loads complete stored metadata by UUID', async () => {
    await render(<RecordDetailsScreen />);

    expect(useScanRecordDetails).toHaveBeenCalledWith(RECORD_ID);
    expect(screen.getByText('Possible result: Rust')).toBeOnTheScreen();
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
    expect(
      screen.getByText('Pending upload'),
    ).toBeOnTheScreen();
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
    const deleteAction = confirmation[2]?.find(
      (action) => action.style === 'destructive',
    );

    await act(async () => {
      deleteAction?.onPress?.();
    });

    expect(mockDeleteScanRecord).toHaveBeenCalledWith(mockDatabase, RECORD_ID);
    expect(mockRouterReplace).toHaveBeenCalledWith('/records');
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
