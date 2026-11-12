import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { HomeReadinessLine } from '@/features/home/components/HomeReadinessLine';

let mockReadiness: Record<string, unknown> = {};
jest.mock('@/features/auth/hooks/useOfflineReadiness', () => ({
  useOfflineReadiness: () => ({
    assignmentCount: 2,
    checkingAssignments: false,
    protectedSessionEnabled: false,
    ready: false,
    ...mockReadiness,
  }),
}));

afterEach(() => {
  jest.clearAllMocks();
  mockReadiness = {};
});

describe('HomeReadinessLine', () => {
  it('shows a quiet line that opens Account security while biometric unlock is off', async () => {
    await render(<HomeReadinessLine />);
    await fireEvent.press(screen.getByTestId('home.readiness-line'));
    expect(router.push).toHaveBeenCalledWith('/account-security');
  });

  it('points to Settings when biometric is on but the device is still not ready', async () => {
    mockReadiness = { protectedSessionEnabled: true, assignmentCount: 0 };
    await render(<HomeReadinessLine />);
    await fireEvent.press(screen.getByTestId('home.readiness-line'));
    expect(router.push).toHaveBeenCalledWith('/settings');
  });

  it.each([
    ['ready', { ready: true }],
    ['still checking', { checkingAssignments: true }],
    ['unanswered', { assignmentCount: null }],
  ])('renders nothing when %s', async (_name, overrides) => {
    mockReadiness = overrides;
    await render(<HomeReadinessLine />);
    expect(screen.queryByTestId('home.readiness-line')).toBeNull();
  });
});
