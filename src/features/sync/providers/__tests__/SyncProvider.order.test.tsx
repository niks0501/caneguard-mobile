import NetInfo from '@react-native-community/netinfo';
import { act, render, waitFor } from '@testing-library/react-native';
import { AppState, Text } from 'react-native';

import { useCaneGuardDatabase } from '@/database/DatabaseProvider';
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
import { SyncProvider } from '@/features/sync/providers/SyncProvider';
import {
  syncPendingFieldReports,
  type SyncBatchResult,
} from '@/features/sync/services/syncPendingFieldReports';
import {
  countUnsyncedFieldSurveys,
  findLastSuccessfulFieldSurveySyncAt,
  resetStaleSyncingFieldSurveys,
} from '@/features/surveys/data/fieldSurveySyncRepository';
import { syncPendingFieldSurveys } from '@/features/surveys/services/syncPendingFieldSurveys';

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn(), fetch: jest.fn() },
}));
jest.mock('@/database/DatabaseProvider', () => ({ useCaneGuardDatabase: jest.fn() }));
jest.mock('@/database/localDataLifecycle', () => ({ purgeExpiredLocalData: jest.fn(async () => undefined) }));
jest.mock('@/features/auth/hooks/useAuth', () => ({ useAuth: jest.fn() }));
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
jest.mock('@/features/sync/data/inspectorWorkWaiting', () => ({ hasUnsentInspectorWork: jest.fn(async () => false) }));
jest.mock('@/features/sync/services/syncPendingFieldReports', () => ({ syncPendingFieldReports: jest.fn() }));
jest.mock('@/features/surveys/data/fieldSurveySyncRepository', () => ({
  countUnsyncedFieldSurveys: jest.fn(),
  findLastSuccessfulFieldSurveySyncAt: jest.fn(),
  resetStaleSyncingFieldSurveys: jest.fn(),
}));
jest.mock('@/features/surveys/services/syncPendingFieldSurveys', () => ({ syncPendingFieldSurveys: jest.fn() }));

const ONLINE = { isConnected: true, isInternetReachable: true, type: 'wifi' } as never;
const SUBMITTER_ID = 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17';

function batch(overrides: Partial<SyncBatchResult> = {}): SyncBatchResult {
  return {
    attempted: 0,
    authRequired: false,
    failed: 0,
    haltReason: 'empty',
    results: [],
    source: 'startup',
    synced: 0,
    ...overrides,
  };
}

describe('SyncProvider send order and revocation (NET-3)', () => {
  const reportCapabilityRevoked = jest.fn(async () => undefined);
  let networkListener: (state: never) => void;

  beforeEach(() => {
    reportCapabilityRevoked.mockClear();
    Object.defineProperty(AppState, 'currentState', { configurable: true, value: 'active' });
    jest.mocked(useCaneGuardDatabase).mockReturnValue({} as never);
    jest.mocked(useAuth).mockReturnValue({
      status: 'authenticated',
      session: { token: 'secure-token', user: { uuid: SUBMITTER_ID, role: 'field_reporter', districtCode: 'D-01' } },
      sessionVerification: 'verified',
      markSessionExpired: jest.fn(async () => undefined),
      reportCapabilityRevoked,
    } as never);
    jest.mocked(countUnsyncedFieldReports).mockResolvedValue(1);
    jest.mocked(countUnsyncedFieldValidationCompletions).mockResolvedValue(0);
    jest.mocked(countUnsyncedFieldSurveys).mockReturnValue(1);
    jest.mocked(findLastSuccessfulFieldSurveySyncAt).mockReturnValue(null);
    jest.mocked(resetStaleSyncingFieldSurveys).mockReturnValue();
    jest.mocked(findFieldReportUploadRecord).mockResolvedValue({} as never);
    jest.mocked(findLastSuccessfulFieldReportSyncAt).mockResolvedValue(null);
    jest.mocked(findLastSuccessfulFieldValidationCompletionSyncAt).mockResolvedValue(null);
    jest.mocked(resetStaleSyncingFieldReports).mockResolvedValue();
    jest.mocked(resetStaleSyncingFieldValidationCompletions).mockResolvedValue();
    jest.mocked(syncPendingFieldSurveys).mockResolvedValue(batch());
    jest.mocked(syncPendingFieldValidationCompletions).mockResolvedValue(batch() as never);
    jest.mocked(syncPendingFieldReports).mockResolvedValue(batch());
    jest.mocked(NetInfo.addEventListener).mockImplementation((listener) => {
      networkListener = listener as (state: never) => void;
      return jest.fn();
    });
    jest.mocked(NetInfo.fetch).mockResolvedValue(ONLINE);
    jest.spyOn(AppState, 'addEventListener').mockImplementation(() => ({ remove: jest.fn() }));
  });

  async function runOneSync() {
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
    await waitFor(() => expect(syncPendingFieldValidationCompletions).toHaveBeenCalled());
  }

  // Intent: "Send boundaries before reports": a report never reaches the office ahead of the boundary it refers to.
  it('sends boundaries, then reports, then visits', async () => {
    const order: string[] = [];
    jest.mocked(syncPendingFieldSurveys).mockImplementation(async () => {
      order.push('boundaries');
      return batch();
    });
    jest.mocked(syncPendingFieldReports).mockImplementation(async () => {
      order.push('reports');
      return batch();
    });
    jest.mocked(syncPendingFieldValidationCompletions).mockImplementation(async () => {
      order.push('visits');
      return batch() as never;
    });

    await runOneSync();

    expect(order).toEqual(['boundaries', 'reports', 'visits']);
  });

  // Intent: "map CAPABILITY_REVOKED to its own code" reaches the session: one refused upload drops carried capabilities.
  it('reports a revocation to the session when an upload comes back CAPABILITY_REVOKED', async () => {
    jest.mocked(syncPendingFieldReports).mockResolvedValue(
      batch({
        attempted: 1,
        failed: 1,
        results: [
          {
            reportId: 'report-1',
            status: 'failed',
            error: new SyncError('CAPABILITY_REVOKED', 'Your access changed.'),
          },
        ],
      }),
    );

    await runOneSync();

    await waitFor(() => expect(reportCapabilityRevoked).toHaveBeenCalledTimes(1));
  });

  // Intent: only the named code revokes; an ordinary refusal does not drop the session's capabilities.
  it('does not report a revocation for an ordinary forbidden upload', async () => {
    jest.mocked(syncPendingFieldReports).mockResolvedValue(
      batch({
        attempted: 1,
        failed: 1,
        results: [
          {
            reportId: 'report-1',
            status: 'failed',
            error: new SyncError('API_FORBIDDEN', 'Not allowed.'),
          },
        ],
      }),
    );

    await runOneSync();

    expect(reportCapabilityRevoked).not.toHaveBeenCalled();
  });
});
