import NetInfo from '@react-native-community/netinfo';
import { act, render, waitFor } from '@testing-library/react-native';
import { AppState, Text } from 'react-native';

import { useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  countUnsyncedFieldReports,
  findFieldReportUploadRecord,
  findLastSuccessfulFieldReportSyncAt,
  resetStaleSyncingFieldReports,
} from '@/features/reports/data/fieldReportSyncRepository';
import { SyncProvider } from '@/features/sync/providers/SyncProvider';
import { syncPendingFieldReports } from '@/features/sync/services/syncPendingFieldReports';

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
jest.mock('@/features/reports/data/fieldReportSyncRepository', () => ({
  countUnsyncedFieldReports: jest.fn(),
  findFieldReportUploadRecord: jest.fn(),
  findLastSuccessfulFieldReportSyncAt: jest.fn(),
  markFieldReportPending: jest.fn(),
  resetStaleSyncingFieldReports: jest.fn(),
}));
jest.mock('@/features/sync/services/syncPendingFieldReports', () => ({
  syncPendingFieldReports: jest.fn(),
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
const SUBMITTER_ID = 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17';

describe('SyncProvider foreground triggers', () => {
  let networkListener: (state: never) => void;
  let appStateListener: (state: string) => void;

  beforeEach(() => {
    jest.mocked(useCaneGuardDatabase).mockReturnValue({} as never);
    jest.mocked(useAuth).mockReturnValue({
      status: 'authenticated',
      session: { token: 'secure-token', user: { uuid: SUBMITTER_ID } },
      markSessionExpired: jest.fn(async () => undefined),
    } as never);
    jest.mocked(countUnsyncedFieldReports).mockResolvedValue(1);
    jest.mocked(findFieldReportUploadRecord).mockResolvedValue({} as never);
    jest.mocked(findLastSuccessfulFieldReportSyncAt).mockResolvedValue(null);
    jest.mocked(resetStaleSyncingFieldReports).mockResolvedValue();
    jest.mocked(syncPendingFieldReports).mockResolvedValue({
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
    await waitFor(() => expect(countUnsyncedFieldReports).toHaveBeenCalled());
    expect(countUnsyncedFieldReports).toHaveBeenCalledWith(
      expect.anything(),
      SUBMITTER_ID,
    );

    await act(() => networkListener(OFFLINE));
    await act(async () => {
      networkListener(ONLINE);
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(syncPendingFieldReports).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'network-restored',
          submitterIdentity: SUBMITTER_ID,
        }),
      ),
    );
    jest.mocked(syncPendingFieldReports).mockClear();

    await act(async () => {
      appStateListener('active');
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(syncPendingFieldReports).toHaveBeenCalledWith(
        expect.objectContaining({ source: 'resume' }),
      ),
    );
  });
});
