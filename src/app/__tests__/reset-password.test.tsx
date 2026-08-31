import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';

import {
  MobileAuthError,
  resetPassword,
} from '@/features/auth/api/mobileAuthApi';
import ResetPasswordScreen from '@/app/reset-password';
import { useAuth } from '@/features/auth/hooks/useAuth';

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
  },
  useLocalSearchParams: jest.fn(),
}));
jest.mock('@/features/auth/api/mobileAuthApi', () => ({
  MobileAuthError: class MobileAuthError extends Error {
    code: string;

    constructor(code: string, message: string) {
      super(message);
      this.name = 'MobileAuthError';
      this.code = code;
    }
  },
  resetPassword: jest.fn(),
}));
jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

describe('ResetPasswordScreen', () => {
  const mockParams = jest.mocked(useLocalSearchParams);
  const mockResetPassword = jest.mocked(resetPassword);
  const mockUseAuth = jest.mocked(useAuth);
  const mockClear = jest.fn();
  const resetValue = ['one', 'time', 'value'].join('-');

  beforeEach(() => {
    mockParams.mockReturnValue({
      email: 'reporter@example.test',
      token: resetValue,
    });
    mockResetPassword.mockReset();
    mockClear.mockReset();
    mockClear.mockResolvedValue(true);
    mockUseAuth.mockReturnValue({
      clearSessionAfterRemoteRevocation: mockClear,
    } as unknown as ReturnType<typeof useAuth>);
  });

  it('hands the in-memory link value to the API and clears cached credentials on success', async () => {
    mockResetPassword.mockResolvedValueOnce({
      code: 'PASSWORD_RESET',
      message: 'Password updated.',
    });

    await render(<ResetPasswordScreen />);
    await fireEvent.changeText(
      screen.getByTestId('reset-password.password-input'),
      'a-new-long-enough-passphrase',
    );
    await fireEvent.press(screen.getByTestId('reset-password.submit'));

    await waitFor(() =>
      expect(screen.getByTestId('reset-password.success')).toBeOnTheScreen(),
    );
    expect(mockResetPassword).toHaveBeenCalledWith({
      email: 'reporter@example.test',
      password: 'a-new-long-enough-passphrase',
      token: resetValue,
    });
    expect(mockClear).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(resetValue)).not.toBeOnTheScreen();
  });

  it('shows a generic invalid, expired, or already-used link state', async () => {
    mockResetPassword.mockRejectedValueOnce(
      new MobileAuthError(
        'INVALID_RESET_TOKEN',
        'This recovery link is invalid, expired, or already used. Request a new link.',
      ),
    );

    await render(<ResetPasswordScreen />);
    await fireEvent.changeText(
      screen.getByTestId('reset-password.password-input'),
      'a-new-long-enough-passphrase',
    );
    await fireEvent.press(screen.getByTestId('reset-password.submit'));

    await waitFor(() =>
      expect(screen.getByTestId('reset-password.error')).toHaveTextContent(
        'This recovery link is invalid, expired, or already used. Request a new link.',
      ),
    );
    expect(mockClear).not.toHaveBeenCalled();
  });

  it('requires a link value before rendering the reset form', async () => {
    mockParams.mockReturnValue({ email: 'reporter@example.test' });

    await render(<ResetPasswordScreen />);

    expect(screen.getByTestId('reset-password.missing-token')).toBeOnTheScreen();
    expect(screen.queryByTestId('reset-password.submit')).not.toBeOnTheScreen();
    expect(mockResetPassword).not.toHaveBeenCalled();
  });
});
