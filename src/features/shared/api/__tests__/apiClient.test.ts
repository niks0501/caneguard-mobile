import {
  apiRequest,
  DEFAULT_API_TIMEOUT_MS,
} from '@/features/shared/api/apiClient';

const fetchMock = jest.fn();

describe('api client', () => {
  beforeEach(() => {
    global.fetch = fetchMock;
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('preserves continuation query parameters when building API URLs', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers(),
      text: async () => '{}',
    });

    await apiRequest('/api/v1/mobile/assignments?cursor=next&sync_before=checkpoint', {
      token: 'test-token',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/mobile/assignments?cursor=next&sync_before=checkpoint'),
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
  });

  it('measures an HTTP-date Retry-After against the server Date, not a skewed device clock', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-21T07:10:00Z'));
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 503,
      headers: new Headers({
        Date: 'Wed, 21 Oct 2026 07:00:00 GMT',
        'Retry-After': 'Wed, 21 Oct 2026 07:05:00 GMT',
      }),
      text: async () => '{}',
    });

    await expect(apiRequest('/api/v3/mobile/reports', { token: 'test-token' }))
      .rejects.toMatchObject({ status: 503, retryAfterMs: 300_000 });
  });

  it.each([306, 309])('keeps a valid delay-seconds Retry-After with %i zeros as a finite hint', async (zeros) => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 503,
      headers: new Headers({ 'Retry-After': `1${'0'.repeat(zeros)}` }),
      text: async () => '{}',
    });

    const failure: unknown = await apiRequest('/api/v3/mobile/reports', { token: 'test-token' }).then(
      () => null,
      (error: unknown) => error,
    );

    expect(failure).toMatchObject({ status: 503 });
    const hintMs = (failure as { retryAfterMs: number | null }).retryAfterMs;
    expect(hintMs).not.toBeNull();
    expect(Number.isFinite(hintMs)).toBe(true);
    expect(hintMs).toBeGreaterThan(2 * 60 * 60_000);
  });

  it('measures a legacy RFC 850 HTTP-date Retry-After against the server Date', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-21T07:10:00Z'));
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 503,
      headers: new Headers({
        Date: 'Wed, 21 Oct 2026 07:00:00 GMT',
        'Retry-After': 'Wednesday, 21-Oct-26 07:05:00 GMT',
      }),
      text: async () => '{}',
    });

    await expect(apiRequest('/api/v3/mobile/reports', { token: 'test-token' }))
      .rejects.toMatchObject({ status: 503, retryAfterMs: 300_000 });
  });

  it('reads an asctime HTTP-date Retry-After as GMT', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-21T07:00:00Z'));
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 503,
      headers: new Headers({ 'Retry-After': 'Wed Oct 21 07:05:00 2026' }),
      text: async () => '{}',
    });

    await expect(apiRequest('/api/v3/mobile/reports', { token: 'test-token' }))
      .rejects.toMatchObject({ status: 503, retryAfterMs: 300_000 });
  });

  it('reads every HTTP-date Retry-After form even where Date.parse rejects them', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-21T07:00:00Z'));
    const parse = jest.spyOn(Date, 'parse').mockReturnValue(Number.NaN);
    try {
      for (const retryAfter of [
        'Wed, 21 Oct 2026 07:05:00 GMT',
        'Wednesday, 21-Oct-26 07:05:00 GMT',
        'Wed Oct 21 07:05:00 2026',
      ]) {
        fetchMock.mockResolvedValueOnce({
          ok: false,
          status: 503,
          headers: new Headers({
            Date: 'Wed, 21 Oct 2026 07:00:00 GMT',
            'Retry-After': retryAfter,
          }),
          text: async () => '{}',
        });

        await expect(apiRequest('/api/v3/mobile/reports', { token: 'test-token' }))
          .rejects.toMatchObject({ status: 503, retryAfterMs: 300_000 });
      }
    } finally {
      parse.mockRestore();
    }
  });

  it.each(['86400.5', '1e3', '2026-12-01T00:00:00Z'])('ignores a malformed Retry-After %s instead of deferring by a date parse', async (value) => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 503,
      headers: new Headers({ 'Retry-After': value }),
      text: async () => '{}',
    });

    await expect(apiRequest('/api/v3/mobile/reports', { token: 'test-token' }))
      .rejects.toMatchObject({ status: 503, retryAfterMs: null });
  });

  it('initializes CSRF and sends the decoded token with cookie credentials', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers({
          'set-cookie': 'XSRF-TOKEN=csrf-token%3D; Path=/',
        }),
        text: async () => '',
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers(),
        text: async () => '{}',
      });

    await apiRequest('/register', {
      csrf: true,
      method: 'POST',
      body: '{}',
    });

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'http://127.0.0.1:8000/sanctum/csrf-cookie',
    );
    expect(fetchMock.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({ credentials: 'include' }),
    );
    expect(fetchMock.mock.calls[1]?.[1]).toEqual(
      expect.objectContaining({ credentials: 'include' }),
    );
    expect(
      (fetchMock.mock.calls[1]?.[1]?.headers as Headers).get('X-XSRF-TOKEN'),
    ).toBe('csrf-token=');
  });

  it('falls back to the browser cookie when Fetch hides Set-Cookie', async () => {
    const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: { cookie: 'XSRF-TOKEN=browser-token%3D; other=value' },
    });

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers(),
        text: async () => '',
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers(),
        text: async () => '{}',
      });

    try {
      await apiRequest('/register', {
        csrf: true,
        method: 'POST',
        body: '{}',
      });
    } finally {
      if (originalDocument) {
        Object.defineProperty(globalThis, 'document', originalDocument);
      } else {
        Reflect.deleteProperty(globalThis, 'document');
      }
    }

    expect(
      (fetchMock.mock.calls[1]?.[1]?.headers as Headers).get('X-XSRF-TOKEN'),
    ).toBe('browser-token=');
  });

  it('settles a request that ignores AbortController at the documented timeout', async () => {
    jest.useFakeTimers();
    fetchMock.mockImplementationOnce(
      () => new Promise<Response>(() => undefined),
    );

    const request = apiRequest('/api/v1/mobile/auth/me', {
      token: 'test-token',
    });
    const settled = Promise.race([
      request.then(
        () => ({ kind: 'resolved' as const }),
        (error: unknown) => ({ kind: 'rejected' as const, error }),
      ),
      new Promise<{ kind: 'test-timeout' }>((resolve) => {
        setTimeout(
          () => resolve({ kind: 'test-timeout' }),
          DEFAULT_API_TIMEOUT_MS + 100,
        );
      }),
    ]);

    await jest.advanceTimersByTimeAsync(DEFAULT_API_TIMEOUT_MS + 100);
    const result = await settled;

    expect(result).toEqual({
      kind: 'rejected',
      error: expect.objectContaining({ name: 'AbortError' }),
    });
  });

  // Proves intent: a caller's cancellation is honored by apiRequest.
  it('aborts the in-flight fetch and rejects when the caller signal aborts', async () => {
    let fetchSignal: AbortSignal | undefined;
    fetchMock.mockImplementationOnce(
      (_url: string, init: RequestInit) => {
        fetchSignal = init.signal ?? undefined;
        return new Promise<Response>(() => undefined);
      },
    );
    const caller = new AbortController();

    const request = apiRequest('/api/v1/mobile/auth/me', {
      signal: caller.signal,
    });
    await Promise.resolve();
    caller.abort();

    await expect(request).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchSignal?.aborted).toBe(true);
  });

  // Proves intent: an already-cancelled caller never sends a request.
  it('rejects without fetching when the caller signal is already aborted', async () => {
    const caller = new AbortController();
    caller.abort();

    await expect(
      apiRequest('/api/v1/mobile/auth/me', { signal: caller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
