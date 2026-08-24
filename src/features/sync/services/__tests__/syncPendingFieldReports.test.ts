import { waitFor } from '@testing-library/react-native';

import type { CaneGuardDatabase } from '@/database/database';
import { createFieldReportSyncRepository } from '@/features/reports/data/fieldReportSyncRepository';
import { SyncError } from '@/features/sync/errors/syncErrors';
import { syncFieldReport } from '@/features/sync/services/syncFieldReport';
import {
  MAX_SYNC_REPORTS_PER_RUN,
  syncPendingFieldReports,
} from '@/features/sync/services/syncPendingFieldReports';

jest.mock('@/features/reports/data/fieldReportSyncRepository', () => ({
  createFieldReportSyncRepository: jest.fn(),
  SYNC_RETRY_COOLDOWN_MS: 60_000,
}));
jest.mock('@/features/sync/services/syncFieldReport', () => ({ syncFieldReport: jest.fn() }));

const database = {} as CaneGuardDatabase;
const SUBMITTER_ID = 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17';
const OTHER_SUBMITTER_ID = '51214146-7439-48e0-aef4-d0e003f194b4';
const findSyncCandidates = jest.fn();
const repository = { findSyncCandidates };

describe('pending Field Report queue', () => {
  beforeEach(() => {
    findSyncCandidates.mockReset();
    jest.mocked(syncFieldReport).mockReset();
    jest.mocked(createFieldReportSyncRepository).mockReturnValue(repository as never);
  });

  it('coalesces concurrent foreground triggers into one sequential run', async () => {
    findSyncCandidates
      .mockResolvedValueOnce([{ id: 'report-1' }])
      .mockResolvedValueOnce([]);
    let finish!: () => void;
    jest.mocked(syncFieldReport).mockReturnValueOnce(new Promise((resolve) => {
      finish = () => resolve({ reportId: 'report-1', remoteId: 'remote-1', status: 'synced' });
    }));

    const first = syncPendingFieldReports({
      database,
      source: 'startup',
      submitterIdentity: SUBMITTER_ID,
      token: 'secure-token',
    });
    const second = syncPendingFieldReports({
      database,
      source: 'network-restored',
      submitterIdentity: SUBMITTER_ID,
      token: 'secure-token',
    });
    expect(second).toBe(first);
    await waitFor(() => expect(syncFieldReport).toHaveBeenCalledTimes(1));
    finish();
    await expect(first).resolves.toMatchObject({ attempted: 1, synced: 1, source: 'startup' });
  });

  it('requests finalized pending/failed reports for manual retry and stops on auth failure', async () => {
    findSyncCandidates.mockResolvedValueOnce([{ id: 'report-1' }, { id: 'report-2' }]);
    jest.mocked(syncFieldReport).mockResolvedValueOnce({
      reportId: 'report-1', status: 'failed',
      error: new SyncError('AUTH_REQUIRED', 'Sign in again.'),
    });

    await expect(syncPendingFieldReports({
      database,
      source: 'manual',
      submitterIdentity: SUBMITTER_ID,
      token: 'expired-token',
    })).resolves.toMatchObject({ attempted: 1, authRequired: true, failed: 1 });
    expect(createFieldReportSyncRepository).toHaveBeenCalledWith(
      database,
      SUBMITTER_ID,
    );
    expect(findSyncCandidates).toHaveBeenCalledWith(
      10,
      expect.objectContaining({
        failedBefore: expect.any(String),
        includeRetryableFailed: true,
      }),
    );
    expect(syncFieldReport).toHaveBeenCalledTimes(1);
  });

  it('serializes different submitter queues on one database', async () => {
    let candidateCall = 0;
    findSyncCandidates.mockImplementation(async () => {
      candidateCall += 1;
      return candidateCall === 1 ? [{ id: 'report-1' }] : [];
    });
    let finishFirst!: () => void;
    jest.mocked(syncFieldReport).mockReturnValueOnce(
      new Promise((resolve) => {
        finishFirst = () =>
          resolve({ reportId: 'report-1', remoteId: 'remote-1', status: 'synced' });
      }),
    );

    const first = syncPendingFieldReports({
      database,
      source: 'startup',
      submitterIdentity: SUBMITTER_ID,
      token: 'first-token',
    });
    const second = syncPendingFieldReports({
      database,
      source: 'startup',
      submitterIdentity: OTHER_SUBMITTER_ID,
      token: 'second-token',
    });

    expect(second).not.toBe(first);
    await waitFor(() =>
      expect(createFieldReportSyncRepository).toHaveBeenCalledTimes(1),
    );
    expect(syncFieldReport).toHaveBeenCalledTimes(1);
    finishFirst();
    await expect(Promise.all([first, second])).resolves.toHaveLength(2);
    expect(createFieldReportSyncRepository).toHaveBeenNthCalledWith(
      1,
      database,
      SUBMITTER_ID,
    );
    expect(createFieldReportSyncRepository).toHaveBeenNthCalledWith(
      2,
      database,
      OTHER_SUBMITTER_ID,
    );
  });

  it('continues after a permanent report failure', async () => {
    findSyncCandidates
      .mockResolvedValueOnce([{ id: 'bad-report' }, { id: 'good-report' }])
      .mockResolvedValueOnce([]);
    jest.mocked(syncFieldReport)
      .mockResolvedValueOnce({
        reportId: 'bad-report',
        status: 'failed',
        error: new SyncError('API_VALIDATION_FAILED', 'Review this report.'),
      })
      .mockResolvedValueOnce({
        reportId: 'good-report',
        remoteId: 'remote-good',
        status: 'synced',
      });

    await expect(syncPendingFieldReports({
      database,
      source: 'startup',
      submitterIdentity: SUBMITTER_ID,
      token: 'secure-token',
    })).resolves.toMatchObject({
      attempted: 2,
      failed: 1,
      haltReason: 'empty',
      synced: 1,
    });
    expect(syncFieldReport).toHaveBeenCalledTimes(2);
  });

  it('hands automatic transient failures to the provider retry timer', async () => {
    findSyncCandidates.mockResolvedValueOnce([{ id: 'transient-report' }]);
    jest.mocked(syncFieldReport).mockResolvedValueOnce({
      reportId: 'transient-report',
      status: 'failed',
      error: new SyncError('SERVER_ERROR', 'The server is unavailable.'),
    });

    await expect(syncPendingFieldReports({
      database,
      source: 'startup',
      submitterIdentity: SUBMITTER_ID,
      token: 'secure-token',
    })).resolves.toMatchObject({ haltReason: 'transient-blocker' });
    expect(syncFieldReport).toHaveBeenCalledWith(
      expect.objectContaining({
        allowImmediateRetries: false,
        reportId: 'transient-report',
      }),
    );
  });

  it('stops the current drain after an exhausted transient failure', async () => {
    findSyncCandidates.mockResolvedValueOnce([
      { id: 'transient-report' },
      { id: 'later-report' },
    ]);
    jest.mocked(syncFieldReport).mockResolvedValueOnce({
      reportId: 'transient-report',
      status: 'failed',
      error: new SyncError('SERVER_ERROR', 'The server is unavailable.'),
    });

    await expect(syncPendingFieldReports({
      database,
      source: 'startup',
      submitterIdentity: SUBMITTER_ID,
      token: 'secure-token',
    })).resolves.toMatchObject({
      attempted: 1,
      failed: 1,
      haltReason: 'transient-blocker',
    });
    expect(syncFieldReport).toHaveBeenCalledTimes(1);
    expect(findSyncCandidates).toHaveBeenCalledTimes(1);
  });

  it('drains multiple automatic batches through the safety maximum without requesting another batch', async () => {
    let nextReport = 1;
    const requestedLimits: number[] = [];
    findSyncCandidates.mockImplementation(async (limit: number) => {
      requestedLimits.push(limit);
      return Array.from({ length: limit }, () => ({ id: `report-${nextReport++}` }));
    });
    jest.mocked(syncFieldReport).mockImplementation(async ({ reportId }) => ({
      reportId,
      remoteId: `remote-${reportId}`,
      status: 'synced',
    }));

    const result = await syncPendingFieldReports({
      database,
      source: 'startup',
      submitterIdentity: SUBMITTER_ID,
      token: 'secure-token',
    });

    expect(result).toMatchObject({
      attempted: MAX_SYNC_REPORTS_PER_RUN,
      haltReason: 'run-limit',
      source: 'startup',
      synced: MAX_SYNC_REPORTS_PER_RUN,
    });
    expect(MAX_SYNC_REPORTS_PER_RUN).toBe(50);
    expect(requestedLimits).toEqual([10, 10, 10, 10, 10]);
    expect(findSyncCandidates).toHaveBeenCalledTimes(5);
    expect(findSyncCandidates).toHaveBeenNthCalledWith(
      2,
      10,
      expect.objectContaining({ includeRetryableFailed: true }),
    );
    expect(jest.mocked(syncFieldReport).mock.calls.map(([input]) => input.reportId)).toEqual(
      Array.from({ length: MAX_SYNC_REPORTS_PER_RUN }, (_, index) => `report-${index + 1}`),
    );
  });

  it('queues a replacement session for the same submitter', async () => {
    findSyncCandidates.mockResolvedValue([]);

    const first = syncPendingFieldReports({
      database,
      source: 'startup',
      submitterIdentity: SUBMITTER_ID,
      token: 'first-token',
    });
    const replacement = syncPendingFieldReports({
      database,
      source: 'startup',
      submitterIdentity: SUBMITTER_ID,
      token: 'replacement-token',
    });

    expect(replacement).not.toBe(first);
    await expect(Promise.all([first, replacement])).resolves.toHaveLength(2);
    expect(createFieldReportSyncRepository).toHaveBeenCalledTimes(2);
  });
});
