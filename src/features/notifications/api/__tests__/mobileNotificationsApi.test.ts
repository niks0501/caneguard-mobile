import { ApiHttpError, apiRequest } from '@/features/shared/api/apiClient';
import { MOBILE_NOTIFICATIONS_V1_FIXTURE } from '@/features/notifications/api/__fixtures__/mobileNotificationsV1';
import {
  fetchAllMobileNotifications,
  markAllMobileNotificationsRead,
  markMobileNotificationRead,
  MobileNotificationsApiError,
} from '@/features/notifications/api/mobileNotificationsApi';

jest.mock('@/features/shared/api/apiClient', () => ({
  ApiHttpError: class ApiHttpError extends Error {
    readonly status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
  apiRequest: jest.fn(),
}));

const request = jest.mocked(apiRequest);
const CHECKPOINT = '2026-08-13T12:05:00.000Z';

function page(data: readonly unknown[] = MOBILE_NOTIFICATIONS_V1_FIXTURE.data, next: string | null = null, before = CHECKPOINT) {
  return { data, links: { next }, meta: { per_page: 100 }, sync: { before } };
}

describe('mobile notifications API', () => {
  beforeEach(() => request.mockReset());

  it('parses the canonical owner-scoped notification fixture', async () => {
    request.mockResolvedValueOnce(MOBILE_NOTIFICATIONS_V1_FIXTURE);

    await expect(fetchAllMobileNotifications({ token: 'secure-token' })).resolves.toMatchObject({
      syncBefore: CHECKPOINT,
      notifications: [expect.objectContaining({
        id: '4e04321c-a879-423f-875d-4cdce5e028a6',
        eventType: 'field_validation_assigned',
        assignmentUuid: '3fbd7f77-7d6b-4eb0-a1c7-b673f5a2f39f',
        isRead: false,
      })],
    });
    expect(request).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/mobile/notifications'),
      expect.objectContaining({ token: 'secure-token' }),
    );
  });

  it('follows pagination with one stable checkpoint and rejects duplicate notification ids', async () => {
    const next = `http://127.0.0.1:8000/api/v1/mobile/notifications?cursor=next&sync_before=${encodeURIComponent(CHECKPOINT)}`;
    const second = { ...MOBILE_NOTIFICATIONS_V1_FIXTURE.data[0], id: '9cc6a6a0-b20f-4ca8-bb7e-1a34cd191e0f' };
    request
      .mockResolvedValueOnce(page([MOBILE_NOTIFICATIONS_V1_FIXTURE.data[0]], next))
      .mockResolvedValueOnce(page([second]));

    await expect(fetchAllMobileNotifications({ token: 'secure-token' })).resolves.toMatchObject({
      notifications: [expect.anything(), expect.anything()],
    });
    expect(request).toHaveBeenNthCalledWith(2, expect.stringContaining('/api/v1/mobile/notifications?cursor=next'), expect.objectContaining({ token: 'secure-token' }));

    request.mockReset().mockResolvedValueOnce(page([
      MOBILE_NOTIFICATIONS_V1_FIXTURE.data[0],
      MOBILE_NOTIFICATIONS_V1_FIXTURE.data[0],
    ]));
    await expect(fetchAllMobileNotifications({ token: 'secure-token' })).rejects.toMatchObject<Partial<MobileNotificationsApiError>>({ code: 'MALFORMED_RESPONSE' });
  });

  it('rejects unsafe continuations and changed checkpoints', async () => {
    request.mockResolvedValueOnce(page([], 'https://evil.example.test/api/v1/mobile/notifications'));
    await expect(fetchAllMobileNotifications({ token: 'secure-token' })).rejects.toMatchObject({ code: 'ORIGIN_MISMATCH' });

    request.mockReset();
    const next = `http://127.0.0.1:8000/api/v1/mobile/notifications?cursor=next&sync_before=${encodeURIComponent(CHECKPOINT)}`;
    request.mockResolvedValueOnce(page([], next)).mockResolvedValueOnce(page([], null, '2026-08-13T12:06:00.000Z'));
    await expect(fetchAllMobileNotifications({ token: 'secure-token' })).rejects.toMatchObject({ code: 'MALFORMED_RESPONSE' });
  });

  it.each([[401, 'AUTH_REQUIRED'], [403, 'CAPABILITY_UNAVAILABLE'], [404, 'CAPABILITY_UNAVAILABLE']] as const)(
    'maps HTTP %s to %s', async (status, code) => {
      request.mockRejectedValueOnce(new ApiHttpError(status, 'rejected'));
      await expect(fetchAllMobileNotifications({ token: 'secure-token' })).rejects.toMatchObject({ code });
    },
  );

  it('rejects malformed values before they reach the cache', async () => {
    request.mockResolvedValueOnce(page([{ ...MOBILE_NOTIFICATIONS_V1_FIXTURE.data[0], is_read: 'false' }]));
    await expect(fetchAllMobileNotifications({ token: 'secure-token' })).rejects.toMatchObject({ code: 'MALFORMED_RESPONSE' });
  });
  it('marks one notification read through the owner-scoped endpoint', async () => {
    request.mockResolvedValueOnce({
      data: { ...MOBILE_NOTIFICATIONS_V1_FIXTURE.data[0], is_read: true, read_at: CHECKPOINT },
      meta: { unread_count: 0 },
    });

    await expect(
      markMobileNotificationRead({
        id: MOBILE_NOTIFICATIONS_V1_FIXTURE.data[0].id,
        token: 'secure-token',
      }),
    ).resolves.toMatchObject({
      notification: { id: MOBILE_NOTIFICATIONS_V1_FIXTURE.data[0].id, isRead: true, readAt: CHECKPOINT },
      unreadCount: 0,
    });
    expect(request).toHaveBeenCalledWith(
      expect.stringContaining(`/api/v1/mobile/notifications/${MOBILE_NOTIFICATIONS_V1_FIXTURE.data[0].id}/read`),
      expect.objectContaining({ method: 'PATCH', token: 'secure-token' }),
    );
  });

  it('marks every notification read and reads the returned counts', async () => {
    request.mockResolvedValueOnce({
      data: [],
      meta: { marked_count: 4, unread_count: 0 },
    });

    await expect(
      markAllMobileNotificationsRead({ token: 'secure-token' }),
    ).resolves.toEqual({ markedCount: 4, unreadCount: 0 });
    expect(request).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/mobile/notifications/read-all'),
      expect.objectContaining({ method: 'POST', token: 'secure-token' }),
    );
  });

  it('rejects a read response that omits the acknowledged item', async () => {
    request.mockResolvedValueOnce({ data: [], meta: { unread_count: 1 } });

    await expect(
      markMobileNotificationRead({ id: 'missing', token: 'secure-token' }),
    ).rejects.toMatchObject<Partial<MobileNotificationsApiError>>({ code: 'MALFORMED_RESPONSE' });
  });

  it('rejects read-all counts that are not non-negative integers', async () => {
    request.mockResolvedValueOnce({ data: [], meta: { marked_count: 1.5, unread_count: 0 } });

    await expect(
      markAllMobileNotificationsRead({ token: 'secure-token' }),
    ).rejects.toMatchObject<Partial<MobileNotificationsApiError>>({ code: 'MALFORMED_RESPONSE' });
  });

});
