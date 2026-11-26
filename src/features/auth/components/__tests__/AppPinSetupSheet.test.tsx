import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';

import AccountAppPinRoute from '@/app/account-app-pin';
import { ToastProvider } from '@/components/ui/Toast';
import { useAuth } from '@/features/auth/hooks/useAuth';

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  },
  useLocalSearchParams: jest.fn(() => ({})),
}));
jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));
jest.mock('@/providers/LanguagePreferenceProvider', () => ({
  useLanguagePreference: () => ({ language: 'en' as const }),
}));

describe('AppPinSetupSheet', () => {
  const mockSetupAppPin = jest.fn();
  const mockDismissInitialPinSetup = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetupAppPin.mockResolvedValue(true);
    jest.mocked(useLocalSearchParams).mockReturnValue({});
    jest.mocked(useAuth).mockReturnValue({
      dismissInitialPinSetup: mockDismissInitialPinSetup,
      errorMessage: null,
      setupAppPin: mockSetupAppPin,
      user: { role: 'field_reporter' },
    } as never);
  });

  it('rejects mismatched 4-digit PINs before saving', async () => {
    await render(
      <ToastProvider>
        <AccountAppPinRoute />
      </ToastProvider>,
    );

    await fireEvent.changeText(screen.getByTestId('account-security.app-pin-input'), '1234');
    await fireEvent.changeText(screen.getByTestId('account-security.app-pin-confirm'), '5678');
    await fireEvent.press(screen.getByTestId('account-security.app-pin-submit'));

    expect(screen.getByTestId('account-security.app-pin-error')).toHaveTextContent(
      'The two PINs do not match.',
    );
    expect(mockSetupAppPin).not.toHaveBeenCalled();
  });

  it('saves a matching 4-digit PIN and closes the sheet', async () => {
    await render(
      <ToastProvider>
        <AccountAppPinRoute />
      </ToastProvider>,
    );

    await fireEvent.changeText(screen.getByTestId('account-security.app-pin-input'), '2580');
    await fireEvent.changeText(screen.getByTestId('account-security.app-pin-confirm'), '2580');
    await fireEvent.press(screen.getByTestId('account-security.app-pin-submit'));

    await waitFor(() => expect(mockSetupAppPin).toHaveBeenCalledWith('2580'));
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('supports skipping onboarding Quick PIN setup with Not now', async () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ onboarding: '1' });

    await render(
      <ToastProvider>
        <AccountAppPinRoute />
      </ToastProvider>,
    );

    expect(screen.getByText('Set a 4-digit Quick PIN')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('account-security.app-pin-cancel'));

    expect(mockDismissInitialPinSetup).toHaveBeenCalledTimes(1);
    expect(router.back).toHaveBeenCalledTimes(1);
  });
});
