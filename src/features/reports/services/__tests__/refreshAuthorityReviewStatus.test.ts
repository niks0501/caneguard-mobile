import {
  applyAuthorityReviewUpdates,
  findLatestAuthorityReviewUpdatedAt,
} from '@/features/reports/data/fieldReportReviewRepository';
import { fetchAllMobileReportStatuses } from '@/features/reports/api/mobileReportStatusesApi';
import { refreshAuthorityReviewStatus } from '@/features/reports/services/refreshAuthorityReviewStatus';
import { emitSyncRecordsChanged } from '@/features/sync/services/syncEvents';

jest.mock('@/features/reports/data/fieldReportReviewRepository', () => ({
  applyAuthorityReviewUpdates: jest.fn(),
  findLatestAuthorityReviewUpdatedAt: jest.fn(),
}));
jest.mock('@/features/reports/api/mobileReportStatusesApi', () => ({
  fetchAllMobileReportStatuses: jest.fn(),
}));
jest.mock('@/features/sync/services/syncEvents', () => ({
  emitSyncRecordsChanged: jest.fn(),
}));

const database = {} as never;
const fetchStatuses = jest.mocked(fetchAllMobileReportStatuses);
const findLatestUpdatedAt = jest.mocked(findLatestAuthorityReviewUpdatedAt);
const applyUpdates = jest.mocked(applyAuthorityReviewUpdates);

beforeEach(() => {
  fetchStatuses.mockReset();
  findLatestUpdatedAt.mockReset();
  applyUpdates.mockReset();
  jest.mocked(emitSyncRecordsChanged).mockClear();
  findLatestUpdatedAt.mockResolvedValue('2026-08-13T11:00:00.000Z');
  fetchStatuses.mockResolvedValue({ syncBefore: '2026-08-13T12:00:00.000Z', updates: [] });
  applyUpdates.mockResolvedValue({ applied: 0, eligible: 1 });
});

describe('refreshAuthorityReviewStatus', () => {
  it('coalesces concurrent refreshes for the same owner and token', async () => {
    let finish!: (value: { syncBefore: string; updates: [] }) => void;
    fetchStatuses.mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));

    const first = refreshAuthorityReviewStatus({
      database,
      submitterIdentity: 'owner-1',
      token: 'token-1',
    });
    const second = refreshAuthorityReviewStatus({
      database,
      submitterIdentity: 'owner-1',
      token: 'token-1',
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(second).toBe(first);
    expect(fetchStatuses).toHaveBeenCalledTimes(1);
    expect(fetchStatuses).toHaveBeenCalledWith({
      token: 'token-1',
      updatedAfter: '2026-08-13T10:59:59.000Z',
    });

    finish({ syncBefore: '2026-08-13T12:00:00.000Z', updates: [] });
    await expect(first).resolves.toMatchObject({ applied: 0 });
    expect(applyUpdates).toHaveBeenCalledTimes(1);
    expect(emitSyncRecordsChanged).toHaveBeenCalledTimes(1);
  });

  it('does not apply or advance the cache after a page/network failure', async () => {
    fetchStatuses.mockRejectedValueOnce(new Error('timeout after page one'));

    await expect(
      refreshAuthorityReviewStatus({
        database,
        submitterIdentity: 'owner-1',
        token: 'token-1',
      }),
    ).rejects.toThrow('timeout after page one');
    expect(applyUpdates).not.toHaveBeenCalled();
    expect(emitSyncRecordsChanged).not.toHaveBeenCalled();
  });

  it('keeps account and token refreshes independent', async () => {
    await Promise.all([
      refreshAuthorityReviewStatus({ database, submitterIdentity: 'owner-1', token: 'token-1' }),
      refreshAuthorityReviewStatus({ database, submitterIdentity: 'owner-2', token: 'token-2' }),
    ]);

    expect(fetchStatuses).toHaveBeenCalledTimes(2);
    expect(applyUpdates).toHaveBeenCalledTimes(2);
    expect(fetchStatuses).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'token-1' }),
    );
    expect(fetchStatuses).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'token-2' }),
    );
  });
});
