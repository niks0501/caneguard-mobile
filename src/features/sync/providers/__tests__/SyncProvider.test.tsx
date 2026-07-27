import NetInfo from '@react-native-community/netinfo';
import { act, render, waitFor } from '@testing-library/react-native';
import { AppState, Text } from 'react-native';

import { useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  countUnsyncedRecords,
  findLastSuccessfulSyncAt,
  resetStaleSyncingRecords,
} from '@/features/records/data/scanRecordSyncRepository';
import { SyncProvider } from '@/features/sync/providers/SyncProvider';
import { syncPendingScans } from '@/features/sync/services/syncPendingScans';

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn(),
    fetch: jest.fn(),
  },
}));
jest.mock('@/database/DatabaseProvider', () => ({
  useCaneGuardDatabase: jest.fn(),
}));
jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));
jest.mock('@/features/records/data/scanRecordSyncRepository', () => ({
  countUnsyncedRecords: jest.fn(),
  findLastSuccessfulSyncAt: jest.fn(),
  markPending: jest.fn(),
  resetStaleSyncingRecords: jest.fn(),
}));
jest.mock('@/features/sync/services/syncPendingScans', () => ({
  syncPendingScans: jest.fn(),
}));

const OFFLINE = {
  isConnected: false,
  isInternetReachable: false,
  type: 'none',
} as never;
const ONLINE = {
  isConnected: true,
  isInternetReachable: true,
  type: 'wifi',
} as never;

describe('SyncProvider foreground triggers', () => {
  let networkListener: (state: never) => void;
  let appStateListener: (state: string) => void;

  beforeEach(() => {
    jest.mocked(useCaneGuardDatabase).mockReturnValue({} as never);
    jest.mocked(useAuth).mockReturnValue({
      status: 'authenticated',
      session: { token: 'secure-token' },
      markSessionExpired: jest.fn(async () => undefined),
    } as never);
    jest.mocked(countUnsyncedRecords).mockResolvedValue(1);
    jest.mocked(findLastSuccessfulSyncAt).mockResolvedValue(null);
    jest.mocked(resetStaleSyncingRecords).mockResolvedValue();
    jest.mocked(syncPendingScans).mockResolvedValue({
      attempted: 1,
      authRequired: false,
      failed: 0,
      results: [],
      source: 'startup',
      synced: 1,
    });
    jest.mocked(NetInfo.addEventListener).mockImplementation((listener) => {
      networkListener = listener as (state: never) => void;
      return jest.fn();
    });
    jest.mocked(NetInfo.fetch).mockResolvedValue(ONLINE);
    jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_event, listener) => {
        appStateListener = listener as (state: string) => void;
        return { remove: jest.fn() };
      });
  });

  it('uploads when connectivity returns and when the app resumes', async () => {
    await render(
      <SyncProvider>
        <Text>Ready</Text>
      </SyncProvider>,
    );
    await waitFor(() => expect(NetInfo.addEventListener).toHaveBeenCalled());
    await waitFor(() => expect(countUnsyncedRecords).toHaveBeenCalled());

    await act(() => networkListener(OFFLINE));
    await act(async () => {
      networkListener(ONLINE);
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(syncPendingScans).toHaveBeenCalledWith(
        expect.objectContaining({ source: 'network-restored' }),
      ),
    );
    jest.mocked(syncPendingScans).mockClear();

    await act(async () => {
      appStateListener('active');
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(syncPendingScans).toHaveBeenCalledWith(
        expect.objectContaining({ source: 'resume' }),
      ),
    );
  });
});
