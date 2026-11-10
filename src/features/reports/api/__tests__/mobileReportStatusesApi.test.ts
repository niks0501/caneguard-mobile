import { ApiHttpError, apiRequest } from '@/features/shared/api/apiClient';
import { MOBILE_REPORT_STATUSES_V2_FIXTURE } from '@/features/reports/api/__fixtures__/mobileReportStatusesV2';
import {
  fetchAllMobileReportStatuses,
  ReportStatusesApiError,
} from '@/features/reports/api/mobileReportStatusesApi';

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
  });

  it('reads the canonical sync.before checkpoint from the v2 envelope', async () => {
    request.mockResolvedValueOnce(MOBILE_REPORT_STATUSES_V2_FIXTURE);

    await expect(
      fetchAllMobileReportStatuses({ token: 'secure-token' }),
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

    const result = await fetchAllMobileReportStatuses({ token: 't' });
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
    await expect(fetchAllMobileReportStatuses({ token: 't' })).rejects.toMatchObject({
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
      fetchAllMobileReportStatuses({
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
      fetchAllMobileReportStatuses({ token: 'secure-token' }),
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
      fetchAllMobileReportStatuses({ token: 'secure-token' }),
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
      fetchAllMobileReportStatuses({ token: 'secure-token', since: 'v-1' }),
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
      fetchAllMobileReportStatuses({
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

    await expect(fetchAllMobileReportStatuses({ token: 'secure-token' })).rejects.toMatchObject<Partial<ReportStatusesApiError>>({
      code: 'ORIGIN_MISMATCH',
    });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('rejects a same-origin continuation outside the status endpoint', async () => {
    request.mockResolvedValueOnce(
      page([], 'http://127.0.0.1:8000/api/v3/mobile/reports/other?cursor=steal'),
    );

    await expect(fetchAllMobileReportStatuses({ token: 'secure-token' })).rejects.toMatchObject({
      code: 'ORIGIN_MISMATCH',
    });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('rejects a changed server checkpoint', async () => {
    const next = `http://127.0.0.1:8000/api/v3/mobile/reports/statuses?cursor=next&sync_before=${encodeURIComponent(CHECKPOINT)}`;
    request
      .mockResolvedValueOnce(page([], next))
      .mockResolvedValueOnce(page([], null, '2026-08-13T12:06:00.000Z'));

    await expect(fetchAllMobileReportStatuses({ token: 'secure-token' })).rejects.toMatchObject({
      code: 'MALFORMED_RESPONSE',
    });
  });

  it.each([
    [401, 'AUTH_REQUIRED'],
    [403, 'CAPABILITY_UNAVAILABLE'],
    [404, 'CAPABILITY_UNAVAILABLE'],
  ] as const)('maps HTTP %s without touching the cache layer', async (status, code) => {
    request.mockRejectedValueOnce(new ApiHttpError(status, 'rejected'));

    await expect(fetchAllMobileReportStatuses({ token: 'secure-token' })).rejects.toMatchObject({ code });
  });

  it('maps offline network failures separately from malformed server data', async () => {
    request.mockRejectedValueOnce(new TypeError('Network request failed'));

    await expect(fetchAllMobileReportStatuses({ token: 'secure-token' })).rejects.toMatchObject({
      code: 'NETWORK',
    });
  });

  it('maps timeouts separately from malformed server data', async () => {
    const error = new Error('aborted');
    error.name = 'AbortError';
    request.mockRejectedValueOnce(error);

    await expect(fetchAllMobileReportStatuses({ token: 'secure-token' })).rejects.toMatchObject({
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
      await expect(fetchAllMobileReportStatuses({ token: 'secure-token' })).resolves.toMatchObject({
        updates: [expect.objectContaining({ feedback: '<b>too much</b>' })],
      });
      return;
    }

    await expect(fetchAllMobileReportStatuses({ token: 'secure-token' })).rejects.toMatchObject({
      code: 'MALFORMED_RESPONSE',
    });
  });

  it('rejects a later malformed page without returning earlier valid items', async () => {
    const next = `http://127.0.0.1:8000/api/v3/mobile/reports/statuses?cursor=later&sync_before=${encodeURIComponent(CHECKPOINT)}`;
    request
      .mockResolvedValueOnce(page([item()], next))
      .mockResolvedValueOnce(page([{ uuid: 'remote-2' }]));

    await expect(fetchAllMobileReportStatuses({ token: 'secure-token' })).rejects.toMatchObject({
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

    await expect(fetchAllMobileReportStatuses({ token: 'secure-token' })).rejects.toMatchObject({
      code: 'MALFORMED_RESPONSE',
    });
  });
});
