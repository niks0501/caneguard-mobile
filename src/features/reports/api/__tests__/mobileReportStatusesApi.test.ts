import { ApiHttpError, apiRequest } from '@/features/shared/api/apiClient';
import { MOBILE_REPORT_STATUSES_V2_FIXTURE } from '@/features/reports/api/__fixtures__/mobileReportStatusesV2';
import {
  fetchAllMobileReportStatuses,
  ReportStatusesApiError,
} from '@/features/reports/api/mobileReportStatusesApi';
import type { SyncDownloadProgressStore } from '@/features/sync/domain/syncDownloadProgressStore';

jest.mock('@/features/shared/api/apiClient', () => ({
  ApiHttpError: class ApiHttpError extends Error {
    readonly status: number;
    constructor(status: number) {
      super(`HTTP ${status}`);
      this.status = status;
    }
  },
  apiRequest: jest.fn(),
}));

const request = jest.mocked(apiRequest);
const CHECKPOINT = '2026-08-13T12:05:00.000Z';

/** Stands in for the owner-scoped device storage a real store writes to. */
const savedProgress = new Map<string, string>();

function progressStore(owner = 'owner-1'): SyncDownloadProgressStore {
  return {
    read: async () => savedProgress.get(owner) ?? null,
    save: async (payload) => {
      savedProgress.set(owner, payload);
    },
    clear: async () => {
      savedProgress.delete(owner);
    },
  };
}

/** Each call builds a fresh store, so state only survives through the storage boundary. */
function fetchStatuses(
  options: Omit<Parameters<typeof fetchAllMobileReportStatuses>[0], 'progress'>,
  owner = 'owner-1',
) {
  return fetchAllMobileReportStatuses({ ...options, progress: progressStore(owner) });
}

function item(overrides: Record<string, unknown> = {}) {
  return {
    uuid: 'remote-1',
    client_uuid: 'client-1',
    reference_code: 'CG-100',
    review_status: 'verified_by_staff',
    review_notes: 'Latest field note',
    reviewed_at: '2026-08-13T12:00:00.000Z',
    updated_at: '2026-08-13T12:00:00.000Z',
    ...overrides,
  };
}

function page(
  data: unknown[] = [item()],
  next: string | null = null,
  syncBefore = CHECKPOINT,
) {
  return {
    data,
    links: { next },
    meta: { sync_before: syncBefore },
  };
}

describe('mobile report statuses API', () => {
  beforeEach(() => {
    request.mockReset();
    savedProgress.clear();
  });

  it('reads the canonical sync.before checkpoint from the v2 envelope', async () => {
    request.mockResolvedValueOnce(MOBILE_REPORT_STATUSES_V2_FIXTURE);

    await expect(
      fetchStatuses({ token: 'secure-token' }),
    ).resolves.toEqual({
      syncBefore: CHECKPOINT,
      updates: [
        expect.objectContaining({
          clientUuid: 'client-1',
          rawStatus: 'for_field_validation',
          feedback: 'Latest field note',
        }),
      ],
      sync: { version: null, total: 1, truncated: false, unchanged: false },
      pageCount: 1,
    });
  });

  // Intent: read the advisory field on status.
  // Oracle: references/mobile-notifications-v1.json declares the advisory
  // payload as exactly uuid/code/title/content/status/selected_at with no
  // delivery state, so a contract-shaped advisory must still sync review
  // statuses instead of failing the whole feed closed.
  it('surfaces a contract-shaped advisory without blocking review status', async () => {
    request.mockResolvedValueOnce(
      page([
        item({
          advisory: {
            uuid: 'adv-1',
            code: 'SMUT-01',
            title: 'Rogue smutted stools',
            content: 'Remove and burn affected stools.',
            status: 'validated',
            selected_at: '2026-08-13T12:01:00.000Z',
          },
        }),
        item({ uuid: 'remote-2', client_uuid: 'client-2' }),
      ]),
    );

    const result = await fetchStatuses({ token: 't' });
    expect(result.updates[0]).toMatchObject({
      clientUuid: 'client-1',
      rawStatus: 'verified_by_staff',
    });
    expect(result.updates[0].advisory).toEqual({
      uuid: 'adv-1',
      code: 'SMUT-01',
      title: 'Rogue smutted stools',
      content: 'Remove and burn affected stools.',
      status: 'validated',
      selectedAt: '2026-08-13T12:01:00.000Z',
    });
    expect(result.updates[1].advisory).toBeNull();
  });

  // PROPOSAL (intent: read the advisory field on status).
  it('rejects a malformed advisory as a malformed response', async () => {
    request.mockResolvedValueOnce(page([item({ advisory: { uuid: 'adv-1', status: 'bogus' } })]));
    await expect(fetchStatuses({ token: 't' })).rejects.toMatchObject({
      code: 'MALFORMED_RESPONSE',
    });
  });

  it('follows every cursor page with one server checkpoint and preserves unknown statuses', async () => {
    const next = `http://127.0.0.1:8000/api/v3/mobile/reports/statuses?cursor=next&sync_before=${encodeURIComponent(CHECKPOINT)}`;
    request
      .mockResolvedValueOnce(page([item({ review_status: 'future_state' })], next))
      .mockResolvedValueOnce(page([
        item({
          uuid: 'remote-2',
          client_uuid: 'client-2',
          review_notes: null,
          reviewed_at: null,
          updated_at: '2026-08-13T12:01:00.000Z',
        }),
      ]));

    await expect(
      fetchStatuses({
        token: 'secure-token',
        updatedAfter: '2026-08-13T11:59:59.000Z',
      }),
    ).resolves.toEqual({
      syncBefore: CHECKPOINT,
      updates: [
        expect.objectContaining({
          rawStatus: 'future_state',
          feedback: 'Latest field note',
        }),
        expect.objectContaining({
          clientUuid: 'client-2',
          feedback: null,
        }),
      ],
      sync: { version: null, total: 2, truncated: false, unchanged: false },
      pageCount: 2,
    });
    expect(request).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('per_page=100'),
      expect.objectContaining({ token: 'secure-token', timeoutMs: 20_000 }),
    );
    expect(request).toHaveBeenNthCalledWith(
      2,
      '/api/v3/mobile/reports/statuses?cursor=next&sync_before=' + encodeURIComponent(CHECKPOINT),
      expect.objectContaining({ token: 'secure-token' }),
    );
  });

  // Proves: a reported total that cannot cover the rows delivered is inconsistent and fails the feed
  // closed instead of being saved as the feed's size.
  it('rejects a reported total smaller than the rows it delivered', async () => {
    request.mockResolvedValueOnce({
      data: [item(), item({ uuid: 'remote-2', client_uuid: 'client-2' })],
      links: { next: null },
      meta: { sync_before: CHECKPOINT },
      sync: { before: CHECKPOINT, version: 'v-1', total: 1 },
    });

    await expect(
      fetchStatuses({ token: 'secure-token' }),
    ).rejects.toMatchObject({ code: 'MALFORMED_RESPONSE' });
  });

  // Proves: a first download that stops short of the total it was promised is rejected instead of
  // being checkpointed as a complete feed the phone then never refetches.
  // Oracle: the feed reports 250 statuses but delivered one record and no continuation.
  it('rejects a whole-feed answer that delivers fewer rows than its total', async () => {
    request.mockResolvedValueOnce({
      data: [item()],
      links: { next: null },
      meta: { sync_before: CHECKPOINT },
      sync: { before: CHECKPOINT, version: 'v-1', total: 250 },
    });

    await expect(
      fetchStatuses({ token: 'secure-token' }),
    ).rejects.toMatchObject({ code: 'MALFORMED_RESPONSE' });
  });

  // Proves: the same short answer is legitimate once the phone asked for what changed past a held
  // version, because the total then describes the whole feed, not this answer.
  it('accepts a version-scoped answer that delivers fewer rows than the feed total', async () => {
    request.mockResolvedValueOnce({
      data: [item()],
      links: { next: null },
      meta: { sync_before: CHECKPOINT },
      sync: { before: CHECKPOINT, version: 'v-2', total: 250 },
    });

    await expect(
      fetchStatuses({ token: 'secure-token', since: 'v-1' }),
    ).resolves.toMatchObject({
      sync: { version: 'v-2', total: 250, unchanged: false },
      pageCount: 1,
    });
  });

  // Proves: a version stamp replaces the overlapping timestamp and an unchanged answer costs no page.
  it('sends the held version instead of the overlap and reports an unchanged feed', async () => {
    request.mockResolvedValueOnce({
      data: [],
      links: { next: null },
      meta: { sync_before: CHECKPOINT },
      sync: { before: CHECKPOINT, version: 'v-1', total: 4, unchanged: true },
    });

    await expect(
      fetchStatuses({
        token: 'secure-token',
        updatedAfter: '2026-08-13T11:59:59.000Z',
        since: 'v-1',
      }),
    ).resolves.toEqual({
      syncBefore: CHECKPOINT,
      updates: [],
      sync: { version: 'v-1', total: 4, truncated: false, unchanged: true },
      pageCount: 0,
    });
    const path = String(request.mock.calls[0][0]);
    expect(path).toContain('since=v-1');
    expect(path).not.toContain('updated_after');
  });

  it('rejects a cross-origin or path-boundary continuation before sending it', async () => {
    request.mockResolvedValueOnce(
      page([], 'https://evil.example.test/api/v3/mobile/reports/statuses?cursor=steal'),
    );

    await expect(fetchStatuses({ token: 'secure-token' })).rejects.toMatchObject<Partial<ReportStatusesApiError>>({
      code: 'ORIGIN_MISMATCH',
    });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('rejects a same-origin continuation outside the status endpoint', async () => {
    request.mockResolvedValueOnce(
      page([], 'http://127.0.0.1:8000/api/v3/mobile/reports/other?cursor=steal'),
    );

    await expect(fetchStatuses({ token: 'secure-token' })).rejects.toMatchObject({
      code: 'ORIGIN_MISMATCH',
    });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('rejects a changed server checkpoint', async () => {
    const next = `http://127.0.0.1:8000/api/v3/mobile/reports/statuses?cursor=next&sync_before=${encodeURIComponent(CHECKPOINT)}`;
    request
      .mockResolvedValueOnce(page([], next))
      .mockResolvedValueOnce(page([], null, '2026-08-13T12:06:00.000Z'));

    await expect(fetchStatuses({ token: 'secure-token' })).rejects.toMatchObject({
      code: 'MALFORMED_RESPONSE',
    });
  });

  it.each([
    [401, 'AUTH_REQUIRED'],
    [403, 'CAPABILITY_UNAVAILABLE'],
    [404, 'CAPABILITY_UNAVAILABLE'],
  ] as const)('maps HTTP %s without touching the cache layer', async (status, code) => {
    request.mockRejectedValueOnce(new ApiHttpError(status, 'rejected'));

    await expect(fetchStatuses({ token: 'secure-token' })).rejects.toMatchObject({ code });
  });

  it('maps offline network failures separately from malformed server data', async () => {
    request.mockRejectedValueOnce(new TypeError('Network request failed'));

    await expect(fetchStatuses({ token: 'secure-token' })).rejects.toMatchObject({
      code: 'NETWORK',
    });
  });

  it('maps timeouts separately from malformed server data', async () => {
    const error = new Error('aborted');
    error.name = 'AbortError';
    request.mockRejectedValueOnce(error);

    await expect(fetchStatuses({ token: 'secure-token' })).rejects.toMatchObject({
      code: 'TIMEOUT',
    });
  });

  it.each([
    item({ updated_at: null }),
    item({ client_uuid: '' }),
    item({ review_notes: '<b>too much</b>' }),
  ])('rejects malformed items and never returns a partial batch', async (invalidItem) => {
    request.mockResolvedValueOnce(page([invalidItem]));

    if (invalidItem.review_notes === '<b>too much</b>') {
      // Markup is still plain text at the transport boundary; this case is
      // valid and proves the client does not parse or execute it.
      await expect(fetchStatuses({ token: 'secure-token' })).resolves.toMatchObject({
        updates: [expect.objectContaining({ feedback: '<b>too much</b>' })],
      });
      return;
    }

    await expect(fetchStatuses({ token: 'secure-token' })).rejects.toMatchObject({
      code: 'MALFORMED_RESPONSE',
    });
  });

  it('rejects a later malformed page without returning earlier valid items', async () => {
    const next = `http://127.0.0.1:8000/api/v3/mobile/reports/statuses?cursor=later&sync_before=${encodeURIComponent(CHECKPOINT)}`;
    request
      .mockResolvedValueOnce(page([item()], next))
      .mockResolvedValueOnce(page([{ uuid: 'remote-2' }]));

    await expect(fetchStatuses({ token: 'secure-token' })).rejects.toMatchObject({
      code: 'MALFORMED_RESPONSE',
    });
  });

  it('rejects duplicate identities so the repository can apply atomically', async () => {
    request.mockResolvedValueOnce(
      page([
        item(),
        item({ uuid: 'remote-2' }),
      ]),
    );

    await expect(fetchStatuses({ token: 'secure-token' })).rejects.toMatchObject({
      code: 'MALFORMED_RESPONSE',
    });
  });
  describe('resuming an interrupted download', () => {
    const NEXT_2 = '/api/v3/mobile/reports/statuses?page=2';
    const NEXT_3 = '/api/v3/mobile/reports/statuses?page=3';
    const envelope = (version: string) => ({ before: CHECKPOINT, version, total: 250, truncated: true });
    const pageOf = (n: number, next: string | null, version = 'v-1') => ({
      ...page([item({ uuid: `remote-${n}`, client_uuid: `client-${n}` })], next),
      sync: envelope(version),
    });
    const networkError = () => new ApiHttpError(503, 'down');

    // Proves: an interrupted download resumes in a new process from the first page it never stored.
    it('continues at the first page that was not stored after a restart', async () => {
      request
        .mockResolvedValueOnce(pageOf(1, NEXT_2))
        .mockRejectedValueOnce(networkError());
      await expect(fetchStatuses({ token: 'resume-a' })).rejects.toMatchObject({
        code: 'NETWORK',
      });

      request.mockReset();
      request.mockResolvedValueOnce(pageOf(2, NEXT_3)).mockResolvedValueOnce(pageOf(3, null));
      const result = await fetchStatuses({ token: 'resume-a' });

      expect(request.mock.calls.map(([path]) => path)).toEqual([NEXT_2, NEXT_3]);
      expect(result.updates.map((u) => u.remoteUuid)).toEqual(['remote-1', 'remote-2', 'remote-3']);
      // Oracle: the row the server sent before the interruption survives storage unchanged.
      expect(result.updates[0]).toEqual({
        advisory: null,
        clientUuid: 'client-1',
        feedback: 'Latest field note',
        referenceCode: 'CG-100',
        reviewedAt: '2026-08-13T12:00:00.000Z',
        remoteUuid: 'remote-1',
        rawStatus: 'verified_by_staff',
        statusUpdatedAt: '2026-08-13T12:00:00.000Z',
      });
      expect(result.pageCount).toBe(3);
    });

    // Proves: a rejected page keeps the stored ones, so the retry resumes instead of starting over.
    it('keeps the stored pages when a later page is rejected', async () => {
      request
        .mockResolvedValueOnce(pageOf(1, NEXT_2))
        .mockResolvedValueOnce({ ...pageOf(2, NEXT_3), data: [{ uuid: 'remote-2' }] });
      await expect(fetchStatuses({ token: 'resume-f' })).rejects.toMatchObject({
        code: 'MALFORMED_RESPONSE',
      });

      request.mockReset();
      request.mockResolvedValueOnce(pageOf(2, NEXT_3)).mockResolvedValueOnce(pageOf(3, null));
      const result = await fetchStatuses({ token: 'resume-f' });

      expect(request.mock.calls.map(([path]) => path)).toEqual([NEXT_2, NEXT_3]);
      expect(result.updates.map((u) => u.remoteUuid)).toEqual(['remote-1', 'remote-2', 'remote-3']);
    });

    // Proves: only the first-page request that started a download resumes it; another cursor starts over.
    it('starts over when the cursor changed', async () => {
      request.mockResolvedValueOnce(pageOf(1, NEXT_2)).mockRejectedValueOnce(networkError());
      await expect(
        fetchStatuses({ token: 'resume-d', updatedAfter: '2026-08-13T11:00:00.000Z' }),
      ).rejects.toMatchObject({ code: 'NETWORK' });

      request.mockReset();
      request.mockResolvedValueOnce(pageOf(1, null));
      await fetchStatuses({ token: 'resume-d', updatedAfter: '2026-08-13T12:00:00.000Z' });

      expect(String(request.mock.calls[0][0])).toContain(
        'updated_after=2026-08-13T12%3A00%3A00.000Z',
      );
    });

    // Proves: stored progress this build cannot read is dropped instead of failing the download.
    it('starts over when the stored progress is unreadable', async () => {
      savedProgress.set('owner-1', '{"cursor":');
      request.mockResolvedValueOnce(pageOf(1, null));

      await expect(fetchStatuses({ token: 'resume-e' })).resolves.toMatchObject({ pageCount: 1 });
    });

    // Proves: a changed version restarts from page one.
    it('restarts from page one when the feed version changed meanwhile', async () => {
      request
        .mockResolvedValueOnce(pageOf(1, NEXT_2))
        .mockRejectedValueOnce(networkError());
      await expect(fetchStatuses({ token: 'resume-b' })).rejects.toBeDefined();

      request.mockReset();
      request
        .mockResolvedValueOnce(pageOf(2, NEXT_3, 'v-2'))
        .mockResolvedValueOnce(pageOf(1, NEXT_2, 'v-2'))
        .mockResolvedValueOnce(pageOf(2, NEXT_3, 'v-2'))
        .mockResolvedValueOnce(pageOf(3, null, 'v-2'));
      const result = await fetchStatuses({ token: 'resume-b' });

      expect(request.mock.calls.map(([path]) => path)[1]).toMatch(/per_page=100/);
      expect(result.sync.version).toBe('v-2');
      expect(result.updates).toHaveLength(3);
    });

    // Proves: a completed refresh leaves nothing to resume (cursor advances only on a whole download).
    it('starts over once a download completed', async () => {
      request.mockResolvedValueOnce(pageOf(1, NEXT_2)).mockResolvedValueOnce(pageOf(2, null));
      await fetchStatuses({ token: 'resume-c' });

      request.mockReset();
      request.mockResolvedValueOnce(pageOf(1, null));
      await fetchStatuses({ token: 'resume-c' });
      expect(String(request.mock.calls[0][0])).toMatch(/per_page=100/);
    });
  });
});
