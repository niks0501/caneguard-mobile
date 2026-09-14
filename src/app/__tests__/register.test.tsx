import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { registerMobile, resendVerification } from '@/features/auth/api/mobileAuthApi';
import RegisterScreen from '@/app/register';

jest.mock('@/features/auth/api/mobileAuthApi', () => ({
  MobileAuthError: class MobileAuthError extends Error {},
  registerMobile: jest.fn(),
  resendVerification: jest.fn(),
}));

describe('RegisterScreen', () => {
  const mockRegister = jest.mocked(registerMobile);
  const mockResend = jest.mocked(resendVerification);

  beforeEach(() => {
    mockRegister.mockReset();
    mockResend.mockReset();
  });

  it('offers only name, email, and password and keeps the form keyboard-aware', async () => {
    mockRegister.mockResolvedValueOnce({
      code: 'REGISTRATION_CREATED',
      message: 'Account created.',
      user: {
        uuid: 'user-uuid',
        name: 'Maria Santos',
        email: 'maria@example.test',
        role: 'field_reporter',
        emailVerified: false,
      },
    });
    mockResend.mockResolvedValueOnce({
      code: 'VERIFICATION_LINK_SENT',
      message: 'If the address is eligible, a verification link will be sent.',
    });

    await render(<RegisterScreen />);

    expect(screen.getByTestId('screen-container.keyboard-avoiding-view')).toBeOnTheScreen();
    expect(screen.getByTestId('register.full-name-input')).toBeOnTheScreen();
    expect(screen.getByTestId('register.email-input')).toBeOnTheScreen();
    expect(screen.getByTestId('register.password-input')).toBeOnTheScreen();
    expect(screen.queryByTestId('register.barangay-input')).not.toBeOnTheScreen();
    expect(screen.queryByTestId('register.phone-input')).not.toBeOnTheScreen();

    await fireEvent.changeText(screen.getByTestId('register.full-name-input'), 'Maria Santos');
    await fireEvent.changeText(screen.getByTestId('register.email-input'), ' MARIA@EXAMPLE.TEST ');
    await fireEvent.changeText(
      screen.getByTestId('register.password-input'),
      'a-long-enough-passphrase',
    );
    await fireEvent.press(screen.getByTestId('register.submit'));

    await waitFor(() => expect(screen.getByTestId('register.verification-state')).toBeOnTheScreen());
    expect(mockRegister).toHaveBeenCalledWith({
      email: ' MARIA@EXAMPLE.TEST ',
      name: 'Maria Santos',
      password: 'a-long-enough-passphrase',
    });
    expect(screen.getByText('We created your Field Inspector account. Verify maria@example.test before signing in.')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('register.resend-verification'));
    await waitFor(() => expect(screen.getByText('If the address is eligible, a verification link will be sent.')).toBeOnTheScreen());
    expect(mockResend).toHaveBeenCalledWith('maria@example.test');
  });

  it('requires the contract password minimum before submitting', async () => {
    await render(<RegisterScreen />);
    await fireEvent.changeText(screen.getByTestId('register.full-name-input'), 'Maria Santos');
    await fireEvent.changeText(screen.getByTestId('register.email-input'), 'maria@example.test');
    await fireEvent.changeText(screen.getByTestId('register.password-input'), 'short');

    expect(screen.getByTestId('register.submit')).toBeDisabled();
    expect(mockRegister).not.toHaveBeenCalled();
  });
});
