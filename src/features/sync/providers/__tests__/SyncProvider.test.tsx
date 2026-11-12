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
import { hasUnsentInspectorWork } from '@/features/sync/data/inspectorWorkWaiting';
import { SyncError } from '@/features/sync/errors/syncErrors';
import {
  SyncContext,
  SyncProvider,
} from '@/features/sync/providers/SyncProvider';
import {
  syncPendingFieldReports,
  type SyncBatchResult,
} from '@/features/sync/services/syncPendingFieldReports';
import { countUnsyncedFieldSurveys, findLastSuccessfulFieldSurveySyncAt, resetStaleSyncingFieldSurveys } from '@/features/surveys/data/fieldSurveySyncRepository';
import { syncPendingFieldSurveys } from '@/features/surveys/services/syncPendingFieldSurveys';

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
jest.mock('@/features/sync/data/inspectorWorkWaiting', () => ({
  hasUnsentInspectorWork: jest.fn(async () => false),
}));
jest.mock('@/features/sync/services/syncPendingFieldReports', () => ({
  syncPendingFieldReports: jest.fn(),
}));
jest.mock('@/features/surveys/data/fieldSurveySyncRepository', () => ({
  countUnsyncedFieldSurveys: jest.fn(),
  findLastSuccessfulFieldSurveySyncAt: jest.fn(),
  resetStaleSyncingFieldSurveys: jest.fn(),
}));
jest.mock('@/features/surveys/services/syncPendingFieldSurveys', () => ({
  syncPendingFieldSurveys: jest.fn(),
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

function SyncReportsProbe() {
  const sync = useContext(SyncContext);
  return (
    <Text testID="sync-reports-state">
      {`${sync?.pendingCount ?? 'none'}:${sync?.pendingReportsCount ?? 'none'}:${sync?.pendingSurveysCount ?? 'none'}:${sync?.pendingCompletionsCount ?? 'none'}:${sync?.lastSuccessfulSyncAt ?? 'none'}`}
    </Text>
  );
}

function InspectorWorkProbe() {
  const sync = useContext(SyncContext);
  return <Text testID="inspector-work">{String(sync?.inspectorWorkWaiting)}</Text>;
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
      session: { token: 'secure-token', user: { uuid: SUBMITTER_ID, role: 'field_reporter', districtCode: 'D-01' } },
      sessionVerification: 'verified',
      markSessionExpired: jest.fn(async () => undefined),
    } as never);
    jest.mocked(countUnsyncedFieldReports).mockResolvedValue(1);
    jest.mocked(countUnsyncedFieldValidationCompletions).mockResolvedValue(0);
    jest.mocked(countUnsyncedFieldSurveys).mockReturnValue(0);
    jest.mocked(findLastSuccessfulFieldSurveySyncAt).mockReturnValue(null);
    jest.mocked(resetStaleSyncingFieldSurveys).mockReturnValue();
    jest.mocked(findFieldReportUploadRecord).mockResolvedValue({} as never);
    jest.mocked(findLastSuccessfulFieldReportSyncAt).mockResolvedValue(null);
    jest.mocked(findLastSuccessfulFieldValidationCompletionSyncAt).mockResolvedValue(null);
    jest.mocked(resetStaleSyncingFieldReports).mockResolvedValue();
    jest.mocked(resetStaleSyncingFieldValidationCompletions).mockResolvedValue();
    jest.mocked(syncPendingFieldSurveys).mockResolvedValue({
      attempted: 0,
      authRequired: false,
      failed: 0,
      haltReason: 'empty',
      results: [],
      source: 'startup',
      synced: 0,
    });
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
      expect(resetStaleSyncingFieldSurveys).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(countUnsyncedFieldReports).toHaveBeenCalled());
    } finally {
      jest.useRealTimers();
    }
  });

  it('does not sync or count official records for a farmer session', async () => {
    jest.mocked(useAuth).mockReturnValue({
      status: 'authenticated',
      session: {
        token: 'farmer-token',
        user: { uuid: SUBMITTER_ID, role: 'farmer' },
      },
      sessionVerification: 'verified',
      markSessionExpired: jest.fn(async () => undefined),
    } as never);
    jest.mocked(countUnsyncedFieldReports).mockResolvedValue(3);
    jest.mocked(countUnsyncedFieldSurveys).mockReturnValue(2);
    jest.mocked(countUnsyncedFieldValidationCompletions).mockResolvedValue(1);

    await render(
      <SyncProvider>
        <SyncReportsProbe />
      </SyncProvider>,
    );
    await waitFor(() => expect(NetInfo.addEventListener).toHaveBeenCalled());

    await act(async () => {
      networkListener(ONLINE);
      await Promise.resolve();
    });

    expect(syncPendingFieldReports).not.toHaveBeenCalled();
    expect(syncPendingFieldSurveys).not.toHaveBeenCalled();
    expect(syncPendingFieldValidationCompletions).not.toHaveBeenCalled();
    expect(countUnsyncedFieldReports).not.toHaveBeenCalled();
    expect(countUnsyncedFieldSurveys).not.toHaveBeenCalled();
    expect(countUnsyncedFieldValidationCompletions).not.toHaveBeenCalled();
    expect(findLastSuccessfulFieldReportSyncAt).not.toHaveBeenCalled();
    expect(findLastSuccessfulFieldSurveySyncAt).not.toHaveBeenCalled();
    expect(
      findLastSuccessfulFieldValidationCompletionSyncAt,
    ).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByTestId('sync-reports-state')).toHaveTextContent(
        '0:0:0:0:none',
      ),
    );
  });

  it('flags unsent inspector work as a plain yes/no for a farmer session', async () => {
    jest.mocked(useAuth).mockReturnValue({
      status: 'authenticated',
      session: { token: 'farmer-token', user: { uuid: SUBMITTER_ID, role: 'farmer' } },
      sessionVerification: 'verified',
      markSessionExpired: jest.fn(async () => undefined),
    } as never);
    jest.mocked(hasUnsentInspectorWork).mockResolvedValue(true);

    await render(
      <SyncProvider>
        <InspectorWorkProbe />
        <SyncReportsProbe />
      </SyncProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('inspector-work')).toHaveTextContent('true'));
    expect(screen.getByTestId('sync-reports-state')).toHaveTextContent('0:0:0:0:none');
    expect(countUnsyncedFieldReports).not.toHaveBeenCalled();
    jest.mocked(hasUnsentInspectorWork).mockResolvedValue(false);
  });

  it('never raises the inspector-work flag for an inspector session', async () => {
    jest.mocked(hasUnsentInspectorWork).mockResolvedValue(true);

    await render(
      <SyncProvider>
        <InspectorWorkProbe />
      </SyncProvider>,
    );

    await waitFor(() => expect(countUnsyncedFieldReports).toHaveBeenCalled());
    expect(screen.getByTestId('inspector-work')).toHaveTextContent('false');
    expect(hasUnsentInspectorWork).not.toHaveBeenCalled();
    jest.mocked(hasUnsentInspectorWork).mockResolvedValue(false);
  });

  it('leaves queued official records unsent after a farmer demotion', async () => {
    jest.mocked(countUnsyncedFieldReports).mockResolvedValue(2);
    jest.mocked(countUnsyncedFieldSurveys).mockReturnValue(1);
    jest.mocked(countUnsyncedFieldValidationCompletions).mockResolvedValue(1);
    jest.mocked(findLastSuccessfulFieldReportSyncAt).mockResolvedValue(
      '2026-08-10T01:00:00.000Z',
    );
    jest.mocked(findLastSuccessfulFieldSurveySyncAt).mockReturnValue(
      '2026-08-10T01:00:00.000Z',
    );
    jest.mocked(
      findLastSuccessfulFieldValidationCompletionSyncAt,
    ).mockResolvedValue('2026-08-10T01:00:00.000Z');

    const view = await render(
      <SyncProvider>
        <SyncReportsProbe />
      </SyncProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId('sync-reports-state')).toHaveTextContent(
        /^4:2:1:1:/,
      ),
    );

    jest.mocked(useAuth).mockReturnValue({
      status: 'authenticated',
      session: {
        token: 'secure-token',
        user: { uuid: SUBMITTER_ID, role: 'farmer' },
      },
      sessionVerification: 'verified',
      markSessionExpired: jest.fn(async () => undefined),
    } as never);
    await view.rerender(
      <SyncProvider>
        <SyncReportsProbe />
      </SyncProvider>,
    );

    await act(async () => {
      networkListener(ONLINE);
      await Promise.resolve();
    });

    expect(syncPendingFieldReports).not.toHaveBeenCalled();
    expect(syncPendingFieldSurveys).not.toHaveBeenCalled();
    expect(syncPendingFieldValidationCompletions).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByTestId('sync-reports-state')).toHaveTextContent(
        '0:0:0:0:none',
      ),
    );
  });

  it('stops later uploads when the session is demoted during a report sync', async () => {
    let finishReport!: (result: SyncBatchResult) => void;
    jest.mocked(syncPendingFieldReports).mockReturnValueOnce(
      new Promise<SyncBatchResult>((resolve) => {
        finishReport = resolve;
      }),
    );

    const view = await render(
      <SyncProvider>
        <SyncReportsProbe />
      </SyncProvider>,
    );
    await waitFor(() => expect(NetInfo.addEventListener).toHaveBeenCalled());

    await act(async () => {
      networkListener(ONLINE);
      await Promise.resolve();
    });
    await waitFor(() =>
      expect(syncPendingFieldReports).toHaveBeenCalledTimes(1),
    );

    jest.mocked(useAuth).mockReturnValue({
      status: 'authenticated',
      session: {
        token: 'secure-token',
        user: { uuid: SUBMITTER_ID, role: 'farmer' },
      },
      sessionVerification: 'verified',
      markSessionExpired: jest.fn(async () => undefined),
    } as never);
    await view.rerender(
      <SyncProvider>
        <SyncReportsProbe />
      </SyncProvider>,
    );

    await act(async () => {
      finishReport({
        attempted: 1,
        authRequired: false,
        failed: 0,
        haltReason: 'empty',
        results: [],
        source: 'startup',
        synced: 1,
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(syncPendingFieldSurveys).not.toHaveBeenCalled();
    expect(syncPendingFieldValidationCompletions).not.toHaveBeenCalled();
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
    expect(syncPendingFieldSurveys).toHaveBeenCalledWith(expect.objectContaining({ districtCode: 'D-01', source: 'network-restored', ownerIdentity: SUBMITTER_ID }));
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
    expect(syncPendingFieldSurveys).toHaveBeenCalledWith(expect.objectContaining({ source: 'resume' }));
  });

  // Intent (item 8): a restored session carries the cached district until /me verifies it,
  // so boundary uploads wait for the verified account district instead of sending the cached one.
  it('uploads boundaries with the verified account district, not the cached one', async () => {
    const cachedUser = { uuid: SUBMITTER_ID, role: 'field_reporter' as const, districtCode: 'D-OLD' };
    jest.mocked(useAuth).mockReturnValue({
      status: 'authenticated',
      session: { token: 'secure-token', user: cachedUser },
      sessionVerification: 'pending',
      markSessionExpired: jest.fn(async () => undefined),
    } as never);

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

    await waitFor(() =>
      expect(syncPendingFieldSurveys).toHaveBeenCalledWith(
        expect.objectContaining({ districtCode: '', districtVerified: false }),
      ),
    );

    jest.mocked(syncPendingFieldSurveys).mockClear();
    jest.mocked(useAuth).mockReturnValue({
      status: 'authenticated',
      session: { token: 'secure-token', user: { ...cachedUser, districtCode: 'D-VERIFIED' } },
      sessionVerification: 'verified',
      markSessionExpired: jest.fn(async () => undefined),
    } as never);
    await view.rerender(
      <SyncProvider>
        <Text>Ready</Text>
      </SyncProvider>,
    );
    await act(async () => {
      appStateListener('active');
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(syncPendingFieldSurveys).toHaveBeenCalledWith(
        expect.objectContaining({ districtCode: 'D-VERIFIED', districtVerified: true, ownerIdentity: SUBMITTER_ID }),
      ),
    );
  });

  // Intent (item 8): a run holds its report and boundary queues on the district it started with,
  // so a verification that lands mid-run defers both and the retry picks them up together.
  it('holds the report and boundary queues on the district the run started with', async () => {
    const cachedUser = { uuid: SUBMITTER_ID, role: 'field_reporter' as const, districtCode: 'D-OLD' };
    jest.mocked(useAuth).mockReturnValue({
      status: 'authenticated',
      session: { token: 'secure-token', user: cachedUser },
      sessionVerification: 'pending',
      markSessionExpired: jest.fn(async () => undefined),
    } as never);
    let finishReports!: () => void;
    jest.mocked(syncPendingFieldReports).mockReturnValueOnce(
      new Promise((resolve) => {
        finishReports = () => resolve({
          attempted: 0,
          authRequired: false,
          failed: 0,
          haltReason: 'empty',
          results: [],
          source: 'startup',
          synced: 0,
        });
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
    await waitFor(() => expect(syncPendingFieldReports).toHaveBeenCalledTimes(1));

    jest.mocked(useAuth).mockReturnValue({
      status: 'authenticated',
      session: { token: 'secure-token', user: { ...cachedUser, districtCode: 'D-VERIFIED' } },
      sessionVerification: 'verified',
      markSessionExpired: jest.fn(async () => undefined),
    } as never);
    await view.rerender(
      <SyncProvider>
        <Text>Ready</Text>
      </SyncProvider>,
    );
    await act(async () => {
      finishReports();
      await Promise.resolve();
    });

    await waitFor(() => expect(syncPendingFieldSurveys).toHaveBeenCalled());
    expect(syncPendingFieldReports).toHaveBeenCalledWith(
      expect.objectContaining({ districtCode: '' }),
    );
    expect(syncPendingFieldSurveys).toHaveBeenCalledWith(
      expect.objectContaining({ districtCode: '', districtVerified: false }),
    );
  });

  // Models the held queue: a record is sent only once a verified district is supplied,
  // otherwise it stays pending and the batch reports a transient blocker.
  function simulateHeldQueues() {
    const sent: string[] = [];
    const batch = (kind: string) => (options: { districtCode: string; source: never }) => {
      if (!options.districtCode) {
        return Promise.resolve({
          attempted: 0, authRequired: false, failed: 0, haltReason: 'transient-blocker' as const,
          results: [], source: options.source, synced: 0,
        });
      }
      if (!sent.includes(kind)) sent.push(kind);
      return Promise.resolve({
        attempted: 1, authRequired: false, failed: 0, haltReason: 'empty' as const,
        results: [], source: options.source, synced: 1,
      });
    };
    jest.mocked(syncPendingFieldReports).mockImplementation(batch('report') as never);
    jest.mocked(syncPendingFieldSurveys).mockImplementation(batch('boundary') as never);
    return sent;
  }

  const cachedUser = { uuid: SUBMITTER_ID, role: 'field_reporter' as const, districtCode: 'D-01' };
  const authState = (sessionVerification: string, retrySessionVerification?: () => Promise<string>) => ({
    status: 'authenticated',
    session: { token: 'secure-token', user: cachedUser },
    sessionVerification,
    retrySessionVerification,
    markSessionExpired: jest.fn(async () => undefined),
  }) as never;

  // R12: verification completing resumes held reports and boundaries with no reconnect or foreground event.
  it('sends held reports and boundaries once verification completes, without another trigger', async () => {
    const sent = simulateHeldQueues();
    jest.mocked(useAuth).mockReturnValue(authState('pending'));
    const view = await render(<SyncProvider><Text>Ready</Text></SyncProvider>);
    await waitFor(() => expect(NetInfo.addEventListener).toHaveBeenCalled());
    await act(async () => {
      networkListener(ONLINE);
      await Promise.resolve();
    });
    await waitFor(() => expect(syncPendingFieldSurveys).toHaveBeenCalled());
    expect(sent).toEqual([]);

    jest.mocked(useAuth).mockReturnValue(authState('verified'));
    await view.rerender(<SyncProvider><Text>Ready</Text></SyncProvider>);

    await waitFor(() => expect(sent.sort()).toEqual(['boundary', 'report']));
  });

  // R13: with /me unavailable, the retry timer reattempts verification, then the held queues resume.
  it('reattempts account verification on the retry timer, then sends the held queues', async () => {
    jest.useFakeTimers();
    try {
      const sent = simulateHeldQueues();
      let rerenderVerified: () => Promise<void> = async () => undefined;
      const retryVerification = jest.fn(async () => {
        jest.mocked(useAuth).mockReturnValue(authState('verified', retryVerification));
        await rerenderVerified();
        return 'verified';
      });
      jest.mocked(useAuth).mockReturnValue(authState('unavailable', retryVerification));
      const view = await render(<SyncProvider><Text>Ready</Text></SyncProvider>);
      rerenderVerified = async () => {
        await view.rerender(<SyncProvider><Text>Ready</Text></SyncProvider>);
      };
      await waitFor(() => expect(NetInfo.addEventListener).toHaveBeenCalled());
      await act(async () => {
        networkListener(ONLINE);
        await Promise.resolve();
      });
      await waitFor(() => expect(syncPendingFieldSurveys).toHaveBeenCalled());
      expect(sent).toEqual([]);
      expect(retryVerification).not.toHaveBeenCalled();

      await act(async () => {
        jest.advanceTimersByTime(60_000);
        await Promise.resolve();
      });

      await waitFor(() => expect(retryVerification).toHaveBeenCalledTimes(1));
      await waitFor(() => expect(sent.sort()).toEqual(['boundary', 'report']));
    } finally {
      jest.useRealTimers();
    }
  });

  it('keeps retrying while verification stays unavailable', async () => {
    jest.useFakeTimers();
    try {
      const sent = simulateHeldQueues();
      const retryVerification = jest.fn(async () => 'unavailable');
      jest.mocked(useAuth).mockReturnValue(authState('unavailable', retryVerification));
      await render(<SyncProvider><Text>Ready</Text></SyncProvider>);
      await waitFor(() => expect(NetInfo.addEventListener).toHaveBeenCalled());
      await act(async () => {
        networkListener(ONLINE);
        await Promise.resolve();
      });
      for (let round = 1; round <= 2; round += 1) {
        await act(async () => {
          jest.advanceTimersByTime(60_000);
          await Promise.resolve();
        });
        await waitFor(() => expect(retryVerification).toHaveBeenCalledTimes(round));
      }
      expect(sent).toEqual([]);
    } finally {
      jest.useRealTimers();
    }
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
        user: { uuid: SUBMITTER_ID, role: 'field_reporter' },
      },
      sessionVerification: 'verified',
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
        user: { uuid: OTHER_SUBMITTER_ID, role: 'field_reporter' },
      },
      sessionVerification: 'verified',
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
      session: { token: 'second-token', user: { uuid: OTHER_SUBMITTER_ID, role: 'field_reporter' } },
      sessionVerification: 'verified',
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
