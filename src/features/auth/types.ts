export type MobileUserRole = 'field_reporter';

export interface MobileUser {
  email: string;
  name: string;
  role: MobileUserRole;
  uuid: string;
}

export interface MobileRegistrationUser extends MobileUser {
  emailVerified: boolean;
}

export interface MobileSession {
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
