import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import HomeScreen from '@/app/home';

jest.mock('@/features/sync/hooks/useSync', () => ({
  useSync: () => ({
    errorMessage: null,
    isOnline: true,
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
