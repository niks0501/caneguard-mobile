import { render, screen } from '@testing-library/react-native';

import { OfflineReadinessCard } from '@/features/auth/components/OfflineReadinessCard';
import { useOfflineReadiness } from '@/features/auth/hooks/useOfflineReadiness';

jest.mock('@/features/auth/hooks/useOfflineReadiness', () => ({
  useOfflineReadiness: jest.fn(),
}));
let mockLanguage: 'en' | 'tl' = 'en';
jest.mock('@/providers/LanguagePreferenceProvider', () => ({
  useLanguagePreference: () => ({ language: mockLanguage }),
  useOptionalLanguage: () => mockLanguage,
}));

const mockReadiness = jest.mocked(useOfflineReadiness);

function readiness(overrides: Record<string, unknown> = {}) {
  return {
    assignmentCount: 3,
    checkingAssignments: false,
    deviceCredentialAvailable: true,
    farmerOfflineGrace: false,
    isFarmer: false,
    localLockMode: 'device' as const,
    protectedSessionEnabled: true,
    ready: true,
    refresh: jest.fn(),
    sessionExpired: false,
    sessionExpiresAt: '2030-01-01T00:00:00.000Z',
    strongBiometricsAvailable: true,
    ...overrides,
  } as ReturnType<typeof useOfflineReadiness>;
}

describe('OfflineReadinessCard', () => {
  beforeEach(() => {
    mockLanguage = 'en';
  });

  it('shows ready when offline access is active and visits are saved', async () => {
    mockReadiness.mockReturnValue(readiness());

    await render(<OfflineReadinessCard />);

    expect(screen.getByText('Ready for offline work')).toBeOnTheScreen();
    expect(screen.getByText('Offline access')).toBeOnTheScreen();
    expect(screen.getByText('3 visits saved on this device.')).toBeOnTheScreen();
    expect(screen.getByText(/never stores your password/)).toBeOnTheScreen();
  });

  it('stays ready with 0 assigned visits so ad-hoc field scans and reports work offline', async () => {
    mockReadiness.mockReturnValue(
      readiness({
        assignmentCount: 0,
        localLockMode: 'app-pin',
        ready: true,
      }),
    );

    await render(<OfflineReadinessCard />);

    expect(screen.getByText('Ready for offline work')).toBeOnTheScreen();
    expect(
      screen.getByText(
        '0 office visits assigned — you can still scan and file field reports offline.',
      ),
    ).toBeOnTheScreen();
    expect(screen.getByText(/4-digit Quick PIN/)).toBeOnTheScreen();
  });

  it('explains when offline persistence is off instead of promising offline access', async () => {
    mockReadiness.mockReturnValue(
      readiness({
        ready: false,
        protectedSessionEnabled: false,
        sessionExpiresAt: null,
      }),
    );

    await render(<OfflineReadinessCard />);

    expect(screen.getByText('Not ready for offline work')).toBeOnTheScreen();
    expect(
      screen.getByText(/sign in again while online to save this session/i),
    ).toBeOnTheScreen();
    expect(
      screen.getByText(/No saved session is configured on this device/),
    ).toBeOnTheScreen();
  });

  it('reports an expired inspector session as not ready', async () => {
    mockReadiness.mockReturnValue(
      readiness({ ready: false, sessionExpired: true }),
    );

    await render(<OfflineReadinessCard />);

    expect(
      screen.getByText(/Expired — sign in again while online/),
    ).toBeOnTheScreen();
  });

  it('never claims readiness when the cached visit list cannot be read', async () => {
    mockReadiness.mockReturnValue(
      readiness({ assignmentCount: null, ready: false }),
    );

    await render(<OfflineReadinessCard />);

    expect(
      screen.getByText('Saved visits could not be read on this device.'),
    ).toBeOnTheScreen();
    expect(screen.getByText('Not ready for offline work')).toBeOnTheScreen();
  });

  it('renders a calm Tagalog offline status card for farmers', async () => {
    mockLanguage = 'tl';
    mockReadiness.mockReturnValue(
      readiness({
        assignmentCount: 0,
        isFarmer: true,
        localLockMode: 'none',
        ready: true,
      }),
    );

    await render(<OfflineReadinessCard />);

    expect(screen.getByText('Handa offline')).toBeOnTheScreen();
    expect(
      screen.getByText(/Mananatiling naka-sign in ang account mo/),
    ).toBeOnTheScreen();
  });

  it('renders personal-scan offline grace status for farmers past 30-day token expiry', async () => {
    mockLanguage = 'en';
    mockReadiness.mockReturnValue(
      readiness({
        assignmentCount: 0,
        farmerOfflineGrace: true,
        isFarmer: true,
        localLockMode: 'none',
        ready: true,
      }),
    );

    await render(<OfflineReadinessCard />);

    expect(screen.getByText('Working offline (personal scans)')).toBeOnTheScreen();
    expect(screen.getByText(/keep scanning and viewing your saved scans offline/)).toBeOnTheScreen();
  });
});
