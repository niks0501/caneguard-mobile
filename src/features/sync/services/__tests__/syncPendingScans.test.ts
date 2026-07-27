import type { CaneGuardDatabase } from '@/database/database';
import { waitFor } from '@testing-library/react-native';
import { createScanRecordSyncRepository } from '@/features/records/data/scanRecordSyncRepository';
import { SyncError } from '@/features/sync/errors/syncErrors';
import { syncPendingScans } from '@/features/sync/services/syncPendingScans';
import { syncScanRecord } from '@/features/sync/services/syncScanRecord';

jest.mock('@/features/records/data/scanRecordSyncRepository', () => ({
  createScanRecordSyncRepository: jest.fn(),
}));
jest.mock('@/features/sync/services/syncScanRecord', () => ({
  syncScanRecord: jest.fn(),
}));

const database = {} as CaneGuardDatabase;
const mockCreateRepository = jest.mocked(createScanRecordSyncRepository);
const mockSyncRecord = jest.mocked(syncScanRecord);
const findSyncCandidates = jest.fn();
const repository = {
  findSyncCandidates,
};

describe('pending synchronization queue', () => {
  beforeEach(() => {
    mockCreateRepository.mockReturnValue(repository as never);
  });

  it('coalesces concurrent queue triggers into one sequential run', async () => {
    findSyncCandidates.mockResolvedValueOnce([{ id: 'record-1' }]);
    let finish!: () => void;
    mockSyncRecord.mockReturnValueOnce(
      new Promise((resolve) => {
        finish = () =>
          resolve({
            recordId: 'record-1',
            remoteId: 'remote-1',
            status: 'synced',
          });
      }),
    );

    const first = syncPendingScans({
      database,
      source: 'startup',
      token: 'secure-token',
    });
    const second = syncPendingScans({
      database,
      source: 'network-restored',
      token: 'secure-token',
    });

    expect(second).toBe(first);
    await waitFor(() => expect(mockSyncRecord).toHaveBeenCalledTimes(1));
    finish();
    await expect(first).resolves.toMatchObject({
      attempted: 1,
      synced: 1,
      source: 'startup',
    });
  });

  it('stops the batch after an authentication failure', async () => {
    findSyncCandidates.mockResolvedValueOnce([
      { id: 'record-1' },
      { id: 'record-2' },
    ]);
    mockSyncRecord.mockResolvedValueOnce({
      recordId: 'record-1',
      status: 'failed',
      error: new SyncError('AUTH_REQUIRED', 'Sign in again.'),
    });

    await expect(
      syncPendingScans({
        database,
        source: 'manual',
        token: 'expired-token',
      }),
    ).resolves.toMatchObject({
      attempted: 1,
      authRequired: true,
      failed: 1,
    });
    expect(mockSyncRecord).toHaveBeenCalledTimes(1);
    expect(findSyncCandidates).toHaveBeenCalledWith(10, true);
  });
});
