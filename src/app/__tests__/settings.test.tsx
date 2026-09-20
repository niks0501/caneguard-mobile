import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { router } from 'expo-router';

import SettingsScreen from '@/app/settings';
import { ToastProvider } from '@/components/ui/Toast';
import { clearLocalDataForOwner } from '@/database/localDataLifecycle';

const mockLogout = jest.fn(async () => ({
  localClearFailed: false,
  remoteRevocationFailed: false,
}));

jest.mock('@/database/DatabaseProvider', () => ({
  useCaneGuardDatabase: () => ({}),
}));
jest.mock('@/database/localDataLifecycle', () => ({
  clearLocalDataForOwner: jest.fn(async () => ({ imageCleanupErrors: [] })),
}));
jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    logout: mockLogout,
    user: {
      uuid: 'user-uuid-1',
      name: 'Ana Reyes',
      email: 'ana@example.test',
    },
  }),
}));

describe('SettingsScreen', () => {
  it('presents honest active settings without dead Coming later rows', async () => {
    await render(<SettingsScreen />);

    expect(screen.queryByText('Coming later')).not.toBeOnTheScreen();
    expect(screen.queryByText('High Contrast Mode')).not.toBeOnTheScreen();
    expect(screen.queryByText('Sync Alerts')).not.toBeOnTheScreen();
    expect(screen.queryByText('Office Advisories')).not.toBeOnTheScreen();

    const darkMode = screen.getByLabelText('Dark Mode');
    expect(darkMode).toBeEnabled();
    expect(screen.getByTestId('settings.disease-reference')).toBeOnTheScreen();
    expect(screen.getByText('Account security')).toBeOnTheScreen();
  });

  it('links to the disease reference guide', async () => {
    await render(<SettingsScreen />);

    await fireEvent.press(screen.getByTestId('settings.disease-reference'));
    expect(router.push).toHaveBeenCalledWith('/disease-reference');
  });

  it('displays confirmation toast when logging out', async () => {
    jest.spyOn(Alert, 'alert');
    await render(
      <ToastProvider>
        <SettingsScreen />
      </ToastProvider>,
    );

    await fireEvent.press(screen.getByTestId('settings.logout'));
    const alertCall = jest.mocked(Alert.alert).mock.calls.find((call) => call[0] === 'Log out?');
    const logoutAction = alertCall?.[2]?.find((action) => action.style === 'destructive');

    await act(async () => {
      logoutAction?.onPress?.();
    });

    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('app-toast')).toBeOnTheScreen();
    expect(screen.getByTestId('app-toast')).toHaveTextContent('Signed out');
  });

  it('displays confirmation toast when clearing local data', async () => {
    jest.spyOn(Alert, 'alert');
    await render(
      <ToastProvider>
        <SettingsScreen />
      </ToastProvider>,
    );

    await fireEvent.press(screen.getByTestId('settings.clear-local-data'));
    const alertCall = jest.mocked(Alert.alert).mock.calls.find((call) => call[0] === 'Clear local data?');
    const clearAction = alertCall?.[2]?.find((action) => action.style === 'destructive');

    await act(async () => {
      clearAction?.onPress?.();
    });

    expect(clearLocalDataForOwner).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('app-toast')).toBeOnTheScreen();
    expect(screen.getByTestId('app-toast')).toHaveTextContent('Local data cleared');
  });
});
