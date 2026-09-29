import NetInfo from '@react-native-community/netinfo';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import { useContext } from 'react';
import { AppState, Text } from 'react-native';

import { useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { purgeExpiredLocalData } from '@/database/localDataLifecycle';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  countUnsyncedFieldValidationCompletions,
  findLastSuccessfulFieldValidationCompletionSyncAt,
  resetStaleSyncingFieldValidationCompletions,
} from '@/features/assignments/data/fieldValidationCompletionRepository';
import { syncPendingFieldValidationCompletions } from '@/features/assignments/services/syncPendingFieldValidationCompletions';
import {
  countUnsyncedFieldReports,
  findFieldReportUploadRecord,
  findLastSuccessfulFieldReportSyncAt,
  resetStaleSyncingFieldReports,
} from '@/features/reports/data/fieldReportSyncRepository';
import { SyncError } from '@/features/sync/errors/syncErrors';
import {
  SyncContext,
  SyncProvider,
} from '@/features/sync/providers/SyncProvider';
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
jest.mock('@/database/localDataLifecycle', () => ({
  purgeExpiredLocalData: jest.fn(async () => undefined),
}));
jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));
jest.mock('@/features/assignments/data/fieldValidationCompletionRepository', () => ({
  countUnsyncedFieldValidationCompletions: jest.fn(),
  findLastSuccessfulFieldValidationCompletionSyncAt: jest.fn(),
  markFieldValidationCompletionPending: jest.fn(),
  resetStaleSyncingFieldValidationCompletions: jest.fn(),
}));
jest.mock('@/features/assignments/services/syncPendingFieldValidationCompletions', () => ({
  syncPendingFieldValidationCompletions: jest.fn(),
}));
jest.mock('@/features/reports/data/fieldReportSyncRepository', () => ({
  countUnsyncedFieldReports: jest.fn(),
  findFieldReportUploadRecord: jest.fn(),
  findLastSuccessfulFieldReportSyncAt: jest.fn(),
  markFieldReportPending: jest.fn(),
  resetStaleSyncingFieldReports: jest.fn(),
  SYNC_RETRY_COOLDOWN_MS: 60_000,
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
const OTHER_SUBMITTER_ID = '51214146-7439-48e0-aef4-d0e003f194b4';

function SyncStateProbe() {
  const sync = useContext(SyncContext);
  return (
    <Text testID="sync-state">
      {`${sync?.pendingCount ?? 'none'}:${sync?.lastSuccessfulSyncAt ?? 'none'}`}
    </Text>
  );
}

function SyncApiHealthProbe() {
  const sync = useContext(SyncContext);
  return (
    <Text testID="sync-api-health">
      {`${sync?.isOnline ?? 'none'}:${sync?.apiReachability ?? 'none'}`}
    </Text>
  );
}

describe('SyncProvider foreground triggers', () => {
  let networkListener: (state: never) => void;
  let appStateListener: (state: string) => void;

  beforeEach(() => {
    Object.defineProperty(AppState, 'currentState', {
      configurable: true,
      value: 'active',
    });
    jest.mocked(useCaneGuardDatabase).mockReturnValue({} as never);
    jest.mocked(useAuth).mockReturnValue({
      status: 'authenticated',
      session: { token: 'secure-token', user: { uuid: SUBMITTER_ID } },
      markSessionExpired: jest.fn(async () => undefined),
    } as never);
    jest.mocked(countUnsyncedFieldReports).mockResolvedValue(1);
    jest.mocked(countUnsyncedFieldValidationCompletions).mockResolvedValue(0);
    jest.mocked(findFieldReportUploadRecord).mockResolvedValue({} as never);
    jest.mocked(findLastSuccessfulFieldReportSyncAt).mockResolvedValue(null);
    jest.mocked(findLastSuccessfulFieldValidationCompletionSyncAt).mockResolvedValue(null);
    jest.mocked(resetStaleSyncingFieldReports).mockResolvedValue();
    jest.mocked(resetStaleSyncingFieldValidationCompletions).mockResolvedValue();
    jest.mocked(syncPendingFieldValidationCompletions).mockResolvedValue({
      attempted: 0,
      authRequired: false,
      failed: 0,
      haltReason: 'empty',
      results: [],
      source: 'startup',
      synced: 0,
    });
    jest.mocked(syncPendingFieldReports).mockResolvedValue({
      attempted: 1,
      authRequired: false,
      failed: 0,
      haltReason: 'empty',
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

  it('defers the mount-time database maintenance past the first paint', async () => {
    jest.useFakeTimers();
    try {
      await render(
        <SyncProvider>
          <Text>Ready</Text>
        </SyncProvider>,
      );

      // Housekeeping must not compete with the database migration, the auth
      // restore, and the first Home queries for the cold-start JS thread.
      expect(purgeExpiredLocalData).not.toHaveBeenCalled();
      expect(resetStaleSyncingFieldReports).not.toHaveBeenCalled();
      expect(resetStaleSyncingFieldValidationCompletions).not.toHaveBeenCalled();
      expect(countUnsyncedFieldReports).not.toHaveBeenCalled();

      await act(async () => {
        jest.runOnlyPendingTimers();
        await Promise.resolve();
      });

      expect(purgeExpiredLocalData).toHaveBeenCalledTimes(1);
      expect(resetStaleSyncingFieldReports).toHaveBeenCalledTimes(1);
      expect(resetStaleSyncingFieldValidationCompletions).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(countUnsyncedFieldReports).toHaveBeenCalled());
    } finally {
      jest.useRealTimers();
    }
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

  it('tracks API unavailability separately from phone network availability', async () => {
    jest.mocked(syncPendingFieldReports).mockResolvedValue({
      attempted: 1,
      authRequired: false,
      failed: 1,
      haltReason: 'transient-blocker',
      results: [
        {
          reportId: 'report-1',
          status: 'failed',
          error: new SyncError(
            'NETWORK_REQUEST_FAILED',
            'The upload connection failed.',
          ),
        },
      ],
      source: 'startup',
      synced: 0,
    });
    const view = await render(
      <SyncProvider>
        <SyncApiHealthProbe />
      </SyncProvider>,
    );
    await waitFor(() => expect(NetInfo.addEventListener).toHaveBeenCalled());

    await act(async () => {
      networkListener(ONLINE);
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(screen.getByTestId('sync-api-health')).toHaveTextContent(
        'true:unavailable',
      ),
    );
    view.unmount();
  });

  it('tracks API availability after a successful report upload', async () => {
    jest.mocked(syncPendingFieldReports).mockResolvedValue({
      attempted: 1,
      authRequired: false,
      failed: 0,
      haltReason: 'empty',
      results: [
        {
          reportId: 'report-1',
          remoteId: 'remote-1',
          status: 'synced',
        },
      ],
      source: 'startup',
      synced: 1,
    });
    const view = await render(
      <SyncProvider>
        <SyncApiHealthProbe />
      </SyncProvider>,
    );
    await waitFor(() => expect(NetInfo.addEventListener).toHaveBeenCalled());

    await act(async () => {
      networkListener(ONLINE);
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(screen.getByTestId('sync-api-health')).toHaveTextContent(
        'true:available',
      ),
    );
    view.unmount();
  });

  it('schedules one app-active retry after a transient queue blocker', async () => {
    jest.useFakeTimers();
    try {
      jest.mocked(syncPendingFieldReports)
        .mockResolvedValueOnce({
          attempted: 1,
          authRequired: false,
          failed: 1,
          haltReason: 'transient-blocker',
          results: [],
          source: 'startup',
          synced: 0,
        })
        .mockResolvedValue({
          attempted: 0,
          authRequired: false,
          failed: 0,
          haltReason: 'empty',
          results: [],
          source: 'retry-timer',
          synced: 0,
        });
      await render(
        <SyncProvider>
          <Text>Ready</Text>
        </SyncProvider>,
      );
      await waitFor(() => expect(NetInfo.addEventListener).toHaveBeenCalled());

      await act(async () => {
        networkListener(ONLINE);
        await Promise.resolve();
      });
      expect(syncPendingFieldReports).toHaveBeenCalledTimes(1);

      await act(async () => {
        jest.advanceTimersByTime(60_000);
        await Promise.resolve();
      });
      await waitFor(() =>
        expect(syncPendingFieldReports).toHaveBeenCalledTimes(2),
      );
      expect(syncPendingFieldReports).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ source: 'retry-timer' }),
      );
      expect(syncPendingFieldReports).not.toHaveBeenCalledWith(
        expect.objectContaining({ source: 'manual' }),
      );
    } finally {
      jest.useRealTimers();
    }
  });

  it('does not schedule a timer for permanent failures and clears it on unmount', async () => {
    jest.useFakeTimers();
    try {
      jest.mocked(syncPendingFieldReports).mockResolvedValue({
        attempted: 1,
        authRequired: false,
        failed: 1,
        haltReason: 'empty',
        results: [],
        source: 'startup',
        synced: 0,
      });
      const view = await render(
        <SyncProvider>
          <Text>Ready</Text>
        </SyncProvider>,
      );
      await waitFor(() => expect(NetInfo.addEventListener).toHaveBeenCalled());

      await act(async () => {
        networkListener(ONLINE);
        await Promise.resolve();
      });
      await act(async () => {
        jest.advanceTimersByTime(60_000);
        await Promise.resolve();
      });
      expect(syncPendingFieldReports).toHaveBeenCalledTimes(1);

      view.unmount();
    } finally {
      jest.useRealTimers();
    }
  });

  it('clears a pending retry timer when a later resume sync succeeds', async () => {
    jest.useFakeTimers();
    try {
      jest.mocked(syncPendingFieldReports)
        .mockResolvedValueOnce({
          attempted: 1,
          authRequired: false,
          failed: 1,
          haltReason: 'transient-blocker',
          results: [],
          source: 'startup',
          synced: 0,
        })
        .mockResolvedValueOnce({
          attempted: 1,
          authRequired: false,
          failed: 0,
          haltReason: 'empty',
          results: [],
          source: 'resume',
          synced: 1,
        });
      await render(
        <SyncProvider>
          <Text>Ready</Text>
        </SyncProvider>,
      );
      await waitFor(() => expect(NetInfo.addEventListener).toHaveBeenCalled());

      await act(async () => {
        networkListener(ONLINE);
        await Promise.resolve();
      });
      await act(async () => {
        appStateListener('active');
        await Promise.resolve();
        await Promise.resolve();
      });
      expect(syncPendingFieldReports).toHaveBeenCalledTimes(2);

      await act(async () => {
        jest.advanceTimersByTime(60_000);
        await Promise.resolve();
      });
      expect(syncPendingFieldReports).toHaveBeenCalledTimes(2);
    } finally {
      jest.useRealTimers();
    }
  });

  it('does not fire a pending retry timer while the app is backgrounded', async () => {
    jest.useFakeTimers();
    try {
      jest.mocked(syncPendingFieldReports).mockResolvedValue({
        attempted: 1,
        authRequired: false,
        failed: 1,
        haltReason: 'transient-blocker',
        results: [],
        source: 'startup',
        synced: 0,
      });
      await render(
        <SyncProvider>
          <Text>Ready</Text>
        </SyncProvider>,
      );
      await waitFor(() => expect(NetInfo.addEventListener).toHaveBeenCalled());

      await act(async () => {
        networkListener(ONLINE);
        await Promise.resolve();
      });
      await act(async () => {
        appStateListener('background');
        jest.advanceTimersByTime(60_000);
        await Promise.resolve();
      });
      expect(syncPendingFieldReports).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it('does not expire a replacement session from an older rejected upload', async () => {
    const markFirstSessionExpired = jest.fn(async () => undefined);
    const markSecondSessionExpired = jest.fn(async () => undefined);
    let finish!: (result: {
      attempted: number;
      authRequired: boolean;
      failed: number;
      haltReason: 'auth-required' | null;
      results: [];
      source: 'network-restored';
      synced: number;
    }) => void;
    jest.mocked(useAuth).mockReturnValue({
      status: 'authenticated',
      session: {
        token: 'first-token',
        user: { uuid: SUBMITTER_ID },
      },
      markSessionExpired: markFirstSessionExpired,
    } as never);
    jest.mocked(syncPendingFieldReports).mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );

    const view = await render(
      <SyncProvider>
        <Text>Ready</Text>
      </SyncProvider>,
    );
    await waitFor(() => expect(NetInfo.addEventListener).toHaveBeenCalled());
    await act(() => networkListener(OFFLINE));
    await act(async () => {
      networkListener(ONLINE);
      await Promise.resolve();
    });
    await waitFor(() => expect(syncPendingFieldReports).toHaveBeenCalled());

    jest.mocked(useAuth).mockReturnValue({
      status: 'authenticated',
      session: {
        token: 'second-token',
        user: { uuid: OTHER_SUBMITTER_ID },
      },
      markSessionExpired: markSecondSessionExpired,
    } as never);
    await view.rerender(
      <SyncProvider>
        <Text>Ready</Text>
      </SyncProvider>,
    );
    await act(async () => {
      finish({
        attempted: 1,
        authRequired: true,
        failed: 1,
        haltReason: 'auth-required',
        results: [],
        source: 'network-restored',
        synced: 0,
      });
      await Promise.resolve();
    });

    expect(markFirstSessionExpired).not.toHaveBeenCalled();
    expect(markSecondSessionExpired).not.toHaveBeenCalled();
  });

  it('ignores pending-count results from a replaced session', async () => {
    let finishReset!: () => void;
    let finishFirstCount!: (count: number) => void;
    const firstReset = new Promise<void>((resolve) => {
      finishReset = resolve;
    });
    const firstCount = new Promise<number>((resolve) => {
      finishFirstCount = resolve;
    });
    jest.mocked(resetStaleSyncingFieldReports).mockReturnValueOnce(firstReset);
    jest.mocked(countUnsyncedFieldReports).mockImplementation(
      (_database, submitterIdentity) =>
        submitterIdentity === SUBMITTER_ID ? firstCount : Promise.resolve(2),
    );
    jest.mocked(findLastSuccessfulFieldReportSyncAt).mockImplementation(
      (_database, submitterIdentity) =>
        Promise.resolve(submitterIdentity === SUBMITTER_ID ? 'old' : 'new'),
    );

    const view = await render(
      <SyncProvider>
        <SyncStateProbe />
      </SyncProvider>,
    );
    await waitFor(() => expect(resetStaleSyncingFieldReports).toHaveBeenCalled());

    await act(async () => {
      finishReset();
      await Promise.resolve();
    });
    await waitFor(() =>
      expect(countUnsyncedFieldReports).toHaveBeenCalledWith(
        expect.anything(),
        SUBMITTER_ID,
      ),
    );

    jest.mocked(useAuth).mockReturnValue({
      status: 'authenticated',
      session: { token: 'second-token', user: { uuid: OTHER_SUBMITTER_ID } },
      markSessionExpired: jest.fn(async () => undefined),
    } as never);
    jest.mocked(resetStaleSyncingFieldReports).mockResolvedValue();
    await view.rerender(
      <SyncProvider>
        <SyncStateProbe />
      </SyncProvider>,
    );

    await waitFor(() =>
      expect(countUnsyncedFieldReports).toHaveBeenCalledWith(
        expect.anything(),
        OTHER_SUBMITTER_ID,
      ),
    );
    await waitFor(() =>
      expect(screen.getByTestId('sync-state')).toHaveTextContent('2:new'),
    );

    await act(async () => {
      finishFirstCount(99);
      await Promise.resolve();
    });

    expect(screen.getByTestId('sync-state')).toHaveTextContent('2:new');
  });
});
