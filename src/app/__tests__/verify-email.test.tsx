import { render, screen, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';

import {
  MobileAuthError,
  verifyEmail,
} from '@/features/auth/api/mobileAuthApi';
import VerifyEmailScreen from '@/app/verify-email';

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
  verifyEmail: jest.fn(),
}));

describe('VerifyEmailScreen', () => {
  const mockParams = jest.mocked(useLocalSearchParams);
  const mockVerifyEmail = jest.mocked(verifyEmail);

  beforeEach(() => {
    mockParams.mockReturnValue({
      expires: '123',
      hash: 'email-hash',
      id: 'user-id',
      signature: 'signed-value',
    });
    mockVerifyEmail.mockReset();
  });

  it('hands the signed verification parameters to the API and shows success', async () => {
    mockVerifyEmail.mockResolvedValueOnce({
      code: 'EMAIL_VERIFIED',
      message: 'Email address verified.',
    });

    await render(<VerifyEmailScreen />);

    await waitFor(() =>
      expect(screen.getByTestId('verify-email.success')).toBeOnTheScreen(),
    );
    expect(mockVerifyEmail).toHaveBeenCalledWith({
      expires: '123',
      hash: 'email-hash',
      id: 'user-id',
      signature: 'signed-value',
    });
  });

  it('shows a stable invalid-link state', async () => {
    mockVerifyEmail.mockRejectedValueOnce(
      new MobileAuthError(
        'INVALID_VERIFICATION_LINK',
        'This email-verification link is invalid or expired. Request a new link.',
      ),
    );

    await render(<VerifyEmailScreen />);

    await waitFor(() =>
      expect(
        screen.getByText(
          'This email-verification link is invalid or expired. Request a new link.',
        ),
      ).toBeOnTheScreen(),
    );
  });

  it('does not call the API without all signed parameters', async () => {
    mockParams.mockReturnValue({ id: 'user-id' });

    await render(<VerifyEmailScreen />);

    expect(screen.getByTestId('verify-email.missing')).toBeOnTheScreen();
    expect(mockVerifyEmail).not.toHaveBeenCalled();
  });
});
