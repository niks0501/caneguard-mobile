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
  'Sign in again before disabling biometric unlock.': 'signInAgain',
  'Sign in again before enrolling this installation.': 'signInAgain',
  'Sign in with your password before enabling biometric unlock.': 'signInForBiometric',
  'Biometric unlock is unavailable. Sign in with your password.': 'biometricUnavailable',
  'Set up a strong biometric before enabling biometric unlock.': 'biometricNotEnrolled',
  'Biometric unlock was cancelled. Sign in with your password.': 'biometricCancelled',
  'Biometric unlock is not available. Sign in with your password.': 'biometricNotEnrolled',
  'CaneGuard could not verify you biometrically. Sign in with your password.': 'biometricVerificationFailed',
  'Biometric unlock could not be enabled. Your password session is still active.': 'biometricEnableFailed',
  'Biometric unlock was disabled on this device, but the server token could not be revoked.': 'biometricRevokeWarning',
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
