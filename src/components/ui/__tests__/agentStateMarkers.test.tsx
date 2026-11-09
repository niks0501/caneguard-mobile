import { render, screen } from '@testing-library/react-native';

import { Notice } from '@/components/ui/Notice';
import { SyncStatusRow } from '@/components/ui/SyncStatusRow';
import { Text } from 'react-native';

let mockSync = {
  apiReachability: 'available',
  errorMessage: null as string | null,
  isOnline: true as boolean | null,
  isSyncing: false,
  pendingCount: 0,
  pendingReportsCount: 0,
  pendingSurveysCount: 0,
  pendingCompletionsCount: 0,
};

jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ sessionVerification: 'idle' }),
}));
jest.mock('@/features/sync/hooks/useSync', () => ({
  useSync: () => mockSync,
}));

// Proposal tests for X-AG: each states the intent requirement it proves.
describe('agent state markers', () => {
  it('sync row exposes a stable state token and counts, not copy (X-AG: read state without parsing copy)', async () => {
    mockSync = { ...mockSync, isOnline: false, pendingCount: 2, errorMessage: 'boom' };
    await render(<SyncStatusRow onPress={jest.fn()} testID="sync-row" />);
    expect(screen.getByTestId('sync-row').props.accessibilityValue).toEqual({
      text: 'state=offline;pending=2;error=yes',
    });
  });

  it('Notice carries a marker only when asked (X-AG: markers add no behavior change)', async () => {
    await render(
      <>
        <Notice testID="with" stateValue="authoring=draft;sync=pending"><Text>a</Text></Notice>
        <Notice testID="without"><Text>b</Text></Notice>
      </>,
    );
    expect(screen.getByTestId('with').props.accessibilityValue).toEqual({
      text: 'authoring=draft;sync=pending',
    });
    expect(screen.getByTestId('without').props.accessibilityValue).toBeUndefined();
  });
});
