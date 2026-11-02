import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import LoginScreen from '@/app/login';
import { ToastProvider } from '@/components/ui/Toast';
import { useAuth } from '@/features/auth/hooks/useAuth';

afterEach(() => {
  jest.clearAllMocks();
});

jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = jest.mocked(useAuth);

function setAuthValue(overrides: Record<string, unknown> = {}) {
  mockUseAuth.mockReturnValue({
    biometricCapability: {
      deviceCredentialAvailable: true,
      status: 'available',
      strongBiometricsAvailable: true,
    },
    biometricEnabled: false,
    biometricLoading: false,
    changeEmail: jest.fn(async () => false),
    changePassword: jest.fn(async () => false),
    clearSessionAfterRemoteRevocation: jest.fn(async () => true),
    disableBiometric: jest.fn(async () => false),
    enableBiometricUnlock: jest.fn(async () => false),
    enrollMobileDevice: jest.fn(async () => false),
    errorMessage: null,
    login: jest.fn(async () => false),
    logout: jest.fn(async () => ({
      localClearFailed: false,
      remoteRevocationFailed: false,
    })),
    markSessionExpired: jest.fn(async () => undefined),
    session: null,
    sessionVerification: 'idle',
    status: 'unauthenticated',
    unlockWithBiometrics: jest.fn(async () => false),
    user: null,
    ...overrides,
  } as unknown as ReturnType<typeof useAuth>);
}

describe('LoginScreen account request', () => {
  it('points to the municipal office instead of a sign-up path', async () => {
    setAuthValue();

    await render(<LoginScreen />);

    expect(screen.getByText('Need an account? Ask your municipal agriculture office.')).toBeOnTheScreen();
    expect(screen.queryByText('Create an account')).toBeNull();
  });
});

describe('LoginScreen biometric fallback', () => {
  it('shows one accessible fallback button when biometric unlock is configured', async () => {
    const unlockWithBiometrics = jest.fn(async () => true);
    setAuthValue({ biometricEnabled: true, unlockWithBiometrics });

    await render(<LoginScreen />);

    const button = screen.getByTestId('auth.biometric-unlock');
    expect(button).toHaveTextContent('Unlock with biometrics');
    expect(button).toHaveProp('accessibilityLabel', 'Unlock with biometrics');

    await fireEvent.press(button);
    await waitFor(() => expect(unlockWithBiometrics).toHaveBeenCalledTimes(1));
  });

  it('keeps the fallback button unavailable when biometric unlock is not configured', async () => {
    setAuthValue({
      biometricCapability: {
        deviceCredentialAvailable: false,
        status: 'unsupported',
        strongBiometricsAvailable: false,
      },
    });

    await render(<LoginScreen />);

    expect(screen.queryByTestId('auth.biometric-unlock')).not.toBeOnTheScreen();
    // M09/D01: a password-only session explains the offline restart limit
    // without implying that a password is stored for offline unlock.
    expect(screen.getByTestId('auth.offline-restart-limit')).toHaveTextContent(
      /Password-only sign-in/,
    );
    expect(screen.getByTestId('auth.offline-restart-limit')).toHaveTextContent(
      /Turn on biometric unlock/,
    );
  });

  it('disables the fallback button while its biometric prompt is loading', async () => {
    setAuthValue({ biometricEnabled: true, biometricLoading: true });

    await render(<LoginScreen />);

    const button = screen.getByTestId('auth.biometric-unlock');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Unlocking...');
  });

  it('displays visible confirmation toast when signing in with biometric unlock', async () => {
    const unlockWithBiometrics = jest.fn(async () => true);
    setAuthValue({ biometricEnabled: true, unlockWithBiometrics });

    await render(
      <ToastProvider>
        <LoginScreen />
      </ToastProvider>,
    );

    await fireEvent.press(screen.getByTestId('auth.biometric-unlock'));
    await waitFor(() => {
      expect(screen.getByTestId('app-toast')).toBeOnTheScreen();
      expect(screen.getByTestId('app-toast')).toHaveTextContent('Signed in');
    });
  });

  it('keeps the submit label in full ink with a spinner while a password sign-in is in flight', async () => {
    let releaseLogin: (authenticated: boolean) => void = () => undefined;
    const login = jest.fn(
      () => new Promise<boolean>((resolve) => { releaseLogin = resolve; }),
    );
    setAuthValue({ biometricEnabled: true, login });

    await render(
      <ToastProvider>
        <LoginScreen />
      </ToastProvider>,
    );

    await fireEvent.changeText(screen.getByTestId('auth.email-input'), 'ana.example.test');
    await fireEvent.changeText(screen.getByTestId('auth.password-input'), 'secret');

    await act(async () => {
      fireEvent.press(screen.getByTestId('auth.login-submit'));
    });

    const submit = screen.getByTestId('auth.login-submit');
    expect(screen.getByText('Signing In...')).toHaveStyle({ color: 'background' });
    expect(screen.getByTestId('auth.login-submit.spinner')).toBeOnTheScreen();
    expect(submit).toBeDisabled();
    expect(submit.props.accessibilityState).toEqual({ disabled: true, busy: true });

    // The sibling fallback is idle-disabled, not busy: muted ink and no spinner.
    expect(screen.getByTestId('auth.biometric-unlock')).toBeDisabled();
    expect(screen.queryByTestId('auth.biometric-unlock.spinner')).toBeNull();
    expect(screen.getByText('Unlock with biometrics')).toHaveStyle({ color: 'textSecondary' });

    // A second tap while the sign-in is in flight must not start another attempt.
    await fireEvent.press(submit);
    expect(login).toHaveBeenCalledTimes(1);

    await act(async () => {
      releaseLogin(false);
    });

    expect(screen.getByText('Login')).toHaveStyle({ color: 'background' });
    expect(screen.queryByTestId('auth.login-submit.spinner')).toBeNull();
  });

  it('keeps the open field guide entry point on the login screen', async () => {
    setAuthValue();

    await render(<LoginScreen />);

    const button = screen.getByTestId('auth.field-guide');
    expect(button).toHaveProp('accessibilityLabel', 'Open the field guide without signing in');

    await fireEvent.press(button);
    expect(router.push).toHaveBeenCalledWith('/field-guide');
  });
});
