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
});
