import { apiBaseUrl } from '@/config/env';

export const DEFAULT_API_TIMEOUT_MS = 20_000;

export class ApiHttpError extends Error {
  readonly body: unknown;
  readonly retryAfterMs: number | null;
  readonly status: number;

  constructor(
    status: number,
    message: string,
    options: { body?: unknown; retryAfterMs?: number | null } = {},
  ) {
    super(message);
    this.name = 'ApiHttpError';
    this.status = status;
    this.body = options.body;
    this.retryAfterMs = options.retryAfterMs ?? null;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & {
    timeoutMs?: number;
    token?: string | null;
  } = {},
): Promise<T> {
  const controller = new AbortController();
  const {
    timeoutMs = DEFAULT_API_TIMEOUT_MS,
    token,
    signal: _callerSignal,
    ...requestInit
  } = options;
  const headers = new Headers(requestInit.headers);

  headers.set('Accept', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      controller.abort();
      reject(createAbortError());
    }, timeoutMs);
  });

  try {
    return await Promise.race([
      (async () => {
        const response = await fetch(buildRequestUrl(path), {
            ...requestInit,
            headers,
            signal: controller.signal,
          },
        );
        const body = await readResponseBody(response);

        if (!response.ok) {
          throw new ApiHttpError(
            response.status,
            readServerMessage(body) ??
              `The server returned HTTP ${response.status}.`,
            {
              body,
              retryAfterMs: parseRetryAfter(
                response.headers.get('Retry-After'),
              ),
            },
          );
        }

        return body as T;
      })(),
      timeoutPromise,
    ]);
  } finally {
    if (timeout !== undefined) {
      clearTimeout(timeout);
    }
  }
}

function createAbortError(): Error {
  const error = new Error('The request timed out.');
  error.name = 'AbortError';
  return error;
}

function normalizePath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

function buildRequestUrl(path: string): string {
  const base = new URL(apiBaseUrl);
  const pathUrl = new URL(normalizePath(path), 'http://caneguard.local');
  const basePath = base.pathname.replace(/\/+$/, '');
  const requestPath = basePath &&
    (pathUrl.pathname === basePath || pathUrl.pathname.startsWith(`${basePath}/`))
    ? pathUrl.pathname
    : `${basePath}${pathUrl.pathname}` || pathUrl.pathname;

  base.pathname = requestPath;
  base.search = pathUrl.search;
  base.hash = pathUrl.hash;
  return base.toString();
}

async function readResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function readServerMessage(body: unknown): string | null {
  if (
    body &&
    typeof body === 'object' &&
    'message' in body &&
    typeof body.message === 'string'
  ) {
    return body.message;
  }
  return null;
}

function parseRetryAfter(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1_000;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : Math.max(0, timestamp - Date.now());
}
