import type { FieldReportSyncRepository } from '@/features/reports/data/fieldReportSyncRepository';
import type { FieldReport } from '@/features/reports/domain/fieldReportTypes';
import { ApiHttpError } from '@/features/shared/api/apiClient';
import { syncFieldReport } from '@/features/sync/services/syncFieldReport';

const REPORT = {
  id: '7ea3e6f0-b893-4fd3-b414-0b797e62ec8e',
  syncStatus: 'pending', remoteId: null,
} as FieldReport;

function repository(): jest.Mocked<FieldReportSyncRepository> {
  return {
    countUnsynced: jest.fn(async () => 1),
    findLastSuccessfulSyncAt: jest.fn(async () => null),
    findById: jest.fn(async () => ({ report: REPORT, scanRecord: {} as never })),
    findSyncCandidates: jest.fn(async () => [REPORT]),
    markFailed: jest.fn(async () => undefined),
    markPending: jest.fn(async () => undefined),
    markSynced: jest.fn(async () => undefined),
    markSyncing: jest.fn(async () => undefined),
    resetStaleSyncingReports: jest.fn(async () => undefined),
  } as unknown as jest.Mocked<FieldReportSyncRepository>;
}

describe('single Field Report synchronization', () => {
  it('marks the same report identity syncing then stores remote identity and sync time', async () => {
    const repo = repository();
    const now = jest.fn()
      .mockReturnValueOnce(new Date('2026-08-10T04:00:00.000Z'))
      .mockReturnValueOnce(new Date('2026-08-10T04:00:01.000Z'));

    await expect(syncFieldReport({
      reportId: REPORT.id, repository: repo, token: 'secure-token', now,
      mapMultipart: jest.fn(() => new FormData()),
      upload: jest.fn(async () => ({ remoteId: 'server-report-uuid' })),
    })).resolves.toMatchObject({
      reportId: REPORT.id, status: 'synced', remoteId: 'server-report-uuid',
    });

    expect(repo.markSyncing).toHaveBeenCalledWith(REPORT.id, '2026-08-10T04:00:00.000Z');
    expect(repo.markSynced).toHaveBeenCalledWith(
      REPORT.id, 'server-report-uuid', '2026-08-10T04:00:01.000Z',
    );
  });

  it('preserves the report and targets the same identity after a retryable failure', async () => {
    const repo = repository();
    const upload = jest.fn()
      .mockRejectedValueOnce(new ApiHttpError(500, 'server failed'))
      .mockResolvedValueOnce({ remoteId: 'server-report-uuid' });
    const delay = jest.fn(async () => undefined);

    await syncFieldReport({
      reportId: REPORT.id, repository: repo, token: 'secure-token', upload, delay,
      mapMultipart: jest.fn(() => new FormData()),
    });

    expect(repo.findById).toHaveBeenCalledWith(REPORT.id);
    expect(repo.markSyncing).toHaveBeenCalledWith(REPORT.id, expect.any(String));
    expect(upload).toHaveBeenCalledTimes(2);
    expect(upload.mock.calls[1]?.[0]).toBe(upload.mock.calls[0]?.[0]);
    expect(delay).toHaveBeenCalledWith(2_000);
    expect(repo.markFailed).not.toHaveBeenCalled();
  });

  it('keeps the bounded immediate retry sequence before persisting a transient failure', async () => {
    const repo = repository();
    const upload = jest.fn(async () => {
      throw new ApiHttpError(503, 'server failed');
    });
    const delay = jest.fn(async (_milliseconds: number) => undefined);

    await expect(syncFieldReport({
      reportId: REPORT.id,
      repository: repo,
      token: 'secure-token',
      upload,
      delay,
      mapMultipart: jest.fn(() => new FormData()),
    })).resolves.toMatchObject({
      reportId: REPORT.id,
      status: 'failed',
      error: { code: 'SERVER_ERROR' },
    });
    expect(upload).toHaveBeenCalledTimes(4);
    expect(delay.mock.calls.map(([milliseconds]) => milliseconds)).toEqual([
      2_000,
      5_000,
      15_000,
    ]);
    expect(repo.markFailed).toHaveBeenCalledWith(
      REPORT.id,
      'SERVER_ERROR',
      expect.any(String),
    );
  });

  it.each([[401, 'AUTH_REQUIRED'], [403, 'API_FORBIDDEN'], [422, 'API_VALIDATION_FAILED']])(
    'stores HTTP %s as a terminal attempt without deleting local evidence',
    async (status, code) => {
      const repo = repository();
      const upload = jest.fn(async () => { throw new ApiHttpError(status, 'rejected'); });
      await expect(syncFieldReport({
        reportId: REPORT.id, repository: repo, token: 'secure-token', upload,
        delay: jest.fn(async () => undefined),
        mapMultipart: jest.fn(() => new FormData()),
      })).resolves.toMatchObject({ status: 'failed', error: { code } });
      expect(repo.markFailed).toHaveBeenCalledWith(REPORT.id, code, expect.any(String));
      expect(repo.markSynced).not.toHaveBeenCalled();
    },
  );
});
