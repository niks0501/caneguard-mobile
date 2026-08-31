import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { AccountSecurityScreen } from '@/features/auth/components/AccountSecurityScreen';

jest.mock('expo-device', () => ({
  deviceName: 'Test installation',
  modelName: 'Test model',
}));
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
  },
}));
jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

const SESSION = {
  deviceId: 'installation-uuid',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1_000).toISOString(),
  token: 'test-session-value',
  user: {
    email: 'reporter@example.test',
    name: 'Field Reporter',
    role: 'field_reporter' as const,
    uuid: 'user-uuid',
  },
};

describe('AccountSecurityScreen', () => {
  const mockUseAuth = jest.mocked(useAuth);
  const mockChangePassword = jest.fn();
  const mockChangeEmail = jest.fn();
  const mockDisableBiometric = jest.fn();
  const mockEnableBiometric = jest.fn();
  const mockEnroll = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockChangePassword.mockResolvedValue(false);
    mockChangeEmail.mockResolvedValue(false);
    mockDisableBiometric.mockResolvedValue(false);
    mockEnableBiometric.mockResolvedValue(false);
    mockEnroll.mockResolvedValue(false);
    mockUseAuth.mockReturnValue({
      biometricCapability: {
        deviceCredentialAvailable: true,
        status: 'available',
        strongBiometricsAvailable: true,
      },
      biometricEnabled: false,
      biometricLoading: false,
      changeEmail: mockChangeEmail,
      changePassword: mockChangePassword,
      clearSessionAfterRemoteRevocation: jest.fn(async () => true),
      disableBiometric: mockDisableBiometric,
      enableBiometricUnlock: mockEnableBiometric,
      enrollMobileDevice: mockEnroll,
      errorMessage: null,
      login: jest.fn(async () => true),
      logout: jest.fn(async () => ({
        localClearFailed: false,
        remoteRevocationFailed: false,
      })),
      markSessionExpired: jest.fn(async () => undefined),
      session: SESSION,
      sessionVerification: 'verified',
      status: 'authenticated',
      unlockWithBiometrics: jest.fn(async () => true),
      user: SESSION.user,
    });
  });

  it('routes password changes through the authenticated step-up provider', async () => {
    mockChangePassword.mockResolvedValueOnce(true);

    await render(<AccountSecurityScreen />);
    await fireEvent.changeText(
      screen.getByTestId('account-security.current-password'),
      'current-password',
    );
    await fireEvent.changeText(
      screen.getByTestId('account-security.new-password'),
      'a-new-password-long',
    );
    await fireEvent.press(screen.getByTestId('account-security.change-password'));

    await waitFor(() =>
      expect(mockChangePassword).toHaveBeenCalledWith({
        currentPassword: 'current-password',
        password: 'a-new-password-long',
      }),
    );
    expect(router.replace).toHaveBeenCalledWith('/login');
  });

  it('routes email changes through a current-password step-up', async () => {
    mockChangeEmail.mockResolvedValueOnce(true);

    await render(<AccountSecurityScreen />);
    await fireEvent.changeText(
      screen.getByTestId('account-security.new-email'),
      'new@example.test',
    );
    await fireEvent.changeText(
      screen.getByTestId('account-security.email-password'),
      'current-password',
    );
    await fireEvent.press(screen.getByTestId('account-security.change-email'));

    await waitFor(() =>
      expect(mockChangeEmail).toHaveBeenCalledWith({
        currentPassword: 'current-password',
        email: 'new@example.test',
      }),
    );
    expect(router.replace).toHaveBeenCalledWith('/login');
  });

  it('routes new-installation enrollment through its password step-up', async () => {
    mockEnroll.mockResolvedValueOnce(true);

    await render(<AccountSecurityScreen />);
    await fireEvent.changeText(
      screen.getByTestId('account-security.enrollment-password'),
      'current-password',
    );
    await fireEvent.press(screen.getByTestId('account-security.enroll-device'));

    await waitFor(() =>
      expect(mockEnroll).toHaveBeenCalledWith(
        'current-password',
        'Test installation',
      ),
    );
    expect(screen.getByTestId('account-security.success')).toBeOnTheScreen();
  });

  it('routes biometric disable through its password step-up and signs out', async () => {
    mockUseAuth.mockReturnValue({
      ...mockUseAuth.mock.results[0]?.value,
      biometricCapability: {
        deviceCredentialAvailable: true,
        status: 'available',
        strongBiometricsAvailable: true,
      },
      biometricEnabled: true,
      biometricLoading: false,
      changeEmail: mockChangeEmail,
      changePassword: mockChangePassword,
      clearSessionAfterRemoteRevocation: jest.fn(async () => true),
      disableBiometric: mockDisableBiometric,
      enableBiometricUnlock: mockEnableBiometric,
      enrollMobileDevice: mockEnroll,
      errorMessage: null,
      login: jest.fn(async () => true),
      logout: jest.fn(async () => ({
        localClearFailed: false,
        remoteRevocationFailed: false,
      })),
      markSessionExpired: jest.fn(async () => undefined),
      session: SESSION,
      sessionVerification: 'verified',
      status: 'authenticated',
      unlockWithBiometrics: jest.fn(async () => true),
      user: SESSION.user,
    });
    mockDisableBiometric.mockResolvedValueOnce(true);

    await render(<AccountSecurityScreen />);
    await fireEvent.changeText(
      screen.getByTestId('account-security.disable-biometric-password'),
      'current-password',
    );
    await fireEvent.press(screen.getByTestId('account-security.disable-biometric'));

    await waitFor(() =>
      expect(mockDisableBiometric).toHaveBeenCalledWith('current-password'),
    );
    expect(router.replace).toHaveBeenCalledWith('/login');
  });

  it('keeps biometric enablement unavailable for unsupported capability', async () => {
    mockUseAuth.mockReturnValue({
      ...mockUseAuth.mock.results[0]?.value,
      biometricCapability: {
        deviceCredentialAvailable: true,
        status: 'unsupported',
        strongBiometricsAvailable: false,
      },
      biometricEnabled: false,
      biometricLoading: false,
      changeEmail: mockChangeEmail,
      changePassword: mockChangePassword,
      clearSessionAfterRemoteRevocation: jest.fn(async () => true),
      disableBiometric: mockDisableBiometric,
      enableBiometricUnlock: mockEnableBiometric,
      enrollMobileDevice: mockEnroll,
      errorMessage: null,
      login: jest.fn(async () => true),
      logout: jest.fn(async () => ({
        localClearFailed: false,
        remoteRevocationFailed: false,
      })),
      markSessionExpired: jest.fn(async () => undefined),
      session: SESSION,
      sessionVerification: 'verified',
      status: 'authenticated',
      unlockWithBiometrics: jest.fn(async () => true),
      user: SESSION.user,
    });

    await render(<AccountSecurityScreen />);

    expect(screen.getByTestId('account-security.enable-biometric')).toBeDisabled();
    expect(mockEnableBiometric).not.toHaveBeenCalled();
  });
});
