import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { router } from 'expo-router';

import SettingsScreen from '@/app/settings';
import { ToastProvider } from '@/components/ui/Toast';
import {
  clearCachedOfficeDataForOwner,
  clearLocalDataForOwner,
  getLocalDataRemovalPreview,
} from '@/database/localDataLifecycle';

const mockLogout = jest.fn(async () => ({
  localClearFailed: false,
  remoteRevocationFailed: false,
}));

jest.mock('@/database/DatabaseProvider', () => {
  const stableDatabase = {};
  return { useCaneGuardDatabase: () => stableDatabase };
});
const preview = {
  assignments: 2,
  boundaries: 1,
  draftCheckpoints: 1,
  draftReports: 1,
  finalizedUnsentReports: 0,
  notifications: 3,
  reports: 2,
  scans: 2,
  totalRecords: 11,
  totalUnsent: 2,
  unsentBoundaries: 1,
  unsentScans: 1,
  unsentVisits: 0,
  uploadInFlight: false,
  visits: 0,
};
jest.mock('@/database/localDataLifecycle', () => ({
  clearCachedOfficeDataForOwner: jest.fn(async () => ({
    deletedRows: 5,
    imageCleanupErrors: [],
  })),
  clearLocalDataForOwner: jest.fn(async () => ({
    deletedRows: 4,
    imageCleanupErrors: [],
  })),
  getLocalDataRemovalPreview: jest.fn(() => preview),
}));
const mockReadinessSession = {
  expiresAt: '2030-01-01T00:00:00.000Z',
  token: 'token-1',
  user: { uuid: 'user-uuid-1' },
};
jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    biometricEnabled: true,
    logout: mockLogout,
    session: mockReadinessSession,
    user: {
      uuid: 'user-uuid-1',
      name: 'Ana Reyes',
      email: 'ana.example.test',
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

  it('links to the field guide', async () => {
    await render(<SettingsScreen />);

    await fireEvent.press(screen.getByTestId('settings.disease-reference'));
    expect(router.push).toHaveBeenCalledWith('/field-guide');
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

  it('clears only downloaded office data without touching unsent work', async () => {
    jest.spyOn(Alert, 'alert');
    await render(
      <ToastProvider>
        <SettingsScreen />
      </ToastProvider>,
    );

    await fireEvent.press(screen.getByTestId('settings.clear-cached-office-data'));
    const alertCall = jest
      .mocked(Alert.alert)
      .mock.calls.find((call) => call[0] === 'Clear downloaded office data?');
    const clearAction = alertCall?.[2]?.find(
      (action) => action.text === 'Clear downloaded data',
    );

    await act(async () => {
      clearAction?.onPress?.();
    });

    expect(clearCachedOfficeDataForOwner).toHaveBeenCalledTimes(1);
    expect(clearLocalDataForOwner).not.toHaveBeenCalled();
    expect(screen.getByTestId('app-toast')).toHaveTextContent(
      'Downloaded office data cleared',
    );
  });

  it('previews counts and requires an explicit unsent-loss acknowledgement before permanent removal', async () => {
    jest.spyOn(Alert, 'alert');
    await render(
      <ToastProvider>
        <SettingsScreen />
      </ToastProvider>,
    );

    await fireEvent.press(screen.getByTestId('settings.remove-local-records'));

    expect(getLocalDataRemovalPreview).toHaveBeenCalledTimes(1);
    const firstCall = jest
      .mocked(Alert.alert)
      .mock.calls.find((call) => call[0] === 'Remove all local records?');
    expect(firstCall?.[1]).toContain('2 reports');
    expect(firstCall?.[1]).toContain('2 items on this device have not reached the office');
    expect(firstCall?.[1]).toContain('1 boundary');

    const continueAction = firstCall?.[2]?.find(
      (action) => action.text === 'Continue without unsent work',
    );
    continueAction?.onPress?.();

    const secondCall = jest
      .mocked(Alert.alert)
      .mock.calls.find((call) => call[0] === 'Lose unsent work permanently?');
    expect(secondCall).toBeDefined();
    expect(clearLocalDataForOwner).not.toHaveBeenCalled();

    const deleteAction = secondCall?.[2]?.find(
      (action) => action.text === 'Delete unsent work',
    );
    await act(async () => {
      deleteAction?.onPress?.();
    });

    expect(clearLocalDataForOwner).toHaveBeenCalledWith(
      expect.anything(),
      'user-uuid-1',
      { expectedPreview: preview },
    );
    expect(screen.getByTestId('app-toast')).toHaveTextContent(
      'Local records removed',
    );
  });

  it('does not claim saved scans reached the office when nothing is unsent', async () => {
    jest.spyOn(Alert, 'alert');
    jest.mocked(getLocalDataRemovalPreview).mockReturnValueOnce({
      ...preview,
      draftCheckpoints: 0,
      scans: 2,
      totalUnsent: 0,
      unsentBoundaries: 0,
      unsentScans: 0,
      unsentVisits: 0,
    });

    await render(
      <ToastProvider>
        <SettingsScreen />
      </ToastProvider>,
    );
    await fireEvent.press(screen.getByTestId('settings.remove-local-records'));

    const call = jest
      .mocked(Alert.alert)
      .mock.calls.find((entry) => entry[0] === 'Remove all local records?');

    expect(call?.[1]).toContain('2 saved scans');
    expect(call?.[1]).not.toContain('not sent to the office');
    expect(call?.[1]).toContain(
      'Every listed report, visit and boundary has already reached the office.',
    );
    expect(call?.[1]).not.toContain('Everything listed has already reached the office.');
  });

  it('refuses permanent removal while an upload is in flight', async () => {
    jest.spyOn(Alert, 'alert');
    jest.mocked(getLocalDataRemovalPreview).mockReturnValueOnce({
      ...preview,
      uploadInFlight: true,
    });
    await render(<SettingsScreen />);

    await fireEvent.press(screen.getByTestId('settings.remove-local-records'));

    expect(clearLocalDataForOwner).not.toHaveBeenCalled();
    expect(
      jest
        .mocked(Alert.alert)
        .mock.calls.some((call) => call[0] === 'An upload is still running'),
    ).toBe(true);
  });

  it('shows the offline readiness check from the protected session state', async () => {
    await render(<SettingsScreen />);

    expect(screen.getByTestId('settings.offline-readiness')).toBeOnTheScreen();
    expect(screen.getByText('Not ready for offline work')).toBeOnTheScreen();
    expect(screen.getByText('Biometric-protected session')).toBeOnTheScreen();
  });
});
