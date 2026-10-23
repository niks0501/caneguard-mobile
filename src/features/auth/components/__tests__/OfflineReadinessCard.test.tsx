import { render, screen } from '@testing-library/react-native';

import { OfflineReadinessCard } from '@/features/auth/components/OfflineReadinessCard';
import { useOfflineReadiness } from '@/features/auth/hooks/useOfflineReadiness';

jest.mock('@/features/auth/hooks/useOfflineReadiness', () => ({
  useOfflineReadiness: jest.fn(),
}));

const mockReadiness = jest.mocked(useOfflineReadiness);

function readiness(overrides: Record<string, unknown> = {}) {
  return {
    assignmentCount: 3,
    checkingAssignments: false,
    protectedSessionEnabled: true,
    ready: true,
    refresh: jest.fn(),
    sessionExpired: false,
    sessionExpiresAt: '2030-01-01T00:00:00.000Z',
    ...overrides,
  } as ReturnType<typeof useOfflineReadiness>;
}

describe('OfflineReadinessCard', () => {
  it('shows ready only when the protected session and cached visits are usable', async () => {
    mockReadiness.mockReturnValue(readiness());

    await render(<OfflineReadinessCard />);

    expect(screen.getByText('Ready for offline work')).toBeOnTheScreen();
    expect(screen.getByText('Biometric-protected session')).toBeOnTheScreen();
    expect(screen.getByText('3 visits saved on this device.')).toBeOnTheScreen();
    expect(screen.getByText(/never stores your password/)).toBeOnTheScreen();
  });

  it('explains a password-only restart limit instead of promising offline unlock', async () => {
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
      screen.getByText(/cannot restore after a restart/),
    ).toBeOnTheScreen();
    expect(
      screen.getByText(/No protected session is configured on this device/),
    ).toBeOnTheScreen();
  });

  it('reports an expired protected session as not ready', async () => {
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
});
