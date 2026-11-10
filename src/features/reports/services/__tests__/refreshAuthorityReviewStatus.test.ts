import {
  applyAuthorityReviewUpdates,
  findLatestAuthorityReviewUpdatedAt,
} from '@/features/reports/data/fieldReportReviewRepository';
import {
  fetchAllMobileReportStatuses,
  type MobileReportStatusesResult,
} from '@/features/reports/api/mobileReportStatusesApi';
import { refreshAuthorityReviewStatus, invalidateAuthorityReviewStatusRefresh } from '@/features/reports/services/refreshAuthorityReviewStatus';
import {
  clearSyncDownloadProgress,
  createSyncDownloadProgressStore,
} from '@/features/sync/data/syncDownloadProgressStorage';
import {
  readSyncCheckpoint,
  type SyncCheckpoint,
} from '@/features/sync/data/syncCheckpointRepository';
import { emitSyncRecordsChanged } from '@/features/sync/services/syncEvents';

jest.mock('@/features/sync/data/syncCheckpointRepository', () => ({
  ...jest.requireActual('@/features/sync/data/syncCheckpointRepository'),
  readSyncCheckpoint: jest.fn(),
}));
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
const readCheckpoint = jest.mocked(readSyncCheckpoint);

const SYNC_BEFORE = '2026-08-13T12:00:00.000Z';
const HELD: SyncCheckpoint = {
  feed: 'authority_status',
  version: 'v-1',
  total: 250,
  truncated: true,
  pageCount: 3,
  syncBefore: '2026-08-13T11:00:00.000Z',
  fetchedAt: '2026-08-13T11:00:00.000Z',
};

function feed(overrides: Partial<MobileReportStatusesResult> = {}): MobileReportStatusesResult {
  return {
    syncBefore: SYNC_BEFORE,
    updates: [],
    sync: { version: null, total: 0, truncated: false, unchanged: false },
    pageCount: 0,
    ...overrides,
  };
}

beforeEach(() => {
  fetchStatuses.mockReset();
  findLatestUpdatedAt.mockReset();
  applyUpdates.mockReset();
  readCheckpoint.mockReset().mockResolvedValue(null);
  jest.mocked(emitSyncRecordsChanged).mockClear();
  findLatestUpdatedAt.mockResolvedValue('2026-08-13T11:00:00.000Z');
  fetchStatuses.mockResolvedValue(feed());
  applyUpdates.mockResolvedValue({ applied: 0, eligible: 1 });
});

describe('refreshAuthorityReviewStatus', () => {
  it('coalesces concurrent refreshes for the same owner and token', async () => {
    let finish!: (value: MobileReportStatusesResult) => void;
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
      since: null,
      progress: expect.any(Object),
    });

    finish(feed());
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

  // Proves: a Settings clear cannot be undone by a download that was in flight over it.
  it('stores no pages and applies nothing when the owner data is cleared mid-download', async () => {
    let release!: () => void;
    const inFlight = new Promise<void>((resolve) => {
      release = resolve;
    });
    fetchStatuses.mockImplementationOnce(async (options) => {
      const progress = options.progress;
      await inFlight;
      await progress.save('{"page":2}');
      return feed();
    });

    const refresh = refreshAuthorityReviewStatus({
      database,
      submitterIdentity: 'owner-cleared',
      token: 'token-1',
    });
    for (let tick = 0; tick < 20 && fetchStatuses.mock.calls.length === 0; tick += 1) {
      await Promise.resolve();
    }
    invalidateAuthorityReviewStatusRefresh(database, 'owner-cleared');
    await clearSyncDownloadProgress('owner-cleared');
    release();

    await expect(refresh).rejects.toThrow('superseded');
    expect(applyUpdates).not.toHaveBeenCalled();
    await expect(
      createSyncDownloadProgressStore('owner-cleared', 'authority_status', () => true).read(),
    ).resolves.toBeNull();
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

  // Proves: the checkpoint travels with the transaction that applies the feed, carrying the
  // stamps the download measured.
  it('hands the download measurements to the transaction that applies the feed', async () => {
    fetchStatuses.mockResolvedValueOnce(feed({
      sync: { version: 'v-2', total: 251, truncated: false, unchanged: false },
      pageCount: 3,
    }));

    await refreshAuthorityReviewStatus({
      database,
      submitterIdentity: 'owner-1',
      token: 'token-1',
    });

    expect(applyUpdates).toHaveBeenCalledWith(
      database,
      'owner-1',
      [],
      expect.any(String),
      {
        feed: 'authority_status',
        version: 'v-2',
        total: 251,
        truncated: false,
        pageCount: 3,
        syncBefore: SYNC_BEFORE,
        fetchedAt: expect.any(String),
      },
    );
  });

  // Proves: a repeat refresh of an unchanged feed sends the held version, downloads no page, and
  // keeps every held measurement the confirming answer does not repeat.
  // Oracle: the confirming answer reports no total and no truncation, yet the feed still holds 250 rows.
  it('sends the held version and keeps the held measurements when the feed is unchanged', async () => {
    readCheckpoint.mockResolvedValueOnce(HELD);
    fetchStatuses.mockResolvedValueOnce(feed({
      sync: { version: 'v-1', total: 0, truncated: false, unchanged: true },
    }));

    await refreshAuthorityReviewStatus({
      database,
      submitterIdentity: 'owner-1',
      token: 'token-1',
    });

    expect(fetchStatuses).toHaveBeenCalledWith({
      token: 'token-1',
      updatedAfter: '2026-08-13T10:59:59.000Z',
      since: 'v-1',
      progress: expect.any(Object),
    });
    expect(applyUpdates).toHaveBeenCalledWith(
      database,
      'owner-1',
      [],
      expect.any(String),
      expect.objectContaining({ version: 'v-1', total: 250, truncated: true, pageCount: 3 }),
    );
  });
  // Proves: the status cursor reads the stored server checkpoint (sync.before minus overlap), not the newest row.
  it('starts the status cursor from the held checkpoint, ahead of the newest cached row', async () => {
    readCheckpoint.mockResolvedValueOnce({ ...HELD, version: null, syncBefore: '2026-08-13T11:30:00.000Z' });
    findLatestUpdatedAt.mockResolvedValueOnce('2026-08-13T10:00:00.000Z');

    await refreshAuthorityReviewStatus({ database, submitterIdentity: 'owner-cursor', token: 'token-1' });

    expect(fetchStatuses).toHaveBeenCalledWith(
      expect.objectContaining({ updatedAfter: '2026-08-13T11:29:59.000Z' }),
    );
  });

});
