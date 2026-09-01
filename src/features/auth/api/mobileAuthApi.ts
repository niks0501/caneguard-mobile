import { ApiHttpError, apiRequest } from '@/features/shared/api/apiClient';
import type {
  AuthActionResponse,
  EmailChangeInput,
  MobileDeviceEnrollmentInput,
  MobileLoginInput,
  MobileRegistrationInput,
  MobileRegistrationResult,
  MobileSession,
  MobileUser,
  PasswordChangeInput,
  ResetPasswordInput,
} from '@/features/auth/types';

interface MobileTokenResponse {
  expires_at?: unknown;
  token?: unknown;
  token_type?: unknown;
  user?: unknown;
}

export type MobileAuthErrorCode =
  | 'EMAIL_NOT_VERIFIED'
  | 'FORBIDDEN_ROLE'
  | 'INVALID_CREDENTIALS'
  | 'INVALID_RESET_TOKEN'
  | 'INVALID_RESPONSE'
  | 'INVALID_VERIFICATION_LINK'
  | 'RATE_LIMITED'
  | 'SERVER_UNAVAILABLE'
  | 'SESSION_EXPIRED'
  | 'STEP_UP_REQUIRED'
  | 'VALIDATION_ERROR';

export class MobileAuthError extends Error {
  readonly code: MobileAuthErrorCode;
  readonly fieldErrors: Record<string, string[]> | null;
  readonly status: number | null;

  constructor(
    code: MobileAuthErrorCode,
    message: string,
    options: {
      fieldErrors?: Record<string, string[]> | null;
      status?: number | null;
    } = {},
  ) {
    super(message);
    this.name = 'MobileAuthError';
    this.code = code;
    this.fieldErrors = options.fieldErrors ?? null;
    this.status = options.status ?? null;
  }
}

export function parseMobileSessionResponse(
  value: unknown,
  deviceId?: string,
): MobileSession {
  if (!isRecord(value)) {
    throw invalidResponseError();
  }

  const token = value.token;
  const tokenType = value.token_type;
  const expiresAt = value.expires_at;

  if (
    typeof token !== 'string' ||
    token.trim() === '' ||
    typeof tokenType !== 'string' ||
    tokenType.toLowerCase() !== 'bearer' ||
    typeof expiresAt !== 'string' ||
    !isFutureIsoDate(expiresAt) ||
    !isMobileUser(value.user)
  ) {
    throw invalidResponseError();
  }

  return {
    deviceId: normalizeOptionalDeviceId(deviceId),
    expiresAt,
    token,
    user: value.user,
  };
}

export function parseMobileUser(value: unknown): MobileUser {
  if (!isRecord(value)) {
    throw invalidResponseError();
  }
  if (
    typeof value.uuid !== 'string' ||
    value.uuid.trim() === '' ||
    typeof value.name !== 'string' ||
    value.name.trim() === '' ||
    typeof value.email !== 'string' ||
    value.email.trim() === ''
  ) {
    throw invalidResponseError();
  }
  if (value.role !== 'field_reporter') {
    throw authError('FORBIDDEN_ROLE');
  }
  return value as unknown as MobileUser;
}

export function parseRegistrationResponse(
  value: unknown,
): MobileRegistrationResult {
  if (
    !isRecord(value) ||
    value.code !== 'REGISTRATION_CREATED' ||
    typeof value.message !== 'string' ||
    !isRegistrationUser(value.user)
  ) {
    throw invalidResponseError();
  }

  return {
    code: 'REGISTRATION_CREATED',
    message: value.message,
    user: {
      ...value.user,
      emailVerified: value.user.email_verified,
    },
  };
}

export function parseAuthActionResponse(
  value: unknown,
  expectedCode?: string,
): AuthActionResponse {
  if (
    !isRecord(value) ||
    typeof value.code !== 'string' ||
    typeof value.message !== 'string' ||
    (expectedCode !== undefined && value.code !== expectedCode)
  ) {
    throw invalidResponseError();
  }

  return {
    code: value.code,
    message: value.message,
  };
}

export async function loginMobile(
  input: MobileLoginInput,
): Promise<MobileSession> {
  try {
    const deviceName = input.deviceName.trim();
    const deviceId = normalizeOptionalDeviceId(input.deviceId);
    const response = await apiRequest<MobileTokenResponse>(
      '/api/v1/mobile/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: input.email.trim().toLowerCase(),
          password: input.password,
          device_name: deviceName,
          ...(deviceId ? { device_id: deviceId } : {}),
        }),
      },
    );

    return parseMobileSessionResponse(response, deviceId);
  } catch (error: unknown) {
    throw mapAuthError(error, 'login');
  }
}

export async function verifyMobileSession(token: string): Promise<MobileUser> {
  try {
    const response = await apiRequest<unknown>(
      '/api/v1/mobile/auth/me',
      { token },
    );
    const user =
      isRecord(response) && 'user' in response
        ? response.user
        : response;

    return parseMobileUser(user);
  } catch (error: unknown) {
    throw mapAuthError(error, 'session');
  }
}

export async function logoutMobile(token: string): Promise<void> {
  try {
    await apiRequest<unknown>('/api/v1/mobile/auth/logout', {
      method: 'DELETE',
      token,
    });
  } catch (error: unknown) {
    // An already expired or revoked token has no server-side session left to
    // revoke, so local logout can complete normally.
    if (error instanceof ApiHttpError && error.status === 401) {
      return;
    }
    throw mapAuthError(error, 'logout');
  }
}

export async function registerMobile(
  input: MobileRegistrationInput,
): Promise<MobileRegistrationResult> {
  try {
    const response = await apiRequest<unknown>('/register', {
      csrf: true,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        password: input.password,
      }),
    });

    return parseRegistrationResponse(response);
  } catch (error: unknown) {
    throw mapAuthError(error, 'registration');
  }
}

export async function resendVerification(
  email: string,
): Promise<AuthActionResponse> {
  try {
    const response = await apiRequest<unknown>(
      '/email/verification-notification',
      {
        csrf: true,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      },
    );

    return parseAuthActionResponse(response, 'VERIFICATION_LINK_SENT');
  } catch (error: unknown) {
    throw mapAuthError(error, 'verification-resend');
  }
}

export async function verifyEmail(input: {
  expires: string;
  hash: string;
  id: string;
  signature: string;
}): Promise<AuthActionResponse> {
  try {
    const path = `/email/verify/${encodeURIComponent(input.id)}/${encodeURIComponent(input.hash)}?${new URLSearchParams({
      expires: input.expires,
      signature: input.signature,
    }).toString()}`;
    const response = await apiRequest<unknown>(path);
    return parseAuthActionResponse(response, 'EMAIL_VERIFIED');
  } catch (error: unknown) {
    throw mapAuthError(error, 'email-verification');
  }
}

export async function requestPasswordReset(
  email: string,
): Promise<AuthActionResponse> {
  try {
    const response = await apiRequest<unknown>('/forgot-password', {
      csrf: true,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
    return parseAuthActionResponse(response, 'PASSWORD_RESET_LINK_SENT');
  } catch (error: unknown) {
    throw mapAuthError(error, 'password-recovery');
  }
}

export async function resetPassword(
  input: ResetPasswordInput,
): Promise<AuthActionResponse> {
  try {
    const response = await apiRequest<unknown>('/reset-password', {
      csrf: true,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: input.email.trim().toLowerCase(),
        token: input.token,
        password: input.password,
      }),
    });
    return parseAuthActionResponse(response, 'PASSWORD_RESET');
  } catch (error: unknown) {
    throw mapAuthError(error, 'password-reset');
  }
}

export async function changePassword(
  token: string,
  input: PasswordChangeInput,
): Promise<AuthActionResponse> {
  try {
    const response = await apiRequest<unknown>('/api/v1/auth/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      token,
      body: JSON.stringify({
        current_password: input.currentPassword,
        password: input.password,
      }),
    });
    return parseAuthActionResponse(response, 'PASSWORD_CHANGED');
  } catch (error: unknown) {
    throw mapAuthError(error, 'security');
  }
}

export async function changeEmail(
  token: string,
  input: EmailChangeInput,
): Promise<AuthActionResponse> {
  try {
    const response = await apiRequest<unknown>('/api/v1/auth/email', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      token,
      body: JSON.stringify({
        current_password: input.currentPassword,
        email: input.email.trim().toLowerCase(),
      }),
    });
    return parseAuthActionResponse(response, 'EMAIL_VERIFICATION_REQUIRED');
  } catch (error: unknown) {
    throw mapAuthError(error, 'security');
  }
}

export async function disableBiometric(
  token: string,
  currentPassword: string,
): Promise<AuthActionResponse> {
  try {
    const response = await apiRequest<unknown>(
      '/api/v1/auth/biometric/disable',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        token,
        body: JSON.stringify({ current_password: currentPassword }),
      },
    );
    return parseAuthActionResponse(response, 'BIOMETRIC_DISABLED');
  } catch (error: unknown) {
    throw mapAuthError(error, 'security');
  }
}

export async function enrollMobileDevice(
  token: string,
  input: MobileDeviceEnrollmentInput,
): Promise<MobileSession> {
  try {
    const response = await apiRequest<MobileTokenResponse>(
      '/api/v1/mobile/auth/enroll',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        token,
        body: JSON.stringify({
          current_password: input.currentPassword,
          device_name: input.deviceName.trim(),
          device_id: input.deviceId,
        }),
      },
    );
    return parseMobileSessionResponse(response, input.deviceId);
  } catch (error: unknown) {
    throw mapAuthError(error, 'enrollment');
  }
}

type AuthRequestKind =
  | 'email-verification'
  | 'enrollment'
  | 'login'
  | 'logout'
  | 'password-recovery'
  | 'password-reset'
  | 'registration'
  | 'security'
  | 'session'
  | 'verification-resend';

function mapAuthError(
  error: unknown,
  requestKind: AuthRequestKind,
): MobileAuthError {
  if (error instanceof MobileAuthError) {
    return error;
  }

  if (error instanceof ApiHttpError) {
    const apiCode = readApiCode(error.body);
    const fieldErrors = readFieldErrors(error.body);

    switch (apiCode) {
      case 'EMAIL_NOT_VERIFIED':
        return authError('EMAIL_NOT_VERIFIED', error.status);
      case 'FORBIDDEN':
        return authError(
          requestKind === 'email-verification'
            ? 'INVALID_VERIFICATION_LINK'
            : 'FORBIDDEN_ROLE',
          error.status,
        );
      case 'INVALID_CREDENTIALS':
        return authError('INVALID_CREDENTIALS', error.status);
      case 'INVALID_RESET_TOKEN':
        return authError('INVALID_RESET_TOKEN', error.status);
      case 'INVALID_VERIFICATION_LINK':
        return authError('INVALID_VERIFICATION_LINK', error.status);
      case 'STEP_UP_REQUIRED':
        return authError('STEP_UP_REQUIRED', error.status);
      case 'UNAUTHENTICATED':
        return authError('SESSION_EXPIRED', error.status);
      case 'VALIDATION_ERROR':
        return authError('VALIDATION_ERROR', error.status, fieldErrors);
      default:
        break;
    }

    if (error.status === 401) {
      return authError(
        requestKind === 'login'
          ? 'INVALID_CREDENTIALS'
          : 'SESSION_EXPIRED',
        error.status,
      );
    }
    if (error.status === 403) {
      return authError(
        requestKind === 'email-verification'
          ? 'INVALID_VERIFICATION_LINK'
          : requestKind === 'login' || requestKind === 'session'
            ? 'FORBIDDEN_ROLE'
            : 'SESSION_EXPIRED',
        error.status,
      );
    }
    if (error.status === 422) {
      return authError(
        requestKind === 'login'
          ? 'INVALID_CREDENTIALS'
          : requestKind === 'password-reset'
            ? 'INVALID_RESET_TOKEN'
            : requestKind === 'security' || requestKind === 'enrollment'
              ? 'VALIDATION_ERROR'
              : 'VALIDATION_ERROR',
        error.status,
        fieldErrors,
      );
    }
    if (error.status === 429) {
      return new MobileAuthError(
        'RATE_LIMITED',
        requestKind === 'login'
          ? 'Too many sign-in attempts. Wait a moment and try again.'
          : AUTH_ERROR_MESSAGES.RATE_LIMITED,
        { status: error.status },
      );
    }
    if (error.status === 404 || error.status === 405) {
      return new MobileAuthError(
        'SERVER_UNAVAILABLE',
        requestKind === 'login'
          ? 'The mobile auth endpoint is unavailable on the server.'
          : AUTH_ERROR_MESSAGES.SERVER_UNAVAILABLE,
        { status: error.status },
      );
    }
    if (error.status >= 500) {
      return new MobileAuthError(
        'SERVER_UNAVAILABLE',
        requestKind === 'login'
          ? 'CaneGuard authentication is temporarily unavailable. Try again shortly.'
          : AUTH_ERROR_MESSAGES.SERVER_UNAVAILABLE,
        { status: error.status },
      );
    }
  }

  if (error instanceof TypeError || isAbortError(error)) {
    return authError('SERVER_UNAVAILABLE');
  }

  return authError('INVALID_RESPONSE');
}

function authError(
  code: MobileAuthErrorCode,
  status: number | null = null,
  fieldErrors: Record<string, string[]> | null = null,
): MobileAuthError {
  return new MobileAuthError(code, AUTH_ERROR_MESSAGES[code], {
    fieldErrors,
    status,
  });
}

const AUTH_ERROR_MESSAGES: Record<MobileAuthErrorCode, string> = {
  EMAIL_NOT_VERIFIED: 'Verify your email address before using Mobile.',
  FORBIDDEN_ROLE: 'Only field-reporter accounts can use mobile synchronization.',
  INVALID_CREDENTIALS: 'The email or password is incorrect.',
  INVALID_RESET_TOKEN:
    'This recovery link is invalid, expired, or already used. Request a new link.',
  INVALID_RESPONSE: 'CaneGuard could not complete authentication.',
  INVALID_VERIFICATION_LINK:
    'This email-verification link is invalid or expired. Request a new link.',
  RATE_LIMITED: 'Too many requests. Wait a moment and try again.',
  SERVER_UNAVAILABLE:
    'CaneGuard could not reach the server. Check the API connection and try again.',
  SESSION_EXPIRED: 'Your CaneGuard session is no longer valid.',
  STEP_UP_REQUIRED: 'Enter your current password to continue.',
  VALIDATION_ERROR: 'Check the highlighted fields and try again.',
};

function invalidResponseError(): MobileAuthError {
  return new MobileAuthError(
    'INVALID_RESPONSE',
    'The authentication response was incomplete.',
  );
}

function isMobileUser(value: unknown): value is MobileUser {
  return Boolean(
    isRecord(value) &&
      typeof value.uuid === 'string' &&
      value.uuid.trim().length > 0 &&
      typeof value.name === 'string' &&
      value.name.trim().length > 0 &&
      typeof value.email === 'string' &&
      value.email.trim().length > 0 &&
      value.role === 'field_reporter',
  );
}

function isRegistrationUser(
  value: unknown,
): value is MobileUser & { email_verified: boolean } {
  return (
    isMobileUser(value) &&
    isRecord(value) &&
    typeof value.email_verified === 'boolean'
  );
}

function isFutureIsoDate(value: string): boolean {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && timestamp > Date.now();
}

function normalizeOptionalDeviceId(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function readApiCode(body: unknown): string | null {
  return isRecord(body) && typeof body.code === 'string' ? body.code : null;
}

function readFieldErrors(body: unknown): Record<string, string[]> | null {
  if (!isRecord(body) || !isRecord(body.errors)) {
    return null;
  }

  const fields: Record<string, string[]> = {};
  for (const [field, messages] of Object.entries(body.errors)) {
    if (!Array.isArray(messages)) {
      continue;
    }
    const safeMessages = messages.filter(
      (message): message is string => typeof message === 'string',
    );
    if (safeMessages.length > 0) {
      fields[field] = safeMessages;
    }
  }
  return Object.keys(fields).length > 0 ? fields : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}
