import { waitFor } from '@testing-library/react-native';

import type { CaneGuardDatabase } from '@/database/database';
import { createFieldReportSyncRepository } from '@/features/reports/data/fieldReportSyncRepository';
import { SyncError } from '@/features/sync/errors/syncErrors';
import { syncFieldReport } from '@/features/sync/services/syncFieldReport';
import { syncPendingFieldReports } from '@/features/sync/services/syncPendingFieldReports';

jest.mock('@/features/reports/data/fieldReportSyncRepository', () => ({
  createFieldReportSyncRepository: jest.fn(),
}));
jest.mock('@/features/sync/services/syncFieldReport', () => ({ syncFieldReport: jest.fn() }));

const database = {} as CaneGuardDatabase;
const SUBMITTER_ID = 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17';
const OTHER_SUBMITTER_ID = '51214146-7439-48e0-aef4-d0e003f194b4';
const findSyncCandidates = jest.fn();
const repository = { findSyncCandidates };

describe('pending Field Report queue', () => {
  beforeEach(() => {
    jest.mocked(createFieldReportSyncRepository).mockReturnValue(repository as never);
  });

  it('coalesces concurrent foreground triggers into one sequential run', async () => {
    findSyncCandidates.mockResolvedValueOnce([{ id: 'report-1' }]);
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
    expect(findSyncCandidates).toHaveBeenCalledWith(10, true);
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
