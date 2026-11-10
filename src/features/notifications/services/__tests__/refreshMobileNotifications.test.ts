import {
  fetchAllMobileNotifications,
  type MobileNotificationsResult,
} from '@/features/notifications/api/mobileNotificationsApi';
import {
  confirmCachedMobileNotifications,
  listCachedMobileNotifications,
  replaceCachedMobileNotifications,
} from '@/features/notifications/data/notificationCacheRepository';
import type {
  MobileNotification,
  MobileNotificationUpdate,
} from '@/features/notifications/domain/notificationTypes';
import {
  invalidateMobileNotificationsRefresh,
  refreshMobileNotifications,
} from '@/features/notifications/services/refreshMobileNotifications';
import {
  readSyncCheckpoint,
  type SyncCheckpoint,
} from '@/features/sync/data/syncCheckpointRepository';

jest.mock('@/features/notifications/api/mobileNotificationsApi', () => ({
  fetchAllMobileNotifications: jest.fn(),
}));
jest.mock('@/features/notifications/data/notificationCacheRepository', () => ({
  confirmCachedMobileNotifications: jest.fn(),
  listCachedMobileNotifications: jest.fn(),
  replaceCachedMobileNotifications: jest.fn(),
}));
jest.mock('@/features/sync/data/syncCheckpointRepository', () => ({
  ...jest.requireActual('@/features/sync/data/syncCheckpointRepository'),
  readSyncCheckpoint: jest.fn(),
}));

const database = {} as never;
const fetchNotifications = jest.mocked(fetchAllMobileNotifications);
const listCache = jest.mocked(listCachedMobileNotifications);
const replaceCache = jest.mocked(replaceCachedMobileNotifications);
const confirmCache = jest.mocked(confirmCachedMobileNotifications);
const readCheckpoint = jest.mocked(readSyncCheckpoint);

const SYNC_BEFORE = '2026-08-13T12:05:00.000Z';
const CACHED: MobileNotification[] = [{
  id: '4e04321c-a879-423f-875d-4cdce5e028a6',
  ownerIdentity: 'owner-1',
  eventType: 'field_validation_assigned',
  title: 'Assignment',
  message: 'Assignment ready.',
  caseUuid: null,
  referenceCode: null,
  assignmentUuid: null,
  content: null,
  advisory: null,
  isRead: false,
  readAt: null,
  createdAt: '2026-08-13T12:00:00.000Z',
  cachedAt: '2026-08-13T12:01:00.000Z',
}];
const NEWLY_FETCHED: MobileNotificationUpdate = {
  id: '9cc6a6a0-b20f-4ca8-bb7e-1a34cd191e0f',
  eventType: 'authority.reviewed',
  title: 'Review complete',
  message: 'The office reviewed a report.',
  caseUuid: null,
  referenceCode: null,
  assignmentUuid: null,
  content: null,
  advisory: null,
  isRead: false,
  readAt: null,
  createdAt: '2026-08-13T12:02:00.000Z',
};
const HELD: SyncCheckpoint = {
  feed: 'notifications',
  version: 'v-1',
  total: 250,
  truncated: true,
  pageCount: 3,
  syncBefore: '2026-08-13T12:00:00.000Z',
  fetchedAt: '2026-08-13T12:00:00.000Z',
};

function feed(overrides: Partial<MobileNotificationsResult> = {}): MobileNotificationsResult {
  return {
    syncBefore: SYNC_BEFORE,
    notifications: [],
    partial: false,
    sync: { version: null, total: 0, truncated: false, unchanged: false },
    pageCount: 0,
    ...overrides,
  };
}

describe('refreshMobileNotifications', () => {
  beforeEach(() => {
    fetchNotifications.mockReset();
    listCache.mockReset().mockResolvedValue(CACHED);
    replaceCache.mockReset().mockResolvedValue(undefined);
    confirmCache.mockReset().mockResolvedValue(undefined);
    readCheckpoint.mockReset().mockResolvedValue(null);
  });

  it('coalesces concurrent refreshes for the same owner and token', async () => {
    let finish!: (value: MobileNotificationsResult) => void;
    fetchNotifications.mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));

    const first = refreshMobileNotifications({ database, ownerIdentity: 'owner-1', token: 'token-1' });
    const second = refreshMobileNotifications({ database, ownerIdentity: 'owner-1', token: 'token-1' });
    await Promise.resolve();
    expect(second).toBe(first);
    expect(fetchNotifications).toHaveBeenCalledTimes(1);

    finish(feed());
    await expect(first).resolves.toMatchObject({ notifications: CACHED });
    expect(replaceCache).toHaveBeenCalledWith(
      database,
      'owner-1',
      [],
      expect.any(String),
      expect.any(Function),
      expect.objectContaining({ feed: 'notifications', syncBefore: SYNC_BEFORE }),
    );
  });

  it('does not replace the cache after a network failure', async () => {
    fetchNotifications.mockRejectedValueOnce(new Error('offline'));

    await expect(refreshMobileNotifications({ database, ownerIdentity: 'owner-1', token: 'token-1' })).rejects.toThrow('offline');
    expect(replaceCache).not.toHaveBeenCalled();
  });

  it('does not write a response after local data is invalidated', async () => {
    let finish!: (value: MobileNotificationsResult) => void;
    fetchNotifications.mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));

    const refresh = refreshMobileNotifications({ database, ownerIdentity: 'owner-1', token: 'token-1' });
    invalidateMobileNotificationsRefresh(database, 'owner-1');
    finish(feed());

    await expect(refresh).rejects.toThrow('superseded');
    expect(replaceCache).not.toHaveBeenCalled();
  });

  it('preserves cached items while applying valid items from a partial feed', async () => {
    fetchNotifications.mockResolvedValueOnce(feed({
      notifications: [NEWLY_FETCHED],
      partial: true,
    }));

    await refreshMobileNotifications({ database, ownerIdentity: 'owner-1', token: 'token-1' });

    expect(replaceCache).toHaveBeenCalledWith(
      database,
      'owner-1',
      [expect.objectContaining({ id: CACHED[0].id }), NEWLY_FETCHED],
      expect.any(String),
      expect.any(Function),
      expect.anything(),
    );
  });

  it('keeps owner and token refreshes independent', async () => {
    fetchNotifications.mockResolvedValue(feed());

    await Promise.all([
      refreshMobileNotifications({ database, ownerIdentity: 'owner-1', token: 'token-1' }),
      refreshMobileNotifications({ database, ownerIdentity: 'owner-2', token: 'token-2' }),
    ]);

    expect(fetchNotifications).toHaveBeenCalledTimes(2);
    expect(fetchNotifications).toHaveBeenCalledWith({ token: 'token-1', since: null });
    expect(fetchNotifications).toHaveBeenCalledWith({ token: 'token-2', since: null });
  });

  // Proves: the checkpoint persisted with the cache carries the stamps the download measured,
  // not values rebuilt from the parsed rows.
  it('records the download measurements with the cache they describe', async () => {
    fetchNotifications.mockResolvedValueOnce(feed({
      notifications: [NEWLY_FETCHED],
      sync: { version: 'v-2', total: 251, truncated: false, unchanged: false },
      pageCount: 3,
    }));

    await refreshMobileNotifications({ database, ownerIdentity: 'owner-1', token: 'token-1' });

    expect(replaceCache).toHaveBeenCalledWith(
      database,
      'owner-1',
      [NEWLY_FETCHED],
      expect.any(String),
      expect.any(Function),
      {
        feed: 'notifications',
        version: 'v-2',
        total: 251,
        truncated: false,
        pageCount: 3,
        syncBefore: SYNC_BEFORE,
        fetchedAt: expect.any(String),
      },
    );
    expect(confirmCache).not.toHaveBeenCalled();
  });

  // Proves: a repeat refresh of an unchanged feed sends the held version, downloads no page,
  // and keeps the cached rows together with every held measurement the answer does not repeat.
  // Oracle: the confirming answer reports no total and no truncation, yet the feed still holds 250 rows.
  it('sends the held version and keeps the held measurements when the feed is unchanged', async () => {
    readCheckpoint.mockResolvedValueOnce(HELD);
    fetchNotifications.mockResolvedValueOnce(feed({
      sync: { version: 'v-1', total: 0, truncated: false, unchanged: true },
    }));

    await refreshMobileNotifications({ database, ownerIdentity: 'owner-1', token: 'token-1' });

    expect(fetchNotifications).toHaveBeenCalledWith({ token: 'token-1', since: 'v-1' });
    expect(replaceCache).not.toHaveBeenCalled();
    expect(confirmCache).toHaveBeenCalledWith(
      database,
      'owner-1',
      expect.any(String),
      {
        feed: 'notifications',
        version: 'v-1',
        total: 250,
        truncated: true,
        pageCount: 3,
        syncBefore: SYNC_BEFORE,
        fetchedAt: expect.any(String),
      },
      expect.any(Function),
    );
  });

  // Proves: an answer scoped to the held version is a delta, so it is merged with the rows the
  // phone already holds instead of replacing them.
  it('merges a version-scoped delta into the cached rows', async () => {
    readCheckpoint.mockResolvedValueOnce(HELD);
    fetchNotifications.mockResolvedValueOnce(feed({
      notifications: [NEWLY_FETCHED],
      sync: { version: 'v-2', total: 251, truncated: false, unchanged: false },
      pageCount: 1,
    }));

    await refreshMobileNotifications({ database, ownerIdentity: 'owner-1', token: 'token-1' });

    expect(fetchNotifications).toHaveBeenCalledWith({ token: 'token-1', since: 'v-1' });
    expect(replaceCache).toHaveBeenCalledWith(
      database,
      'owner-1',
      [expect.objectContaining({ id: CACHED[0].id }), NEWLY_FETCHED],
      expect.any(String),
      expect.any(Function),
      expect.objectContaining({ version: 'v-2', total: 251, pageCount: 1 }),
    );
  });
});
