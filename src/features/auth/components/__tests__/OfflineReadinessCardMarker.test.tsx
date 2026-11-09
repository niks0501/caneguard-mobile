import { render, screen } from '@testing-library/react-native';

import { OfflineReadinessCard } from '@/features/auth/components/OfflineReadinessCard';
import { useOfflineReadiness } from '@/features/auth/hooks/useOfflineReadiness';

jest.mock('@/features/auth/hooks/useOfflineReadiness', () => ({
  useOfflineReadiness: jest.fn(),
}));

// Proposal test for X-AG: proves the readiness card exposes state as a marker, with no secrets or identifiers.
it('exposes readiness as an accessibilityValue marker', async () => {
  jest.mocked(useOfflineReadiness).mockReturnValue({
    assignmentCount: 3,
    checkingAssignments: false,
    protectedSessionEnabled: true,
    ready: true,
    refresh: jest.fn(),
    sessionExpired: false,
    sessionExpiresAt: '2030-01-01T00:00:00.000Z',
  } as ReturnType<typeof useOfflineReadiness>);
  await render(<OfflineReadinessCard />);
  expect(screen.getByTestId('settings.offline-readiness').props.accessibilityValue).toEqual({
    text: 'state=ready;biometric=on;expired=no;visits-saved=3',
  });
});
