import { ApiHttpError, apiRequest } from '@/features/shared/api/apiClient';
import type {
  MobileLoginInput,
  MobileSession,
  MobileUser,
} from '@/features/auth/types';

interface LoginResponse {
  expires_at: string | null;
  token: string;
  token_type: string;
  user: MobileUser;
}

interface CurrentUserResponse {
  user?: MobileUser;
}

export class MobileAuthError extends Error {
  readonly code:
    | 'INVALID_CREDENTIALS'
    | 'FORBIDDEN_ROLE'
    | 'RATE_LIMITED'
    | 'SESSION_EXPIRED'
    | 'SERVER_UNAVAILABLE'
    | 'INVALID_RESPONSE';

  constructor(code: MobileAuthError['code'], message: string) {
    super(message);
    this.name = 'MobileAuthError';
    this.code = code;
  }
}

export async function loginMobile(
  input: MobileLoginInput,
): Promise<MobileSession> {
  try {
    const response = await apiRequest<LoginResponse>(
      '/api/v1/mobile/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: input.email.trim().toLowerCase(),
          password: input.password,
          device_name: input.deviceName,
        }),
      },
    );

    if (
      !response ||
      typeof response.token !== 'string' ||
      response.token_type?.toLowerCase() !== 'bearer' ||
      !isMobileUser(response.user)
    ) {
      throw new MobileAuthError(
        'INVALID_RESPONSE',
        'The sign-in response was incomplete.',
      );
    }

    return {
      token: response.token,
      expiresAt: response.expires_at ?? null,
      user: response.user,
    };
  } catch (error: unknown) {
    throw mapAuthError(error);
  }
}

export async function verifyMobileSession(token: string): Promise<MobileUser> {
  try {
    const response = await apiRequest<CurrentUserResponse | MobileUser>(
      '/api/v1/mobile/auth/me',
      { token },
    );
    const user =
      response && 'user' in response && response.user
        ? response.user
        : (response as MobileUser);

    if (!isMobileUser(user)) {
      throw new MobileAuthError(
        'FORBIDDEN_ROLE',
        'This account cannot submit mobile field reports.',
      );
    }
    return user;
  } catch (error: unknown) {
    throw mapAuthError(error);
  }
}

export async function logoutMobile(token: string): Promise<void> {
  try {
    await apiRequest<unknown>('/api/v1/mobile/auth/logout', {
      method: 'DELETE',
      token,
    });
  } catch (error: unknown) {
    throw mapAuthError(error);
  }
}

function isMobileUser(value: unknown): value is MobileUser {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'uuid' in value &&
      typeof value.uuid === 'string' &&
      'name' in value &&
      typeof value.name === 'string' &&
      'email' in value &&
      typeof value.email === 'string' &&
      'role' in value &&
      value.role === 'field_reporter',
  );
}

function mapAuthError(error: unknown): MobileAuthError {
  if (error instanceof MobileAuthError) {
    return error;
  }
  if (error instanceof ApiHttpError) {
    if (error.status === 401 || error.status === 422) {
      return new MobileAuthError(
        'INVALID_CREDENTIALS',
        'The email or password is incorrect.',
      );
    }
    if (error.status === 403) {
      return new MobileAuthError(
        'FORBIDDEN_ROLE',
        'Only field-reporter accounts can use mobile synchronization.',
      );
    }
    if (error.status === 429) {
      return new MobileAuthError(
        'RATE_LIMITED',
        'Too many sign-in attempts. Wait a moment and try again.',
      );
    }
    if (error.status === 404 || error.status === 405) {
      return new MobileAuthError(
        'SERVER_UNAVAILABLE',
        'The mobile sign-in endpoint is unavailable on the server.',
      );
    }
    if (error.status >= 500) {
      return new MobileAuthError(
        'SERVER_UNAVAILABLE',
        'CaneGuard sign-in is temporarily unavailable. Try again shortly.',
      );
    }
  }
  if (error instanceof TypeError || isAbortError(error)) {
    return new MobileAuthError(
      'SERVER_UNAVAILABLE',
      'CaneGuard could not reach the server. Check the API connection and try again.',
    );
  }
  return new MobileAuthError(
    'INVALID_RESPONSE',
    'CaneGuard could not complete sign in.',
  );
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}
