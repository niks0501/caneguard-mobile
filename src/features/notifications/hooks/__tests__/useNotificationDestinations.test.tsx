import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { useNotificationDestinations } from '@/features/notifications/hooks/useNotificationDestinations';
import type { MobileNotification } from '@/features/notifications/domain/notificationTypes';
import type { NotificationDestination } from '@/features/notifications/services/resolveNotificationDestination';
import { emitSyncRecordsChanged } from '@/features/sync/services/syncEvents';

type PendingResolution = {
  notification: MobileNotification;
  resolve: (destination: NotificationDestination) => void;
};

const pending: PendingResolution[] = [];
const mockResolve = jest.fn(
  async (
    _database: unknown,
    _ownerIdentity: string,
    notification: MobileNotification,
  ) =>
    new Promise<NotificationDestination>((resolve) => {
      pending.push({ notification, resolve });
    }),
);

jest.mock('@/features/notifications/services/resolveNotificationDestination', () => {
  const actual = jest.requireActual(
    '@/features/notifications/services/resolveNotificationDestination',
  );
  return {
    ...actual,
    resolveNotificationDestination: (...args: unknown[]) => mockResolve(...(args as [never, never, never])),
  };
});

const mockDatabase = { fake: 'db' };
jest.mock('@/database/DatabaseProvider', () => ({
  EMPTY_DATABASE: {},
  useCaneGuardDatabase: () => mockDatabase,
}));
jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ user: { uuid: 'owner-1' } }),
}));

function notification(id: string): MobileNotification {
  return {
    advisory: null,
    assignmentUuid: null,
    cachedAt: '2026-08-13T12:00:00.000Z',
    caseUuid: `case-${id}`,
    content: null,
    createdAt: '2026-08-13T12:00:00.000Z',
    eventType: 'office_review_completed',
    id,
    isRead: false,
    message: `${id} was reviewed.`,
    ownerIdentity: 'owner-1',
    readAt: null,
    referenceCode: `CG-2026-${id}`,
    title: 'Office review completed',
  };
}

const NOTIFICATIONS = [notification('1'), notification('2')];

function Probe({ enabled }: { enabled: boolean }) {
  const destinations = useNotificationDestinations(NOTIFICATIONS, enabled);
  return <Text testID="probe.size">{String(destinations.size)}</Text>;
}

async function flush(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('useNotificationDestinations', () => {
  beforeEach(() => {
    pending.length = 0;
    mockResolve.mockClear();
  });

  it('resolves nothing until the surface showing the list is enabled', async () => {
    await render(<Probe enabled={false} />);
    await flush();

    await act(async () => {
      emitSyncRecordsChanged();
    });
    await flush();

    expect(mockResolve).not.toHaveBeenCalled();
  });

  it('coalesces a burst of record writes into one follow-up pass', async () => {
    await render(<Probe enabled />);
    await flush();

    // One pass is in flight: one call per notification, and no more.
    expect(mockResolve).toHaveBeenCalledTimes(NOTIFICATIONS.length);
    expect(pending).toHaveLength(NOTIFICATIONS.length);

    // A sync writes many rows and bumps the shared revision for each one.
    // Every bump used to start another full pass beside the in-flight one.
    const BURST = 9;
    for (let index = 0; index < BURST; index += 1) {
      await act(async () => {
        emitSyncRecordsChanged();
      });
      await flush();
    }
    expect(mockResolve).toHaveBeenCalledTimes(NOTIFICATIONS.length);

    // Finish the in-flight pass, then the single queued follow-up.
    await act(async () => {
      for (const entry of [...pending]) {
        entry.resolve({ kind: 'unavailable' });
      }
      await Promise.resolve();
      await Promise.resolve();
    });
    await flush();

    // Exactly two passes for the whole burst, not one per write.
    expect(mockResolve).toHaveBeenCalledTimes(NOTIFICATIONS.length * 2);
    expect(pending).toHaveLength(NOTIFICATIONS.length * 2);

    await act(async () => {
      for (const entry of [...pending]) {
        entry.resolve({ kind: 'unavailable' });
      }
      await Promise.resolve();
      await Promise.resolve();
    });
    await flush();

    expect(mockResolve).toHaveBeenCalledTimes(NOTIFICATIONS.length * 2);
    expect(screen.getByTestId('probe.size')).toHaveTextContent('2');
  });
});
