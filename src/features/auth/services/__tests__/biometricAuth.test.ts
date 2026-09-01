import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

import {
  authenticateWithBiometrics,
  getBiometricCapability,
} from '@/features/auth/services/biometricAuth';

jest.mock('expo-local-authentication', () => ({
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
    IRIS: 3,
  },
  SecurityLevel: {
    NONE: 0,
    SECRET: 1,
    BIOMETRIC_WEAK: 2,
    BIOMETRIC_STRONG: 3,
  },
  authenticateAsync: jest.fn(),
  getEnrolledLevelAsync: jest.fn(),
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  supportedAuthenticationTypesAsync: jest.fn(),
}));
jest.mock('expo-secure-store', () => ({
  canUseBiometricAuthentication: jest.fn(),
}));

describe('mobile biometric capability and authentication', () => {
  const mockAuthenticate = jest.mocked(LocalAuthentication.authenticateAsync);
  const mockLevel = jest.mocked(LocalAuthentication.getEnrolledLevelAsync);
  const mockHardware = jest.mocked(LocalAuthentication.hasHardwareAsync);
  const mockEnrolled = jest.mocked(LocalAuthentication.isEnrolledAsync);
  const mockTypes = jest.mocked(
    LocalAuthentication.supportedAuthenticationTypesAsync,
  );
  const mockSecureStoreCapability = jest.mocked(
    SecureStore.canUseBiometricAuthentication,
  );

  beforeEach(() => {
    mockAuthenticate.mockReset();
    mockLevel.mockResolvedValue(LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG);
    mockHardware.mockResolvedValue(true);
    mockEnrolled.mockResolvedValue(true);
    mockTypes.mockResolvedValue([
      LocalAuthentication.AuthenticationType.FINGERPRINT,
    ]);
    mockSecureStoreCapability.mockReturnValue(true);
  });

  it('accepts only an enrolled strong biometric with protected storage support', async () => {
    await expect(getBiometricCapability()).resolves.toEqual({
      deviceCredentialAvailable: true,
      status: 'available',
      strongBiometricsAvailable: true,
    });
  });

  it('reports weak biometric enrollment as unsupported', async () => {
    mockLevel.mockResolvedValue(LocalAuthentication.SecurityLevel.BIOMETRIC_WEAK);

    await expect(getBiometricCapability()).resolves.toMatchObject({
      status: 'unsupported',
      strongBiometricsAvailable: false,
    });
  });

  it('reports missing enrollment separately from unsupported hardware', async () => {
    mockEnrolled.mockResolvedValue(false);
    mockLevel.mockResolvedValue(LocalAuthentication.SecurityLevel.NONE);

    await expect(getBiometricCapability()).resolves.toMatchObject({
      status: 'not-enrolled',
      strongBiometricsAvailable: false,
    });

    mockHardware.mockResolvedValue(false);
    mockEnrolled.mockResolvedValue(true);
    mockLevel.mockResolvedValue(LocalAuthentication.SecurityLevel.SECRET);
    mockTypes.mockResolvedValue([]);

    await expect(getBiometricCapability()).resolves.toMatchObject({
      status: 'unsupported',
      strongBiometricsAvailable: false,
      deviceCredentialAvailable: true,
    });
  });

  it('does not enable protected storage when native capability is unavailable', async () => {
    mockSecureStoreCapability.mockReturnValue(false);

    await expect(getBiometricCapability()).resolves.toMatchObject({
      status: 'unavailable',
      strongBiometricsAvailable: true,
    });
  });

  it('allows the native device-credential fallback after a strong biometric check', async () => {
    mockAuthenticate.mockResolvedValueOnce({ success: true });

    await expect(authenticateWithBiometrics()).resolves.toEqual({ success: true });
    expect(mockAuthenticate).toHaveBeenCalledWith(
      expect.objectContaining({
        biometricsSecurityLevel: 'strong',
        cancelLabel: 'Use password instead',
        disableDeviceFallback: false,
        fallbackLabel: 'Use device passcode',
      }),
    );
  });

  it('maps cancellation and native authentication failures to password fallback states', async () => {
    mockAuthenticate.mockResolvedValueOnce({
      error: 'user_cancel',
      success: false,
    });
    await expect(authenticateWithBiometrics()).resolves.toMatchObject({
      code: 'CANCELLED',
      success: false,
    });

    mockAuthenticate.mockResolvedValueOnce({
      error: 'authentication_failed',
      success: false,
    });
    await expect(authenticateWithBiometrics()).resolves.toMatchObject({
      code: 'AUTHENTICATION_FAILED',
      success: false,
    });
  });

  it('maps native capability errors to an unavailable fallback', async () => {
    mockHardware.mockRejectedValueOnce(new Error('native module unavailable'));

    await expect(getBiometricCapability()).resolves.toEqual({
      deviceCredentialAvailable: false,
      status: 'unavailable',
      strongBiometricsAvailable: false,
    });
  });
});
