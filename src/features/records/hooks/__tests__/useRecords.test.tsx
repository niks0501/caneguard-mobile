import { act, renderHook, waitFor } from '@testing-library/react-native';

import type { ScanRecordListItem } from '@/features/records/domain/recordTypes';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { usePaginatedScanRecords } from '@/features/records/hooks/useRecords';
import { listScanRecords } from '@/features/records/data/scanRecordRepository';

const mockDatabase = {};
let mockFocusCallback: (() => void | (() => void)) | null = null;

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void | (() => void)) => {
    mockFocusCallback = callback;
  },
}));
jest.mock('@/database/DatabaseProvider', () => ({
  useCaneGuardDatabase: () => mockDatabase,
}));
jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));
jest.mock('@/features/records/data/scanRecordRepository', () => ({
  findScanRecordById: jest.fn(),
  listScanRecords: jest.fn(),
}));

const mockListScanRecords = jest.mocked(listScanRecords);
const SUBMITTER_ID = 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17';

beforeEach(() => {
  jest.mocked(useAuth).mockReturnValue({
    user: { uuid: SUBMITTER_ID },
  } as never);
});

function record(index: number): ScanRecordListItem {
  return {
    authorityReview: null,
    id: `2b4666c0-ad10-4d0d-a233-${index.toString(16).padStart(12, '0')}`,
    managedImageUri: `file:///documents/caneguard/scan-images/${index}.jpg`,
    predictedLabel: index % 2 ? 'rust' : 'healthy',
    confidence: 0.8,
    barangay: null,
    syncStatus: 'local_only',
    createdAt: `2026-07-${String(index + 1).padStart(2, '0')}T00:00:00.000Z`,
  };
}

describe('usePaginatedScanRecords', () => {
  it('loads fixed-size offset pages and appends without replacing prior rows', async () => {
    mockListScanRecords
      .mockResolvedValueOnce([record(0), record(1)])
      .mockResolvedValueOnce([record(2)]);
    const { result } = await renderHook(() =>
      usePaginatedScanRecords({ syncStatus: 'local_only' }, 2),
    );
    await waitFor(() => expect(result.current).not.toBeNull());

    await act(async () => {
      mockFocusCallback?.();
    });
    await waitFor(() => expect(result.current.data).toHaveLength(2));

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.data.map((item) => item.id)).toEqual([
      record(0).id,
      record(1).id,
      record(2).id,
    ]);
    expect(result.current.hasMore).toBe(false);
    expect(mockListScanRecords).toHaveBeenNthCalledWith(
      1,
      mockDatabase,
      expect.objectContaining({ limit: 2, offset: 0 }),
      SUBMITTER_ID,
    );
    expect(mockListScanRecords).toHaveBeenNthCalledWith(
      2,
      mockDatabase,
      expect.objectContaining({ limit: 2, offset: 2 }),
      SUBMITTER_ID,
    );
  });

  it('replaces accumulated pages when the route refreshes', async () => {
    mockListScanRecords
      .mockResolvedValueOnce([record(0), record(1)])
      .mockResolvedValueOnce([record(4)]);
    const { result } = await renderHook(() =>
      usePaginatedScanRecords({ predictedLabel: 'rust' }, 2),
    );
    await waitFor(() => expect(result.current).not.toBeNull());

    await act(async () => {
      mockFocusCallback?.();
    });
    await waitFor(() => expect(result.current.data).toHaveLength(2));

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.data).toEqual([record(4)]);
    expect(mockListScanRecords).toHaveBeenLastCalledWith(
      mockDatabase,
      expect.objectContaining({
        limit: 2,
        offset: 0,
        predictedLabel: 'rust',
      }),
      SUBMITTER_ID,
    );
  });

  it('coalesces rapid requests for the same next page', async () => {
    let resolveNextPage: ((records: ScanRecordListItem[]) => void) | undefined;
    mockListScanRecords
      .mockResolvedValueOnce([record(0), record(1)])
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveNextPage = resolve;
          }),
      );
    const { result } = await renderHook(() =>
      usePaginatedScanRecords({}, 2),
    );

    await act(async () => {
      mockFocusCallback?.();
    });
    await waitFor(() => expect(result.current.data).toHaveLength(2));

    let firstRequest: Promise<boolean> | undefined;
    let secondRequest: Promise<boolean> | undefined;
    await act(async () => {
      firstRequest = result.current.loadMore();
      secondRequest = result.current.loadMore();
      expect(secondRequest).toBe(firstRequest);
      expect(mockListScanRecords).toHaveBeenCalledTimes(2);
      resolveNextPage?.([record(2)]);
      await firstRequest;
    });

    expect(result.current.data).toHaveLength(3);
  });
});
