import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import HomeScreen from '@/app/home';

let mockIsOnline: boolean | null = true;

jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      email: 'ari@example.test',
      name: 'Ari Santos',
      role: 'field_reporter',
      uuid: 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17',
    },
  }),
}));
jest.mock('@/features/sync/hooks/useSync', () => ({
  useSync: () => ({
    errorMessage: null,
    get isOnline() {
      return mockIsOnline;
    },
    isSyncing: false,
    lastSuccessfulSyncAt: null,
    pendingCount: 1,
    syncNow: jest.fn(async () => null),
  }),
}));

const mockRouterPush = router.push as jest.Mock;

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsOnline = true;
  });

  it('renders the session identity and tri-state connection badge without a location line', async () => {
    const connectionStates: { isOnline: boolean | null; label: string }[] = [
      { isOnline: true, label: 'Online' },
      { isOnline: false, label: 'Offline' },
      { isOnline: null, label: 'Checking connection' },
    ];

    for (const state of connectionStates) {
      mockIsOnline = state.isOnline;
      const rendered = await render(<HomeScreen />);

      expect(screen.getByText('Ari Santos')).toBeOnTheScreen();
      expect(screen.queryByText('Nikko Selwyn')).not.toBeOnTheScreen();
      expect(screen.getByText(state.label)).toBeOnTheScreen();
      expect(screen.queryByText('Brgy. Cogunan, Nasugbu, Batangas')).not.toBeOnTheScreen();

      await rendered.unmount();
    }
  });

  it('shows only the supported education reference classes', async () => {
    await render(<HomeScreen />);

    expect(screen.getByText('DISEASE REFERENCE')).toBeOnTheScreen();
    expect(screen.getByText('Healthy')).toBeOnTheScreen();
    expect(screen.getByText('Mosaic')).toBeOnTheScreen();
    expect(screen.getByText('Rust')).toBeOnTheScreen();
    expect(screen.queryByText(/Downy Mildew|Smut/i)).not.toBeOnTheScreen();
    expect(screen.getByText(/Reference photos are supplied locally/)).toBeOnTheScreen();
    expect(screen.getByLabelText('Healthy reference photo')).toHaveProp(
      'source',
      require('../../../assets/images/sugarcane-diseases/reference_healthy.jpg'),
    );
    expect(screen.getByLabelText('Mosaic reference photo')).toHaveProp(
      'source',
      require('../../../assets/images/sugarcane-diseases/reference_mosaic.jpg'),
    );
    expect(screen.getByLabelText('Rust reference photo')).toHaveProp(
      'source',
      require('../../../assets/images/sugarcane-diseases/reference_rust.jpg'),
    );
  });

  it('keeps the live sync row linked to Records without adding a sync shortcut', async () => {
    await render(<HomeScreen />);

    expect(screen.getByText('1 report awaiting sync')).toBeOnTheScreen();
    expect(screen.queryByText('Sync Queue')).not.toBeOnTheScreen();
    expect(screen.queryByText('Help & FAQ')).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('home.sync-status'));
    expect(mockRouterPush).toHaveBeenCalledWith('/records');
  });
});
