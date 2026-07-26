import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { CaneGuardDatabaseProvider } from '@/database/DatabaseProvider';
import { getCaneGuardDatabaseResources } from '@/database/database';

jest.mock('drizzle-orm/expo-sqlite/migrator', () => ({
  useMigrations: jest.fn(),
}));

jest.mock('@/database/database', () => ({
  clearCaneGuardDatabaseResourcesForRetry: jest.fn(),
  getCaneGuardDatabaseResources: jest.fn(),
}));

const mockUseMigrations = jest.mocked(useMigrations);
const mockGetResources = jest.mocked(getCaneGuardDatabaseResources);

describe('CaneGuardDatabaseProvider', () => {
  beforeEach(() => {
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
