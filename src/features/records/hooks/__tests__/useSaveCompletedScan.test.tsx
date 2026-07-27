import { act, renderHook, waitFor } from '@testing-library/react-native';
import { randomUUID } from 'expo-crypto';

import { StorageError } from '@/database/errors';
import { initialScanSessionState } from '@/features/detection/context/scanSessionReducer';
import type { ScanSessionState } from '@/features/detection/types';
import { useSaveCompletedScan } from '@/features/records/hooks/useSaveCompletedScan';
import { saveCompletedScan } from '@/features/records/services/saveCompletedScan';

const RECORD_ID = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2';
const mockDatabase = {};

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(),
}));
jest.mock('@/database/DatabaseProvider', () => ({
  useCaneGuardDatabase: () => mockDatabase,
}));
jest.mock('@/features/records/services/saveCompletedScan', () => ({
  saveCompletedScan: jest.fn(),
}));
jest.mock('@/features/sync/hooks/useSync', () => ({
  useSync: () => ({ syncNow: jest.fn() }),
}));

const mockRandomUUID = jest.mocked(randomUUID);
const mockSaveCompletedScan = jest.mocked(saveCompletedScan);

function completedState(): ScanSessionState {
  return {
    ...initialScanSessionState,
    barangay: 'Wawa',
    status: 'completed',
    sourceUri: 'file:///camera/leaf.jpg',
    sourceType: 'camera',
    selectedSymptoms: ['rust'],
    result: {
      predictedLabel: 'rust',
      confidence: 0.8,
      scores: [
        { label: 'healthy', score: 0.1 },
        { label: 'mosaic', score: 0.1 },
        { label: 'rust', score: 0.8 },
      ],
      timings: { preprocessMs: 2, inferenceMs: 5, totalMs: 7 },
      modelVersion: 'v0.1-baseline',
    },
  };
}

describe('useSaveCompletedScan', () => {
  beforeEach(() => {
    mockRandomUUID.mockReturnValue(RECORD_ID);
  });

  it('coalesces rapid save taps into one write', async () => {
    let resolveSave!: (value: { id: string }) => void;
    mockSaveCompletedScan.mockReturnValue(
      new Promise((resolve) => {
        resolveSave = resolve;
      }),
    );
    const state = completedState();
    const { result } = await renderHook(() => useSaveCompletedScan(state));
    await waitFor(() => expect(result.current).not.toBeNull());

    let first!: Promise<{ id: string } | null>;
    let second!: Promise<{ id: string } | null>;
    await act(() => {
      first = result.current.save();
      second = result.current.save();
    });

    expect(result.current.status).toBe('saving');
    expect(mockSaveCompletedScan).toHaveBeenCalledTimes(1);
    expect(mockRandomUUID).toHaveBeenCalledTimes(1);

    resolveSave({ id: RECORD_ID });
    await act(async () => {
      await Promise.all([first, second]);
    });

    expect(result.current.status).toBe('saved');
  });

  it('keeps the same UUID when retrying a recoverable failure', async () => {
    mockSaveCompletedScan
      .mockRejectedValueOnce(
        new StorageError('SAVE_TRANSACTION_FAILED', 'failed'),
      )
      .mockResolvedValueOnce({ id: RECORD_ID });
    const state = completedState();
    const { result } = await renderHook(() => useSaveCompletedScan(state));
    await waitFor(() => expect(result.current).not.toBeNull());

    await act(async () => {
      await result.current.save();
    });

    expect(result.current).toMatchObject({
      status: 'failed',
      recordId: RECORD_ID,
      errorMessage:
        'The record could not be saved. Your scan result is still available.',
    });

    await act(async () => {
      await result.current.save();
    });

    await waitFor(() => expect(result.current.status).toBe('saved'));
    expect(mockRandomUUID).toHaveBeenCalledTimes(1);
    expect(mockSaveCompletedScan).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ recordId: RECORD_ID, state }),
    );
    expect(mockSaveCompletedScan).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ recordId: RECORD_ID, state }),
    );
  });
});
