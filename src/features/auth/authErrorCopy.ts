import type { FarmerCopyBlock } from '@/constants/copy';

const ENGLISH_AUTH_ERRORS: Record<string, keyof FarmerCopyBlock['authErrors']> = {
  'The email or password is incorrect.': 'invalidCredentials',
  'Current password incorrect': 'invalidCredentials',
  'Verify your email address before signing in to CaneGuard.': 'emailNotVerified',
  'This account type cannot sign in to CaneGuard Mobile.': 'forbiddenRole',
  'This recovery link is invalid, expired, or already used. Request a new link.': 'invalidResetLink',
  'This email-verification link is invalid or expired. Request a new link.': 'invalidVerificationLink',
  'CaneGuard could not complete authentication.': 'invalidResponse',
  'Too many requests. Wait a moment and try again.': 'rateLimited',
  'Public self-registration is disabled. Contact your CaneGuard administrator to request an authorized account.': 'registrationDisabled',
  'CaneGuard could not reach the server. Please check your connection and try again.': 'serverUnavailable',
  'Your CaneGuard session is no longer valid.': 'sessionExpired',
  'Enter your current password to continue.': 'stepUpRequired',
  'Check the highlighted fields and try again.': 'validationError',
  'Sign in again before changing your password.': 'signInAgain',
  'Sign in again before changing your email.': 'signInAgain',
  'Sign in again before disabling device unlock.': 'signInAgain',
  'Sign in again before enrolling this installation.': 'signInAgain',
  'Sign in with your password before enabling device unlock.': 'signInForBiometric',
  'Protected unlock is not set up. Sign in with your password.': 'biometricUnavailable',
  'Protected unlock changed. Sign in with your password again.': 'biometricUnavailable',
  'Device unlock is unavailable. Sign in with your password.': 'biometricUnavailable',
  'Set up a strong biometric before enabling biometric unlock.': 'biometricNotEnrolled',
  'Device unlock was cancelled. Sign in with your password.': 'biometricCancelled',
  'Device unlock is not available. Sign in with your password.': 'biometricNotEnrolled',
  'CaneGuard could not verify this device. Sign in with your password.': 'biometricVerificationFailed',
  'Protected unlock could not access the stored session.': 'biometricUnavailable',
  'Device unlock could not be enabled. Your password session is still active.': 'biometricEnableFailed',
  'Device unlock was disabled on this device, but the server token could not be revoked.': 'biometricRevokeWarning',
  'Secure session storage is unavailable. Device enrollment was cancelled.': 'secureStorageUnavailable',
};

export function farmerAuthErrorMessage(
  message: string | null,
  copy: FarmerCopyBlock['authErrors'],
): string | null {
  if (message === null) return null;
  const key = ENGLISH_AUTH_ERRORS[message];
  return key ? copy[key] : copy.generic;
}
