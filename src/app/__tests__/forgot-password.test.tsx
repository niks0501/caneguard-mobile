import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import {
  MobileAuthError,
  requestPasswordReset,
} from '@/features/auth/api/mobileAuthApi';
import ForgotPasswordScreen from '@/app/forgot-password';

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

  beforeEach(() => {
    mockRequestPasswordReset.mockReset();
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

  it('maps recovery failures to a stable message', async () => {
    mockRequestPasswordReset.mockRejectedValueOnce(
      new MobileAuthError(
        'SERVER_UNAVAILABLE',
        'CaneGuard could not reach the server. Check the API connection and try again.',
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
        'CaneGuard could not reach the server. Check the API connection and try again.',
      ),
    );
  });
});
