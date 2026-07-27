import { ApiHttpError } from '@/features/shared/api/apiClient';
import type { ScanRecordSyncRepository } from '@/features/records/data/scanRecordSyncRepository';
import type { ScanRecordDetails } from '@/features/records/domain/recordTypes';
import { syncScanRecord } from '@/features/sync/services/syncScanRecord';

const RECORD = {
  id: '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2',
  syncStatus: 'pending',
  remoteId: null,
} as ScanRecordDetails;

function repository(): jest.Mocked<ScanRecordSyncRepository> {
  return {
    countUnsynced: jest.fn(async () => 1),
    findLastSuccessfulSyncAt: jest.fn(async () => null),
    findById: jest.fn(async () => RECORD),
    findSyncCandidates: jest.fn(async () => [RECORD]),
    markFailed: jest.fn(async () => undefined),
    markPending: jest.fn(async () => undefined),
    markSynced: jest.fn(async () => undefined),
    markSyncing: jest.fn(async () => undefined),
    resetStaleSyncingRecords: jest.fn(async () => undefined),
  } as unknown as jest.Mocked<ScanRecordSyncRepository>;
}

describe('single-record synchronization', () => {
  it('marks syncing then persists the server UUID on success', async () => {
    const repo = repository();
    const now = jest
      .fn()
      .mockReturnValueOnce(new Date('2026-07-27T01:00:00.000Z'))
      .mockReturnValueOnce(new Date('2026-07-27T01:00:01.000Z'));

    await expect(
      syncScanRecord({
        recordId: RECORD.id,
        repository: repo,
        token: 'secure-token',
        now,
        mapMultipart: jest.fn(() => new FormData()),
        upload: jest.fn(async () => ({ remoteId: 'server-report-uuid' })),
      }),
    ).resolves.toMatchObject({
      status: 'synced',
      remoteId: 'server-report-uuid',
    });

    expect(repo.markSyncing).toHaveBeenCalledWith(
      RECORD.id,
      '2026-07-27T01:00:00.000Z',
    );
    expect(repo.markSynced).toHaveBeenCalledWith(
      RECORD.id,
      'server-report-uuid',
      '2026-07-27T01:00:01.000Z',
    );
    expect(repo.markFailed).not.toHaveBeenCalled();
  });

  it('retries a server failure with bounded delays', async () => {
    const repo = repository();
    const upload = jest
      .fn()
      .mockRejectedValueOnce(new ApiHttpError(500, 'server failed'))
      .mockResolvedValueOnce({ remoteId: 'server-report-uuid' });
    const delay = jest.fn(async () => undefined);

    await syncScanRecord({
      recordId: RECORD.id,
      repository: repo,
      token: 'secure-token',
      mapMultipart: jest.fn(() => new FormData()),
      upload,
      delay,
    });

    expect(upload).toHaveBeenCalledTimes(2);
    expect(delay).toHaveBeenCalledWith(2_000);
  });

  it.each([
    [401, 'AUTH_REQUIRED'],
    [403, 'API_FORBIDDEN'],
    [422, 'API_VALIDATION_FAILED'],
  ])('does not retry HTTP %s', async (status, code) => {
    const repo = repository();
    const upload = jest.fn(async () => {
      throw new ApiHttpError(status, 'rejected');
    });
    const delay = jest.fn(async () => undefined);

    await expect(
      syncScanRecord({
        recordId: RECORD.id,
        repository: repo,
        token: 'secure-token',
        mapMultipart: jest.fn(() => new FormData()),
        upload,
        delay,
      }),
    ).resolves.toMatchObject({
      status: 'failed',
      error: { code },
    });
    expect(upload).toHaveBeenCalledTimes(1);
    expect(delay).not.toHaveBeenCalled();
    expect(repo.markFailed).toHaveBeenCalledWith(
      RECORD.id,
      code,
      expect.any(String),
    );
  });
});
