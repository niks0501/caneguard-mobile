import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AppState, Button, Text } from 'react-native';

import { useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { hasStaleAuthorityReviewCache } from '@/features/reports/data/fieldReportReviewRepository';
import { ReportStatusesApiError } from '@/features/reports/api/mobileReportStatusesApi';
import { refreshAuthorityReviewStatus } from '@/features/reports/services/refreshAuthorityReviewStatus';
import { useAuthorityReviewStatus } from '@/features/reports/hooks/useAuthorityReviewStatus';

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void | (() => void)) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require('react');
    React.useEffect(callback, [callback]);
  },
}));
jest.mock('@/database/DatabaseProvider', () => ({
  useCaneGuardDatabase: jest.fn(),
}));
jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));
jest.mock('@/features/reports/data/fieldReportReviewRepository', () => ({
  hasStaleAuthorityReviewCache: jest.fn(),
}));
jest.mock('@/features/reports/services/refreshAuthorityReviewStatus', () => ({
  refreshAuthorityReviewStatus: jest.fn(),
}));

const database = {} as never;
const refreshService = jest.mocked(refreshAuthorityReviewStatus);
const hasStaleCache = jest.mocked(hasStaleAuthorityReviewCache);
const markSessionExpired = jest.fn(async () => undefined);
let appStateListener: ((state: string) => void) | undefined;

function Probe() {
  const state = useAuthorityReviewStatus();
  return (
    <>
      <Text testID="refresh-state">{state.refreshing ? 'refreshing' : 'idle'}</Text>
      <Text testID="error-state">{state.errorMessage ?? 'none'}</Text>
      <Button title="Manual refresh" onPress={() => void state.refresh()} />
    </>
  );
}

describe('useAuthorityReviewStatus lifecycle behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener) => {
      appStateListener = listener as (state: string) => void;
      return { remove: jest.fn() };
    });
    jest.mocked(useCaneGuardDatabase).mockReturnValue(database);
    jest.mocked(useAuth).mockReturnValue({
      authStatus: 'authenticated',
      status: 'authenticated',
      session: { token: 'token-1', user: { uuid: 'owner-1' } },
      markSessionExpired,
    } as never);
    hasStaleCache.mockResolvedValue(true);
    refreshService.mockResolvedValue({
      applied: 1,
      fetchedAt: '2026-08-13T12:01:00.000Z',
      syncBefore: '2026-08-13T12:01:00.000Z',
    });
  });

  it('refreshes on focus, explicit manual action, and stale app resume', async () => {
    await render(<Probe />);
    await waitFor(() => expect(refreshService).toHaveBeenCalledTimes(1));

    await act(async () => {
      fireEvent.press(screen.getByText('Manual refresh'));
      await Promise.resolve();
    });
    expect(refreshService).toHaveBeenCalledTimes(2);

    hasStaleCache.mockResolvedValue(true);
    await act(async () => {
      appStateListener?.('background');
      appStateListener?.('active');
      await Promise.resolve();
      await Promise.resolve();
    });
    await waitFor(() => expect(refreshService).toHaveBeenCalledTimes(3));
  });

  it('expires only the active session after a 401 and preserves recoverable errors', async () => {
    refreshService.mockRejectedValueOnce(
      new ReportStatusesApiError('AUTH_REQUIRED', 'expired', 401),
    );
    await render(<Probe />);
    await waitFor(() => expect(markSessionExpired).toHaveBeenCalledTimes(1));

    refreshService.mockResolvedValueOnce({
      applied: 1,
      fetchedAt: '2026-08-13T12:02:00.000Z',
      syncBefore: '2026-08-13T12:02:00.000Z',
    });
    await act(async () => {
      fireEvent.press(screen.getByText('Manual refresh'));
      await Promise.resolve();
    });
    refreshService.mockRejectedValueOnce(
      new ReportStatusesApiError('NETWORK', 'offline'),
    );
    await act(async () => {
      fireEvent.press(screen.getByText('Manual refresh'));
      await Promise.resolve();
    });
    expect(screen.getByTestId('error-state')).toHaveTextContent(
      'Couldn’t refresh—showing the last update.',
    );
  });
});
