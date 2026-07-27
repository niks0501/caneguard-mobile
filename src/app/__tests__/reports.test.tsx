import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import ReportsScreen from '@/app/reports';
import type { LocalReportSummary } from '@/features/records/domain/recordTypes';
import { useLocalReport } from '@/features/reports/hooks/useLocalReport';

const mockRefresh = jest.fn(async () => undefined);
let mockReportState: ReturnType<typeof useLocalReport>;

jest.mock('@/features/reports/hooks/useLocalReport', () => ({
  useLocalReport: jest.fn(() => mockReportState),
}));

const mockRouterPush = router.push as jest.Mock;
const SUMMARY: LocalReportSummary = {
  totalSavedScans: 5,
  healthyPredictions: 2,
  possibleDiseasePredictions: 3,
  pendingSyncRecords: 4,
  lowScorePredictions: 2,
  recordsByLabel: [
    { label: 'healthy', count: 2 },
    { label: 'rust', count: 2 },
    { label: 'mosaic', count: 1 },
  ],
  recentRecords: [
    {
      id: '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2',
      managedImageUri: 'file:///documents/caneguard/scan-images/record.jpg',
      predictedLabel: 'rust',
      confidence: 0.82,
      barangay: null,
      syncStatus: 'local_only',
      createdAt: '2026-07-25T05:30:00.000Z',
    },
  ],
};

describe('ReportsScreen', () => {
  beforeEach(() => {
    mockReportState = {
      data: SUMMARY,
      errorMessage: null,
      loading: false,
      refresh: mockRefresh,
    };
  });

  it('renders SQL-backed local summary semantics and stored labels', async () => {
    await render(<ReportsScreen />);

    expect(screen.getByLabelText('Saved observations: 5')).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Possible disease results: 3'),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText('Healthy predictions: 2')).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Awaiting synchronization: 4'),
    ).toBeOnTheScreen();
    expect(screen.getByText('Healthy')).toBeOnTheScreen();
    expect(screen.getByText('Mosaic')).toBeOnTheScreen();
    expect(screen.getByText('Rust')).toBeOnTheScreen();
    expect(screen.getByText('2 low top-score records')).toBeOnTheScreen();
    expect(
      screen.getByText(/Prototype presentation rule: highest class score below 50%/),
    ).toBeOnTheScreen();
    expect(screen.queryByText('Smut')).not.toBeOnTheScreen();
    expect(screen.queryByText('Downy Mildew')).not.toBeOnTheScreen();
    expect(screen.queryByText('Sync to MAO Now')).not.toBeOnTheScreen();
    expect(screen.queryByText('Recent submissions')).not.toBeOnTheScreen();
  });

  it('opens a recent local record by UUID', async () => {
    await render(<ReportsScreen />);

    await fireEvent.press(
      screen.getByLabelText(/Open Possible result: Rust record saved/),
    );
    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: '/record-details',
      params: { id: SUMMARY.recentRecords[0].id },
    });
  });

  it('shows zero values and a scan action without demonstration data', async () => {
    mockReportState = {
      data: {
        totalSavedScans: 0,
        healthyPredictions: 0,
        possibleDiseasePredictions: 0,
        pendingSyncRecords: 0,
        lowScorePredictions: 0,
        recordsByLabel: [],
        recentRecords: [],
      },
      errorMessage: null,
      loading: false,
      refresh: mockRefresh,
    };

    await render(<ReportsScreen />);

    expect(screen.getByText('No saved observations yet')).toBeOnTheScreen();
    expect(screen.getAllByText('0')).toHaveLength(4);
    await fireEvent.press(screen.getByText('Start Scan'));
    expect(mockRouterPush).toHaveBeenCalledWith('/scan');
  });

  it('supports loading and retryable query-error states', async () => {
    mockReportState = {
      data: null,
      errorMessage: null,
      loading: true,
      refresh: mockRefresh,
    };
    const view = await render(<ReportsScreen />);
    expect(screen.getByLabelText('Loading local report')).toBeOnTheScreen();

    mockReportState = {
      data: null,
      errorMessage: 'Saved records could not be loaded. Please try again.',
      loading: false,
      refresh: mockRefresh,
    };
    await view.rerender(<ReportsScreen />);
    expect(screen.getByText('Report unavailable')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Try Again'));
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });
});
