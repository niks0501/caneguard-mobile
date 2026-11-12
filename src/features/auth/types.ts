import { isSafeOwnerIdentity } from '@/database/ownerIdentity';
import type { CapabilityGrant } from '@/features/auth/domain/sessionState';

export type MobileUserRole = 'field_reporter' | 'farmer';

/** Only inspectors may author, validate, upload or review official Field Reports. */
export type FieldReportSubmitterRole = 'field_reporter';

export function isMobileUserRole(value: unknown): value is MobileUserRole {
  return value === 'field_reporter' || value === 'farmer';
}

/** Shared structural guard for server-issued mobile identities. */
export function isMobileUser(value: unknown): value is MobileUser {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const user = value as Partial<MobileUser>;
  return (
    typeof user.uuid === 'string' &&
    isSafeOwnerIdentity(user.uuid.trim()) &&
    typeof user.name === 'string' &&
    user.name.trim() !== '' &&
    typeof user.email === 'string' &&
    user.email.trim() !== '' &&
    isMobileUserRole(user.role)
  );
}

export interface MobileUser {
  email: string;
  name: string;
  // Server-granted abilities from /mobile/auth/me. Sessions stored before this
  // field existed omit it and grant nothing until the next verification.
  capabilities?: string[];
  // The inspector's pilot district from /mobile/auth/me; null or absent when the
  // account has none (or the session predates the field).
  districtCode?: string | null;
  role: MobileUserRole;
  uuid: string;
}

export interface MobileRegistrationUser extends MobileUser {
  emailVerified: boolean;
}

export interface MobileSession {
  /**
   * The dated record of what /me last confirmed, kept only inside the protected
   * session entry. It alone lets capabilities survive an offline restart; the
   * undated `user.capabilities` stays inert on restore.
   */
  capabilityGrant?: CapabilityGrant;
  // Older local sessions may omit this value, but new sessions always carry it.
  deviceId?: string;
  expiresAt: string | null;
  token: string;
  user: MobileUser;
}

export interface MobileLoginInput {
  deviceId?: string;
  deviceName: string;
  email: string;
  password: string;
}

export interface MobileRegistrationInput {
  email: string;
  name: string;
  password: string;
}

export interface MobileDeviceEnrollmentInput {
  currentPassword: string;
  deviceId: string;
  deviceName: string;
}

export interface PasswordChangeInput {
  currentPassword: string;
  password: string;
}

export interface EmailChangeInput {
  currentPassword: string;
  email: string;
}

export interface ResetPasswordInput {
  email: string;
  password: string;
  token: string;
}

export interface AuthActionResponse {
  code: string;
  message: string;
}

export interface MobileRegistrationResult extends AuthActionResponse {
  code: 'REGISTRATION_CREATED';
  user: MobileRegistrationUser;
}

export interface BiometricCapability {
  deviceCredentialAvailable: boolean;
  status:
    | 'available'
    | 'not-enrolled'
    | 'unsupported'
    | 'unavailable';
  strongBiometricsAvailable: boolean;
}

export type BiometricFailureCode =
  | 'AUTHENTICATION_FAILED'
  | 'CANCELLED'
  | 'ENROLLMENT_CHANGED'
  | 'NOT_AVAILABLE'
  | 'NOT_ENROLLED';

export interface BiometricAuthSuccess {
  success: true;
}

export interface BiometricAuthFailure {
  code: BiometricFailureCode;
  message: string;
  success: false;
}

export type BiometricAuthResult = BiometricAuthFailure | BiometricAuthSuccess;

export type AuthStatus = 'restoring' | 'authenticated' | 'unauthenticated';
export type SessionVerificationStatus =
  | 'idle'
  | 'pending'
  | 'verified'
  | 'unavailable';
