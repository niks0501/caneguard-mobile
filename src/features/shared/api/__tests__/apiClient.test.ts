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
