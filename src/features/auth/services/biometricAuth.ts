import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type {
  BiometricAuthResult,
  BiometricCapability,
} from '@/features/auth/types';

export async function getBiometricCapability(): Promise<BiometricCapability> {
  if (Platform.OS === 'web') {
    return unavailableCapability();
  }

  try {
    const [hasHardware, enrolled, level, types] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.getEnrolledLevelAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);
    const deviceCredentialAvailable = level >= LocalAuthentication.SecurityLevel.SECRET;
    const strongBiometricsAvailable =
      hasHardware &&
      enrolled &&
      types.length > 0 &&
      level === LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG;

    if (!hasHardware || types.length === 0) {
      return {
        deviceCredentialAvailable,
        status: 'unsupported',
        strongBiometricsAvailable: false,
      };
    }
    if (!enrolled || level === LocalAuthentication.SecurityLevel.NONE) {
      return {
        deviceCredentialAvailable,
        status: 'not-enrolled',
        strongBiometricsAvailable: false,
      };
    }
    if (!strongBiometricsAvailable) {
      return {
        deviceCredentialAvailable,
        status: 'unsupported',
        strongBiometricsAvailable: false,
      };
    }

    const secureStoreCanAuthenticate = readSecureStoreBiometricSupport();
    if (secureStoreCanAuthenticate === false) {
      return {
        deviceCredentialAvailable,
        status: 'unavailable',
        strongBiometricsAvailable: true,
      };
    }

    return {
      deviceCredentialAvailable,
      status: 'available',
      strongBiometricsAvailable: true,
    };
  } catch {
    return unavailableCapability();
  }
}

export async function authenticateWithBiometrics(): Promise<BiometricAuthResult> {
  const capability = await getBiometricCapability();
  if (capability.status === 'not-enrolled') {
    return {
      code: 'NOT_ENROLLED',
      message: 'Set up a strong biometric before enabling biometric unlock.',
      success: false,
    };
  }
  if (capability.status !== 'available') {
    return {
      code: 'NOT_AVAILABLE',
      message: 'Biometric unlock is unavailable. Sign in with your password.',
      success: false,
    };
  }

  try {
    const result = await LocalAuthentication.authenticateAsync({
      biometricsSecurityLevel: 'strong',
      cancelLabel: 'Use password',
      disableDeviceFallback: false,
      fallbackLabel: 'Use device passcode',
      promptMessage: 'Unlock CaneGuard',
      promptSubtitle: 'Use a strong biometric or device passcode.',
      requireConfirmation: true,
    });

    if (result.success) {
      return { success: true };
    }

    return mapAuthenticationFailure(result.error);
  } catch {
    return {
      code: 'NOT_AVAILABLE',
      message: 'Biometric unlock is unavailable. Sign in with your password.',
      success: false,
    };
  }
}

function mapAuthenticationFailure(
  error: LocalAuthentication.LocalAuthenticationError,
): BiometricAuthResult {
  if (
    error === 'user_cancel' ||
    error === 'system_cancel' ||
    error === 'app_cancel' ||
    error === 'user_fallback'
  ) {
    return {
      code: 'CANCELLED',
      message: 'Biometric unlock was cancelled. Sign in with your password.',
      success: false,
    };
  }
  if (error === 'not_enrolled' || error === 'passcode_not_set') {
    return {
      code: 'NOT_ENROLLED',
      message: 'Biometric unlock is not available. Sign in with your password.',
      success: false,
    };
  }
  if (error === 'not_available') {
    return {
      code: 'NOT_AVAILABLE',
      message: 'Biometric unlock is unavailable. Sign in with your password.',
      success: false,
    };
  }
  return {
    code: 'AUTHENTICATION_FAILED',
    message: 'CaneGuard could not verify you biometrically. Sign in with your password.',
    success: false,
  };
}

function unavailableCapability(): BiometricCapability {
  return {
    deviceCredentialAvailable: false,
    status: 'unavailable',
    strongBiometricsAvailable: false,
  };
}

function readSecureStoreBiometricSupport(): boolean | null {
  const secureStore = SecureStore as SecureStoreBiometricSupport;
  if (typeof secureStore.canUseBiometricAuthentication !== 'function') {
    return null;
  }
  try {
    return secureStore.canUseBiometricAuthentication();
  } catch {
    return false;
  }
}

type SecureStoreBiometricSupport = typeof SecureStore & {
  canUseBiometricAuthentication?: () => boolean;
};
