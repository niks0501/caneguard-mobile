import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import ForgotPasswordScreen from '@/app/forgot-password';
import {
  MobileAuthError,
  requestPasswordReset,
} from '@/features/auth/api/mobileAuthApi';
import { useAuth } from '@/features/auth/hooks/useAuth';

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
  },
}));
jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
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
  requestPasswordReset: jest.fn(),
}));

describe('ForgotPasswordScreen', () => {
  const mockRequestPasswordReset = jest.mocked(requestPasswordReset);
  const mockUseAuth = jest.mocked(useAuth);

  beforeEach(() => {
    mockRequestPasswordReset.mockReset();
    jest.mocked(router.push).mockReset();
    jest.mocked(router.replace).mockReset();
    mockUseAuth.mockReturnValue({
      status: 'unauthenticated',
    } as unknown as ReturnType<typeof useAuth>);
  });

  it('shows generic recovery confirmation without displaying a reset value', async () => {
    mockRequestPasswordReset.mockResolvedValueOnce({
      code: 'PASSWORD_RESET_LINK_SENT',
      message: 'If an account matches, a password recovery link will be sent.',
    });

    await render(<ForgotPasswordScreen />);
    await fireEvent.changeText(
      screen.getByTestId('forgot-password.email-input'),
      'REPORTER@example.test',
    );
    await fireEvent.press(screen.getByTestId('forgot-password.submit'));

    await waitFor(() =>
      expect(screen.getByTestId('forgot-password.success')).toBeOnTheScreen(),
    );
    expect(mockRequestPasswordReset).toHaveBeenCalledWith(
      'REPORTER@example.test',
    );
    expect(
      screen.getByText(
        'If an account matches, a password recovery link will be sent. The message is the same whether or not an account matches.',
      ),
    ).toBeOnTheScreen();
    expect(screen.queryByText(/token|reset value/i)).not.toBeOnTheScreen();
  });

  it('returns an authenticated user to Home instead of the guarded login route', async () => {
    mockUseAuth.mockReturnValue({
      status: 'authenticated',
    } as unknown as ReturnType<typeof useAuth>);

    await render(<ForgotPasswordScreen />);
    await fireEvent.press(screen.getByText('Back to login'));

    expect(router.push).toHaveBeenCalledWith('/home');
  });

  it('uses Home for the authenticated success-state action as well', async () => {
    mockUseAuth.mockReturnValue({
      status: 'authenticated',
    } as unknown as ReturnType<typeof useAuth>);
    mockRequestPasswordReset.mockResolvedValueOnce({
      code: 'PASSWORD_RESET_LINK_SENT',
      message: 'If an account matches, a password recovery link will be sent.',
    });

    await render(<ForgotPasswordScreen />);
    await fireEvent.changeText(
      screen.getByTestId('forgot-password.email-input'),
      'REPORTER@example.test',
    );
    await fireEvent.press(screen.getByTestId('forgot-password.submit'));
    await waitFor(() =>
      expect(screen.getByTestId('forgot-password.success')).toBeOnTheScreen(),
    );
    await fireEvent.press(screen.getByText('Return to login'));

    expect(router.replace).toHaveBeenCalledWith('/home');
  });

  it('maps recovery failures to a stable message', async () => {
    mockRequestPasswordReset.mockRejectedValueOnce(
      new MobileAuthError(
        'SERVER_UNAVAILABLE',
        'CaneGuard could not reach the server. Please check your connection and try again.',
      ),
    );

    await render(<ForgotPasswordScreen />);
    await fireEvent.changeText(
      screen.getByTestId('forgot-password.email-input'),
      'reporter@example.test',
    );
    await fireEvent.press(screen.getByTestId('forgot-password.submit'));

    await waitFor(() =>
      expect(screen.getByTestId('forgot-password.error')).toHaveTextContent(
        'CaneGuard could not reach the server. Please check your connection and try again.',
      ),
    );
  });
});
