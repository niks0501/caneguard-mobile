import { render, screen } from '@testing-library/react-native';

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
  it('marks unfinished controls as disabled Coming later rows', async () => {
    await render(<SettingsScreen />);

    for (const label of [
      'High Contrast Mode',
      'Sync Alerts',
      'Office Advisories',
    ]) {
      const row = screen.getByLabelText(`${label}: Coming later`);
      expect(row).toBeDisabled();
      expect(row).toHaveProp('accessibilityState', { disabled: true });
    }

    expect(screen.getAllByText('Coming later')).toHaveLength(3);
  });

  it('keeps Dark Mode as the available display setting', async () => {
    await render(<SettingsScreen />);

    const darkMode = screen.getByLabelText('Dark Mode');
    expect(darkMode).toBeEnabled();
    expect(screen.queryByText('English')).not.toBeOnTheScreen();
    expect(screen.queryByText('Normal')).not.toBeOnTheScreen();
  });
});
