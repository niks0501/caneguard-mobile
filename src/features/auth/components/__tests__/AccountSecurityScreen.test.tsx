import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';

import AccountPasswordRoute from '@/app/account-password';
import AccountEmailRoute from '@/app/account-email';
import AccountDeviceEnrollmentRoute from '@/app/account-device-enrollment';
import AccountBiometricRoute from '@/app/account-biometric';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { AccountSecurityScreen } from '@/features/auth/components/AccountSecurityScreen';
import { ToastProvider } from '@/components/ui/Toast';

jest.mock('expo-device', () => ({
  deviceName: 'Test installation',
  modelName: 'Test model',
}));
jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    dismissTo: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  },
  useLocalSearchParams: jest.fn(() => ({})),
}));
jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

const SESSION = {
  deviceId: 'installation-uuid',
  expiresAt: null,
  token: 'test-session-value',
  user: {
    email: 'reporter@example.test',
    name: 'Field Reporter',
    role: 'field_reporter' as const,
    uuid: 'user-uuid',
  },
};

const mockChangePassword = jest.fn();
const mockChangeEmail = jest.fn();
const mockDisableBiometric = jest.fn();
const mockEnableBiometric = jest.fn();
const mockEnroll = jest.fn();

function authState(overrides: Record<string, unknown> = {}) {
  return {
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
    hasCompletedLogin: true,
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
    ...overrides,
  } as never;
}

describe('AccountSecurityScreen', () => {
  const mockUseAuth = jest.mocked(useAuth);
  const mockUseLocalSearchParams = jest.mocked(useLocalSearchParams);
  const mockPush = router.push as jest.Mock;
  const mockReplace = router.replace as jest.Mock;
  const mockBack = router.back as jest.Mock;
  const mockDismissTo = (router.dismissTo as unknown) as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockChangePassword.mockResolvedValue(false);
    mockChangeEmail.mockResolvedValue(false);
    mockDisableBiometric.mockResolvedValue(false);
    mockEnableBiometric.mockResolvedValue(false);
    mockEnroll.mockResolvedValue(false);
    mockUseLocalSearchParams.mockReturnValue({});
    mockUseAuth.mockReturnValue(authState());
  });

  it('describes a session without a scheduled expiry', async () => {
    await render(<AccountSecurityScreen />);

    expect(
      screen.getByText(
        'Local session safety expiry unavailable; sign in again before continuing.',
      ),
    ).toBeOnTheScreen();
  });

  it('renders four section rows with no password input at first render', async () => {
    await render(<AccountSecurityScreen />);

    expect(screen.getByText('Biometric unlock')).toBeOnTheScreen();
    expect(screen.getByText('Change password')).toBeOnTheScreen();
    expect(screen.getByText('Change email')).toBeOnTheScreen();
    expect(screen.getByText('Device enrollment')).toBeOnTheScreen();

    // A closed sheet cannot receive input: no form field is mounted.
    expect(screen.queryByTestId('account-security.current-password')).toBeNull();
    expect(screen.queryByTestId('account-security.new-password')).toBeNull();
    expect(screen.queryByTestId('account-security.email-password')).toBeNull();
    expect(screen.queryByTestId('account-security.enrollment-password')).toBeNull();
    expect(screen.queryByTestId('account-security.disable-biometric-password')).toBeNull();
  });

  it('opens each form through its native sheet route', async () => {
    await render(<AccountSecurityScreen />);

    await fireEvent.press(screen.getByTestId('account-security.open-change-password'));
    expect(mockPush).toHaveBeenCalledWith('/account-password');
    await fireEvent.press(screen.getByTestId('account-security.open-change-email'));
    expect(mockPush).toHaveBeenCalledWith('/account-email');
    await fireEvent.press(screen.getByTestId('account-security.open-enroll-device'));
    expect(mockPush).toHaveBeenCalledWith('/account-device-enrollment');
  });

  it('opens the biometric sheet from its row when biometrics are enabled', async () => {
    mockUseAuth.mockReturnValue(authState({ biometricEnabled: true }));
    await render(<AccountSecurityScreen />);

    await fireEvent.press(screen.getByTestId('account-security.open-disable-biometric'));
    expect(mockPush).toHaveBeenCalledWith('/account-biometric');
  });

  it('shows the enrollment result banner returned from the sheet', async () => {
    mockUseLocalSearchParams.mockReturnValue({ notice: 'enrolled' });
    await render(<AccountSecurityScreen />);

    expect(screen.getByTestId('account-security.success')).toBeOnTheScreen();
    expect(screen.getByTestId('account-security.success')).toHaveTextContent(/fresh server session/);
  });

  it('cancels a clean password sheet without side effects', async () => {
    await render(<AccountPasswordRoute />);

    expect(screen.getByRole('header', { name: 'Change password' })).toBeOnTheScreen();
    expect(screen.getByTestId('account-security.current-password')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));

    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockChangePassword).not.toHaveBeenCalled();
    expect(screen.queryByRole('header', { name: 'Change password' })).toBeNull();
    expect(screen.queryByTestId('account-security.current-password')).toBeNull();
  });

  it('asks once before discarding a dirty password sheet', async () => {
    await render(<AccountPasswordRoute />);

    await fireEvent.changeText(
      screen.getByTestId('account-security.current-password'),
      'current-password',
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));

    expect(mockBack).not.toHaveBeenCalled();
    expect(screen.getByText('Discard changes?')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Discard' }));
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('account-security.current-password')).toBeNull();
  });

  it('routes password changes through the sheet confirmation gate', async () => {
    mockChangePassword.mockResolvedValueOnce(true);

    await render(
      <ToastProvider>
        <AccountPasswordRoute />
      </ToastProvider>,
    );
    await fireEvent.changeText(
      screen.getByTestId('account-security.current-password'),
      'current-password',
    );
    await fireEvent.changeText(
      screen.getByTestId('account-security.new-password'),
      'a-new-password-long',
    );
    await fireEvent.press(screen.getByTestId('account-security.change-password'));

    // C7: the gate opens first; nothing is sent yet.
    expect(mockChangePassword).not.toHaveBeenCalled();
    expect(screen.getByTestId('account-security.confirm-dialog-password')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Confirm change' }));

    await waitFor(() =>
      expect(mockChangePassword).toHaveBeenCalledWith({
        currentPassword: 'current-password',
        password: 'a-new-password-long',
      }),
    );
    expect(screen.getByTestId('app-toast')).toBeOnTheScreen();
    expect(screen.getByTestId('app-toast')).toHaveTextContent('Password updated');
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  it('keeps the sheet open with values intact when the password change fails', async () => {
    mockChangePassword.mockResolvedValueOnce(false);
    mockUseAuth.mockReturnValue(authState({ errorMessage: 'Current password incorrect' }));

    await render(
      <ToastProvider>
        <AccountPasswordRoute />
      </ToastProvider>,
    );
    await fireEvent.changeText(
      screen.getByTestId('account-security.current-password'),
      'wrong-password',
    );
    await fireEvent.changeText(
      screen.getByTestId('account-security.new-password'),
      'a-new-password-long',
    );
    await fireEvent.press(screen.getByTestId('account-security.change-password'));
    await fireEvent.press(screen.getByRole('button', { name: 'Confirm change' }));

    await waitFor(() => expect(mockChangePassword).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId('account-security.current-password')).toBeOnTheScreen();
    expect(screen.getByTestId('account-security.current-password')).toHaveProp('value', 'wrong-password');
    expect(screen.getByTestId('account-security.new-password')).toHaveProp('value', 'a-new-password-long');
    expect(screen.getByTestId('account-security.error')).toHaveTextContent('Current password incorrect');
  });

  it('disables the sheet and sends one request while the password change is pending', async () => {
    let resolveChange!: (value: boolean) => void;
    mockChangePassword.mockReturnValue(
      new Promise<boolean>((resolve) => {
        resolveChange = resolve;
      }),
    );

    await render(
      <ToastProvider>
        <AccountPasswordRoute />
      </ToastProvider>,
    );
    await fireEvent.changeText(
      screen.getByTestId('account-security.current-password'),
      'current-password',
    );
    await fireEvent.changeText(
      screen.getByTestId('account-security.new-password'),
      'a-new-password-long',
    );
    await fireEvent.press(screen.getByTestId('account-security.change-password'));
    await fireEvent.press(screen.getByRole('button', { name: 'Confirm change' }));

    await waitFor(() => expect(mockChangePassword).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId('account-security.change-password')).toBeDisabled();

    resolveChange(true);
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/login'));
    expect(mockChangePassword).toHaveBeenCalledTimes(1);
  });

  it('routes email changes through the sheet confirmation gate', async () => {
    mockChangeEmail.mockResolvedValueOnce(true);

    await render(
      <ToastProvider>
        <AccountEmailRoute />
      </ToastProvider>,
    );
    await fireEvent.changeText(
      screen.getByTestId('account-security.new-email'),
      'new@example.test',
    );
    await fireEvent.changeText(
      screen.getByTestId('account-security.email-password'),
      'current-password',
    );
    await fireEvent.press(screen.getByTestId('account-security.change-email'));

    // C8: nothing is sent before the explicit confirmation.
    expect(mockChangeEmail).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: 'Confirm change' }));

    await waitFor(() =>
      expect(mockChangeEmail).toHaveBeenCalledWith({
        currentPassword: 'current-password',
        email: 'new@example.test',
      }),
    );
    expect(screen.getByTestId('app-toast')).toBeOnTheScreen();
    expect(screen.getByTestId('app-toast')).toHaveTextContent('Email updated');
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  it('routes enrollment through the sheet confirmation gate and returns to the screen', async () => {
    mockEnroll.mockResolvedValueOnce(true);

    await render(
      <ToastProvider>
        <AccountDeviceEnrollmentRoute />
      </ToastProvider>,
    );
    await fireEvent.changeText(
      screen.getByTestId('account-security.enrollment-password'),
      'current-password',
    );
    await fireEvent.press(screen.getByTestId('account-security.enroll-device'));

    // C9: nothing is sent before the explicit confirmation.
    expect(mockEnroll).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: 'Enroll' }));

    await waitFor(() =>
      expect(mockEnroll).toHaveBeenCalledWith('current-password', 'Test installation'),
    );
    expect(screen.getByTestId('app-toast')).toBeOnTheScreen();
    expect(screen.getByTestId('app-toast')).toHaveTextContent('Device enrolled');
    expect(mockDismissTo).toHaveBeenCalledWith({
      params: { notice: 'enrolled' },
      pathname: '/account-security',
    });
  });

  it('routes biometric disable through its password step-up and signs out', async () => {
    mockDisableBiometric.mockResolvedValueOnce(true);
    mockUseAuth.mockReturnValue(authState({ biometricEnabled: true }));

    await render(<AccountBiometricRoute />);
    await fireEvent.changeText(
      screen.getByTestId('account-security.disable-biometric-password'),
      'current-password',
    );
    await fireEvent.press(screen.getByTestId('account-security.disable-biometric'));

    await waitFor(() =>
      expect(mockDisableBiometric).toHaveBeenCalledWith('current-password'),
    );
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  it('keeps biometric enablement unavailable for unsupported capability', async () => {
    mockUseAuth.mockReturnValue(
      authState({
        biometricCapability: {
          deviceCredentialAvailable: true,
          status: 'unsupported',
          strongBiometricsAvailable: false,
        },
      }),
    );

    await render(<AccountSecurityScreen />);

    expect(screen.getByTestId('account-security.enable-biometric')).toBeDisabled();
    expect(mockEnableBiometric).not.toHaveBeenCalled();
  });
});

