import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import RecordsScreen from '@/app/records';
import type { ScanRecordListItem } from '@/features/records/domain/recordTypes';
import { usePaginatedScanRecords } from '@/features/records/hooks/useRecords';

const mockRefresh = jest.fn(async () => undefined);
const mockLoadMore = jest.fn(async () => undefined);
let mockRecordsState: ReturnType<typeof usePaginatedScanRecords> = {
  data: [],
  errorMessage: null,
  hasMore: false,
  loading: false,
  loadingMore: false,
  loadMore: mockLoadMore,
  refresh: mockRefresh,
};

jest.mock('@/features/records/hooks/useRecords', () => ({
  usePaginatedScanRecords: jest.fn(() => mockRecordsState),
}));

const mockUsePaginatedScanRecords = jest.mocked(usePaginatedScanRecords);
const mockRouterPush = router.push as jest.Mock;
const RECORD: ScanRecordListItem = {
  id: '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2',
  managedImageUri: 'file:///documents/caneguard/scan-images/record.jpg',
  predictedLabel: 'rust',
  confidence: 0.82,
  barangay: null,
  syncStatus: 'local_only',
  createdAt: '2026-07-25T05:30:00.000Z',
};

describe('RecordsScreen', () => {
  beforeEach(() => {
    mockRecordsState = {
      data: [],
      errorMessage: null,
      hasMore: false,
      loading: false,
      loadingMore: false,
      loadMore: mockLoadMore,
      refresh: mockRefresh,
    };
  });

  it('shows the true empty state and starts a scan', async () => {
    await render(<RecordsScreen />);

    expect(screen.getByText('No saved records yet')).toBeOnTheScreen();
    expect(
      screen.getByText(
        'These records are stored on this device. CaneGuard is not yet connected to MAO.',
      ),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Start Scan'));
    expect(mockRouterPush).toHaveBeenCalledWith('/scan');
  });

  it('shows only supported Model v0 filters', async () => {
    await render(<RecordsScreen />);

    expect(screen.getByText('Healthy')).toBeOnTheScreen();
    expect(screen.getByText('Mosaic')).toBeOnTheScreen();
    expect(screen.getByText('Rust')).toBeOnTheScreen();
    expect(screen.queryByText('Smut')).not.toBeOnTheScreen();
    expect(screen.queryByText('Mildew')).not.toBeOnTheScreen();
  });

  it('submits search deliberately instead of querying every keystroke', async () => {
    await render(<RecordsScreen />);
    mockUsePaginatedScanRecords.mockClear();

    await fireEvent.changeText(
      screen.getByLabelText('Search saved records'),
      'Wawa',
    );
    expect(mockUsePaginatedScanRecords).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: undefined }),
      25,
    );

    await fireEvent.press(screen.getByLabelText('Submit record search'));
    expect(mockUsePaginatedScanRecords).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'Wawa' }),
      25,
    );
  });

  it('renders local record data, missing-image fallback, and UUID navigation', async () => {
    mockRecordsState = { ...mockRecordsState, data: [RECORD] };
    await render(<RecordsScreen />);

    expect(screen.getByText('Possible result: Rust')).toBeOnTheScreen();
    expect(screen.getByText('82% confidence')).toBeOnTheScreen();
    expect(screen.getByText('Saved on this device')).toBeOnTheScreen();

    await act(() =>
      screen
        .getByLabelText('Saved image for Possible result: Rust')
        .props.onError(),
    );
    expect(screen.getByLabelText('Saved image unavailable')).toBeOnTheScreen();

    await fireEvent.press(
      screen.getByLabelText(/Open Possible result: Rust record saved/),
    );
    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: '/record-details',
      params: { id: RECORD.id },
    });
  });

  it('distinguishes filtered no-results and query errors', async () => {
    const view = await render(<RecordsScreen />);
    await fireEvent.press(screen.getByLabelText('Filter records by Rust'));
    expect(screen.getByText('No matching records')).toBeOnTheScreen();

    mockRecordsState = {
      ...mockRecordsState,
      errorMessage: 'Saved records could not be loaded. Please try again.',
    };
    await view.rerender(<RecordsScreen />);

    expect(screen.getByText('Records unavailable')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Try Again'));
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it('loads the next offset page without replacing current records', async () => {
    mockRecordsState = {
      ...mockRecordsState,
      data: [RECORD],
      hasMore: true,
    };
    await render(<RecordsScreen />);

    await fireEvent.press(screen.getByText('Load More'));

    expect(mockLoadMore).toHaveBeenCalledTimes(1);
  });
});
