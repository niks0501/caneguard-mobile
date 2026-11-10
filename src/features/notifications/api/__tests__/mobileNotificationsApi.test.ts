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
let warn: jest.SpyInstance;

function page(data: readonly unknown[] = MOBILE_NOTIFICATIONS_V1_FIXTURE.data, next: string | null = null, before = CHECKPOINT) {
  return { data, links: { next }, meta: { per_page: 100 }, sync: { before } };
}

describe('mobile notifications API', () => {
  beforeEach(() => {
    request.mockReset();
    warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => warn.mockRestore());

  it('parses the canonical owner-scoped notification fixture', async () => {
    request.mockResolvedValueOnce(MOBILE_NOTIFICATIONS_V1_FIXTURE);

    await expect(fetchAllMobileNotifications({ token: 'secure-token' })).resolves.toMatchObject({
      syncBefore: CHECKPOINT,
      notifications: [expect.objectContaining({
        id: '4e04321c-a879-423f-875d-4cdce5e028a6',
        eventType: 'field_validation_assigned',
        assignmentUuid: '3fbd7f77-7d6b-4eb0-a1c7-b673f5a2f39f',
        content: 'Visit the farm and record the observed symptoms before submitting the report.',
        advisory: {
          uuid: '2eaf6f1b-1c44-4f9b-95f2-7c8c682c2b5f',
          code: 'CG-ADVISORY-001',
          title: 'Inspect affected leaves',
          content: 'Inspect the affected leaves and capture clear evidence during the visit.',
          status: 'validated',
          selectedAt: '2026-08-13T11:55:00.000Z',
        },
        isRead: false,
      })],
    });
    expect(request).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/mobile/notifications'),
      expect.objectContaining({ token: 'secure-token' }),
    );
  });

  it('defaults newly introduced nullable fields for legacy notification payloads', async () => {
    const { content: _content, advisory: _advisory, ...legacyNotification } = MOBILE_NOTIFICATIONS_V1_FIXTURE.data[0];
    request.mockResolvedValueOnce(page([legacyNotification]));

    await expect(fetchAllMobileNotifications({ token: 'secure-token' })).resolves.toMatchObject({
      notifications: [expect.objectContaining({ content: null, advisory: null })],
    });
  });

  it('skips and warns for malformed items and non-validated advisories', async () => {
    const valid = MOBILE_NOTIFICATIONS_V1_FIXTURE.data[0];
    const nonValidated = {
      ...valid,
      id: '9cc6a6a0-b20f-4ca8-bb7e-1a34cd191e0f',
      advisory: { ...valid.advisory, status: 'draft' },
    };
    const malformed = {
      ...valid,
      id: '0cc6a6a0-b20f-4ca8-bb7e-1a34cd191e0f',
      is_read: 'false',
    };
    request.mockResolvedValueOnce(page([malformed, nonValidated, valid]));

    await expect(fetchAllMobileNotifications({ token: 'secure-token' })).resolves.toMatchObject({
      notifications: [expect.objectContaining({ id: valid.id })],
      partial: true,
    });
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('is_read'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('advisory.status'));
  });

  it('reports a complete refresh when every page item is valid', async () => {
    request.mockResolvedValueOnce(page([MOBILE_NOTIFICATIONS_V1_FIXTURE.data[0]]));

    await expect(fetchAllMobileNotifications({ token: 'secure-token' })).resolves.toMatchObject({
      notifications: [expect.anything()],
      partial: false,
    });
    expect(warn).not.toHaveBeenCalled();
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

  // Proves: the checkpoint total and page count measure the wire, not the surviving rows — a
  // skipped record still occupied a slot on its page.
  // Oracle: two pages of the feed were requested (100 + 1 records), so ceil(101 / 100) = 2 pages.
  it('measures skipped wire records in the total and page count it reports', async () => {
    const valid = MOBILE_NOTIFICATIONS_V1_FIXTURE.data[0];
    const malformed = { ...valid, id: '0cc6a6a0-b20f-4ca8-bb7e-1a34cd191e0f', is_read: 'false' };
    const firstPage = Array.from({ length: 100 }, (_, index) => ({
      ...valid,
      id: `10000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    }));
    const next = `http://127.0.0.1:8000/api/v1/mobile/notifications?cursor=next&sync_before=${encodeURIComponent(CHECKPOINT)}`;
    request
      .mockResolvedValueOnce(page([...firstPage, malformed], next))
      .mockResolvedValueOnce(page([]));

    const result = await fetchAllMobileNotifications({ token: 'secure-token' });

    expect(result.notifications).toHaveLength(100);
    expect(result.partial).toBe(true);
    expect(result.sync).toEqual({ version: null, total: 101, truncated: false, unchanged: false });
    expect(result.pageCount).toBe(2);
  });

  // Proves: the saved page count measures the requests the download actually made, so a feed that
  // answers with short pages still reports every page it took.
  // Oracle: two pages were requested (the first page carries a continuation link).
  it('counts every requested page, not the rows those pages held', async () => {
    const valid = MOBILE_NOTIFICATIONS_V1_FIXTURE.data[0];
    const next = `http://127.0.0.1:8000/api/v1/mobile/notifications?cursor=next&sync_before=${encodeURIComponent(CHECKPOINT)}`;
    request
      .mockResolvedValueOnce(page([valid], next))
      .mockResolvedValueOnce(page([{ ...valid, id: '9cc6a6a0-b20f-4ca8-bb7e-1a34cd191e0f' }]));

    const result = await fetchAllMobileNotifications({ token: 'secure-token' });

    expect(request).toHaveBeenCalledTimes(2);
    expect(result.pageCount).toBe(2);
  });

  // Proves: a reported total that cannot cover the rows delivered is inconsistent and fails the feed
  // closed instead of being saved as the feed's size.
  it('rejects a reported total smaller than the rows it delivered', async () => {
    const valid = MOBILE_NOTIFICATIONS_V1_FIXTURE.data[0];
    request.mockResolvedValueOnce({
      data: [valid, { ...valid, id: '9cc6a6a0-b20f-4ca8-bb7e-1a34cd191e0f' }],
      links: { next: null },
      sync: { before: CHECKPOINT, version: 'v-1', total: 1 },
    });

    await expect(
      fetchAllMobileNotifications({ token: 'secure-token' }),
    ).rejects.toMatchObject({ code: 'MALFORMED_RESPONSE' });
  });

  // Proves: a first download that stops short of the total it was promised is rejected instead of
  // being checkpointed as a complete feed the phone then never refetches.
  // Oracle: the feed reports 250 notifications but delivered one record and no continuation.
  it('rejects a whole-feed answer that delivers fewer rows than its total', async () => {
    request.mockResolvedValueOnce({
      data: [MOBILE_NOTIFICATIONS_V1_FIXTURE.data[0]],
      links: { next: null },
      sync: { before: CHECKPOINT, version: 'v-1', total: 250 },
    });

    await expect(
      fetchAllMobileNotifications({ token: 'secure-token' }),
    ).rejects.toMatchObject({ code: 'MALFORMED_RESPONSE' });
  });

  // Proves: the same short answer is legitimate once the phone asked for what changed past a held
  // version, because the total then describes the whole feed, not this answer.
  it('accepts a version-scoped answer that delivers fewer rows than the feed total', async () => {
    request.mockResolvedValueOnce({
      data: [MOBILE_NOTIFICATIONS_V1_FIXTURE.data[0]],
      links: { next: null },
      sync: { before: CHECKPOINT, version: 'v-2', total: 250 },
    });

    await expect(
      fetchAllMobileNotifications({ token: 'secure-token', since: 'v-1' }),
    ).resolves.toMatchObject({
      sync: { version: 'v-2', total: 250, unchanged: false },
      pageCount: 1,
    });
  });

  // Proves: with a version stamp the phone asks only for what changed past that version.
  it('sends the held version and reports an unchanged feed as zero pages', async () => {
    request.mockResolvedValueOnce({
      data: [],
      links: { next: null },
      meta: { per_page: 100, total: 250 },
      sync: { before: CHECKPOINT, version: 'v-1', total: 250, unchanged: true },
    });

    await expect(
      fetchAllMobileNotifications({ token: 'secure-token', since: 'v-1' }),
    ).resolves.toEqual({
      syncBefore: CHECKPOINT,
      notifications: [],
      partial: false,
      sync: { version: 'v-1', total: 250, truncated: false, unchanged: true },
      pageCount: 0,
    });
    expect(String(request.mock.calls[0][0])).toContain('since=v-1');
  });

  // Proves: the reported total bounds the download, so a feed that claims to be empty cannot keep
  // paginating past what it promised.
  it('rejects pagination that runs past the total the feed reported', async () => {
    const next = `http://127.0.0.1:8000/api/v1/mobile/notifications?cursor=next&sync_before=${encodeURIComponent(CHECKPOINT)}`;
    request.mockResolvedValueOnce({
      data: [],
      links: { next },
      sync: { before: CHECKPOINT, version: 'v-1', total: 0 },
    });

    await expect(
      fetchAllMobileNotifications({ token: 'secure-token' }),
    ).rejects.toMatchObject({ code: 'MALFORMED_RESPONSE' });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('keeps valid values when another item is malformed', async () => {
    const valid = MOBILE_NOTIFICATIONS_V1_FIXTURE.data[0];
    request.mockResolvedValueOnce(page([
      { ...valid, id: '0cc6a6a0-b20f-4ca8-bb7e-1a34cd191e0f', is_read: 'false' },
      valid,
    ]));

    await expect(fetchAllMobileNotifications({ token: 'secure-token' })).resolves.toMatchObject({
      notifications: [expect.objectContaining({ id: valid.id })],
      partial: true,
    });
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

  it('rejects a read response for a different notification identity', async () => {
    request.mockResolvedValueOnce({
      data: { ...MOBILE_NOTIFICATIONS_V1_FIXTURE.data[0], is_read: true, read_at: CHECKPOINT },
      meta: { unread_count: 0 },
    });

    await expect(
      markMobileNotificationRead({
        id: '9cc6a6a0-b20f-4ca8-bb7e-1a34cd191e0f',
        token: 'secure-token',
      }),
    ).rejects.toMatchObject<Partial<MobileNotificationsApiError>>({ code: 'MALFORMED_RESPONSE' });
  });

  it('rejects read-all counts that are not non-negative integers', async () => {
    request.mockResolvedValueOnce({ data: [], meta: { marked_count: 1.5, unread_count: 0 } });

    await expect(
      markAllMobileNotificationsRead({ token: 'secure-token' }),
    ).rejects.toMatchObject<Partial<MobileNotificationsApiError>>({ code: 'MALFORMED_RESPONSE' });
  });

});
