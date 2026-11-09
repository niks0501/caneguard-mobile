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

/**
 * The request may or may not have reached the server: no response body was
 * obtained, so the caller cannot treat the outcome as terminal.
 */
export class ApiTransportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiTransportError';
  }
}

export function buildApiUrl(path: string): string {
  return buildRequestUrl(path);
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & {
    csrf?: boolean;
    timeoutMs?: number;
    token?: string | null;
  } = {},
): Promise<T> {
  const controller = new AbortController();
  const {
    csrf = false,
    timeoutMs = DEFAULT_API_TIMEOUT_MS,
    token,
    signal: callerSignal,
    ...requestInit
  } = options;
  const headers = new Headers(requestInit.headers);

  if (callerSignal?.aborted) {
    throw createAbortError(CANCELLED_MESSAGE);
  }

  headers.set('Accept', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (csrf) {
    headers.set('X-XSRF-TOKEN', await initializeCsrf(timeoutMs));
    requestInit.credentials = 'include';
  }

  let timeout: ReturnType<typeof setTimeout> | undefined;
  let onCallerAbort: (() => void) | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      controller.abort();
      reject(createAbortError());
    }, timeoutMs);
    if (callerSignal) {
      onCallerAbort = () => {
        controller.abort();
        reject(createAbortError(CANCELLED_MESSAGE));
      };
      callerSignal.addEventListener('abort', onCallerAbort, { once: true });
    }
  });

  try {
    return await Promise.race([
      (async () => {
        const response = await fetch(buildApiUrl(path), {
          ...requestInit,
          headers,
          signal: controller.signal,
        });
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
    if (callerSignal && onCallerAbort) {
      callerSignal.removeEventListener('abort', onCallerAbort);
    }
  }
}

export async function initializeCsrf(
  timeoutMs = DEFAULT_API_TIMEOUT_MS,
): Promise<string> {
  const controller = new AbortController();
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
        const response = await fetch(buildRequestUrl('/sanctum/csrf-cookie'), {
          credentials: 'include',
          headers: new Headers({ Accept: 'application/json' }),
          signal: controller.signal,
        });
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

        const token = readXsrfToken(response.headers.get('set-cookie'));
        if (!token) {
          throw new ApiHttpError(
            503,
            'The server did not provide a CSRF cookie.',
            { body },
          );
        }
        return token;
      })(),
      timeoutPromise,
    ]);
  } finally {
    if (timeout !== undefined) {
      clearTimeout(timeout);
    }
  }
}

const CANCELLED_MESSAGE = 'The request was cancelled.';

function createAbortError(message = 'The request timed out.'): Error {
  const error = new Error(message);
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
  let text: string;
  try {
    text = await response.text();
  } catch {
    // A success may already have been accepted and a 409 is the server's
    // idempotent duplicate response, so an unreadable body for either stays
    // retryable with the unchanged client UUID. Every other status keeps its
    // status so terminal rejections (for example 422) never become retries.
    if (response.ok || response.status === 409) {
      throw new ApiTransportError('The server response could not be read.');
    }
    throw new ApiHttpError(
      response.status,
      `The server returned HTTP ${response.status}.`,
      {
        retryAfterMs: parseRetryAfter(response.headers.get('Retry-After')),
      },
    );
  }
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function readXsrfToken(setCookie: string | null): string | null {
  const responseToken = readCookieValue(setCookie);
  if (responseToken || setCookie !== null) {
    return responseToken;
  }

  if (typeof document === 'undefined') {
    return null;
  }

  return readCookieValue(document.cookie);
}

function readCookieValue(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) {
    return null;
  }

  const cookie = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.toLowerCase().startsWith('xsrf-token='));
  const encodedValue = cookie?.slice('XSRF-TOKEN='.length);
  if (!encodedValue) {
    return null;
  }

  try {
    return decodeURIComponent(encodedValue);
  } catch {
    return null;
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
