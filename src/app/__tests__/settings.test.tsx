import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import SettingsScreen from '@/app/settings';

const mockLogout = jest.fn(async () => ({
  localClearFailed: false,
  remoteRevocationFailed: false,
}));

jest.mock('@/database/DatabaseProvider', () => ({
  useCaneGuardDatabase: () => ({}),
}));
jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    logout: mockLogout,
    user: {
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
});
