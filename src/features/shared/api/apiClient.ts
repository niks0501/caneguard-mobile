import { apiBaseUrl } from '@/config/env';

const DEFAULT_TIMEOUT_MS = 20_000;

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
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );
  const headers = new Headers(options.headers);

  headers.set('Accept', 'application/json');
  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  try {
    const response = await fetch(`${apiBaseUrl}${normalizePath(path)}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    const body = await readResponseBody(response);

    if (!response.ok) {
      throw new ApiHttpError(
        response.status,
        readServerMessage(body) ?? `The server returned HTTP ${response.status}.`,
        {
          body,
          retryAfterMs: parseRetryAfter(response.headers.get('Retry-After')),
        },
      );
    }

    return body as T;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizePath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
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
