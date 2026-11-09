import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { render, screen } from '@testing-library/react-native';
import * as SplashScreen from 'expo-splash-screen';
import { Text } from 'react-native';

import { CaneGuardDatabaseProvider } from '@/database/DatabaseProvider';
import { getCaneGuardDatabaseResources } from '@/database/database';

jest.mock('drizzle-orm/expo-sqlite/migrator', () => ({
  useMigrations: jest.fn(),
}));

jest.mock('expo-splash-screen', () => ({
  hideAsync: jest.fn(async () => undefined),
}));

jest.mock('@/database/database', () => ({
  clearCaneGuardDatabaseResourcesForRetry: jest.fn(),
  getCaneGuardDatabaseResources: jest.fn(),
}));

const mockUseMigrations = jest.mocked(useMigrations);
const mockGetResources = jest.mocked(getCaneGuardDatabaseResources);
const mockHideSplash = jest.mocked(SplashScreen.hideAsync);

describe('CaneGuardDatabaseProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetResources.mockReturnValue({
      database: {} as ReturnType<typeof getCaneGuardDatabaseResources>['database'],
      sqlite: {} as ReturnType<typeof getCaneGuardDatabaseResources>['sqlite'],
    });
  });

  it('gates application content while migrations are running', async () => {
    mockUseMigrations.mockReturnValue({ success: false });

    await render(
      <CaneGuardDatabaseProvider>
        <Text>Application content</Text>
      </CaneGuardDatabaseProvider>,
    );

    expect(screen.getByText('Preparing local storage')).toBeOnTheScreen();
    expect(screen.queryByText('Application content')).not.toBeOnTheScreen();
  });

  it('renders application content only after migrations succeed', async () => {
    mockUseMigrations.mockReturnValue({ success: true });

    await render(
      <CaneGuardDatabaseProvider>
        <Text>Application content</Text>
      </CaneGuardDatabaseProvider>,
    );

    expect(screen.getByText('Application content')).toBeOnTheScreen();
  });

  it('exposes migration status and retry controls through stable test IDs', async () => {
    mockUseMigrations.mockReturnValue({
      success: false,
      error: new Error('migration failed'),
    });

    await render(
      <CaneGuardDatabaseProvider>
        <Text>Application content</Text>
      </CaneGuardDatabaseProvider>,
    );

    expect(screen.getByTestId('db.init-status')).toBeOnTheScreen();
    expect(screen.getByTestId('db.retry')).toBeOnTheScreen();
  });

  it('dismisses the splash while showing a migration failure', async () => {
    mockUseMigrations.mockReturnValue({
      success: false,
      error: new Error('migration failed'),
    });

    await render(
      <CaneGuardDatabaseProvider>
        <Text>Application content</Text>
      </CaneGuardDatabaseProvider>,
    );

    expect(mockHideSplash).toHaveBeenCalledTimes(1);
  });

  it('presents a sanitized recoverable migration error', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    mockUseMigrations.mockReturnValue({
      success: false,
      error: new Error('SQL at file:///private/caneguard.db failed'),
    });

    await render(
      <CaneGuardDatabaseProvider>
        <Text>Application content</Text>
      </CaneGuardDatabaseProvider>,
    );

    expect(screen.getByText('Local storage needs attention')).toBeOnTheScreen();
    expect(
      screen.getByText(
        'CaneGuard could not update local storage. Your existing records were not reset.',
      ),
    ).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Retry local storage initialization' }))
      .toBeOnTheScreen();
    expect(screen.queryByText(/file:\/\//)).not.toBeOnTheScreen();

    consoleError.mockRestore();
  });
});
