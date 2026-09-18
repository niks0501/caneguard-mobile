import { fetchAllMobileNotifications } from '@/features/notifications/api/mobileNotificationsApi';
import {
  listCachedMobileNotifications,
  replaceCachedMobileNotifications,
} from '@/features/notifications/data/notificationCacheRepository';
import type { MobileNotification } from '@/features/notifications/domain/notificationTypes';
import { refreshMobileNotifications } from '@/features/notifications/services/refreshMobileNotifications';

jest.mock('@/features/notifications/api/mobileNotificationsApi', () => ({
  fetchAllMobileNotifications: jest.fn(),
}));
jest.mock('@/features/notifications/data/notificationCacheRepository', () => ({
  listCachedMobileNotifications: jest.fn(),
  replaceCachedMobileNotifications: jest.fn(),
}));

const database = {} as never;
const fetchNotifications = jest.mocked(fetchAllMobileNotifications);
const listCache = jest.mocked(listCachedMobileNotifications);
const replaceCache = jest.mocked(replaceCachedMobileNotifications);
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

describe('refreshMobileNotifications', () => {
  beforeEach(() => {
    fetchNotifications.mockReset();
    listCache.mockReset().mockResolvedValue(CACHED);
    replaceCache.mockReset().mockResolvedValue(undefined);
  });

  it('coalesces concurrent refreshes for the same owner and token', async () => {
    let finish!: (value: { syncBefore: string; notifications: [] }) => void;
    fetchNotifications.mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));

    const first = refreshMobileNotifications({ database, ownerIdentity: 'owner-1', token: 'token-1' });
    const second = refreshMobileNotifications({ database, ownerIdentity: 'owner-1', token: 'token-1' });
    await Promise.resolve();
    expect(second).toBe(first);
    expect(fetchNotifications).toHaveBeenCalledTimes(1);

    finish({ syncBefore: '2026-08-13T12:05:00.000Z', notifications: [] });
    await expect(first).resolves.toMatchObject({ notifications: CACHED });
    expect(replaceCache).toHaveBeenCalledWith(database, 'owner-1', [], expect.any(String));
  });

  it('does not replace the cache after a network failure', async () => {
    fetchNotifications.mockRejectedValueOnce(new Error('offline'));

    await expect(refreshMobileNotifications({ database, ownerIdentity: 'owner-1', token: 'token-1' })).rejects.toThrow('offline');
    expect(replaceCache).not.toHaveBeenCalled();
  });

  it('keeps owner and token refreshes independent', async () => {
    fetchNotifications.mockResolvedValue({ syncBefore: '2026-08-13T12:05:00.000Z', notifications: [] });

    await Promise.all([
      refreshMobileNotifications({ database, ownerIdentity: 'owner-1', token: 'token-1' }),
      refreshMobileNotifications({ database, ownerIdentity: 'owner-2', token: 'token-2' }),
    ]);

    expect(fetchNotifications).toHaveBeenCalledTimes(2);
    expect(fetchNotifications).toHaveBeenCalledWith({ token: 'token-1' });
    expect(fetchNotifications).toHaveBeenCalledWith({ token: 'token-2' });
  });
});
