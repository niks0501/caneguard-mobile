import { fireEvent, render, screen } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import { useState } from 'react';

import { HomeAttentionCard } from '@/features/activity/components/HomeAttentionCard';
import type { NeedsAttentionItem } from '@/features/activity/domain/needsAttention';
import { NotificationInbox } from '@/features/notifications/components/NotificationInbox';
import type { MobileNotification } from '@/features/notifications/domain/notificationTypes';
import type { NotificationDestination } from '@/features/notifications/services/resolveNotificationDestination';

/**
 * Row memoization is measured through the row's own icon. Every listed row
 * renders exactly one `Feather`; the surrounding cards render none of their own
 * (the Home card has no see-all line at these totals, and the office-updates
 * header has exactly one in its mark-all button). A parent re-render that
 * changes nothing must therefore add no row icons at all.
 */
let featherRenders = 0;
jest.mock('@expo/vector-icons', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  function Feather(props: { name: string }) {
    featherRenders += 1;
    return React.createElement('FeatherIcon', props);
  }
  Feather.glyphMap = {};
  return { Feather };
});

const RERENDERS = 20;

const ITEMS: NeedsAttentionItem[] = [
  {
    destination: { kind: 'assignment', assignmentId: 'assignment-1' },
    id: 'assignment-1',
    kind: 'assignment',
    message: 'Brgy. Wawa · submitted by Ana Reporter',
    meta: 'Visit due today',
    title: 'Field visit for CG-2026-0001',
  },
  {
    destination: { kind: 'unavailable' },
    id: 'notification-1',
    kind: 'notification',
    message: 'CG-2026-0002 was reviewed.',
    meta: 'This case is not stored on this device',
    title: 'Office review completed',
  },
];

const NOTIFICATIONS: MobileNotification[] = [
  {
    advisory: null,
    assignmentUuid: null,
    cachedAt: '2026-08-13T12:00:00.000Z',
    caseUuid: 'case-1',
    content: null,
    createdAt: '2026-08-13T12:00:00.000Z',
    eventType: 'office_review_completed',
    id: 'notification-1',
    isRead: false,
    message: 'CG-2026-0002 was reviewed by the office.',
    ownerIdentity: 'owner-1',
    readAt: null,
    referenceCode: 'CG-2026-0002',
    title: 'Office review completed',
  },
  {
    advisory: null,
    assignmentUuid: null,
    cachedAt: '2026-08-13T11:00:00.000Z',
    caseUuid: 'case-2',
    content: null,
    createdAt: '2026-08-13T11:00:00.000Z',
    eventType: 'office_review_completed',
    id: 'notification-2',
    isRead: true,
    message: 'CG-2026-0003 was reviewed by the office.',
    ownerIdentity: 'owner-1',
    readAt: '2026-08-13T11:30:00.000Z',
    referenceCode: 'CG-2026-0003',
    title: 'Office review completed',
  },
];

const DESTINATIONS = new Map<string, NotificationDestination>([
  ['notification-1', { kind: 'field_report', scanRecordId: 'scan-1' }],
  ['notification-2', { kind: 'field_report', scanRecordId: 'scan-2' }],
]);

const noop = () => undefined;

/**
 * A render prop, not a static element: the host has to build a fresh element on
 * each of its renders so the listed component really re-renders with unchanged
 * props. Passing a fixed element would let React skip the whole subtree and
 * make this test vacuous.
 */
function RerenderHost({ children }: { children: () => React.ReactNode }) {
  const [tick, setTick] = useState(0);
  return (
    <>
      <Pressable testID="host.tick" onPress={() => setTick((value) => value + 1)} />
      <Text testID="host.tick.value">{String(tick)}</Text>
      {children()}
    </>
  );
}

async function pressHostTimes(times: number): Promise<void> {
  for (let index = 0; index < times; index += 1) {
    await fireEvent.press(screen.getByTestId('host.tick'));
  }
}

describe('listed row memoization', () => {
  beforeEach(() => {
    featherRenders = 0;
  });

  it('does not re-render the Home attention rows for an unrelated parent render', async () => {
    await render(
      <RerenderHost>
        {() => (
          <HomeAttentionCard
            items={ITEMS}
            onOpenItem={noop}
            onSeeAll={noop}
            total={ITEMS.length}
          />
        )}
      </RerenderHost>,
    );

    // Sanity: the rows render (a kind icon each, plus a chevron on the
    // actionable one), so the counter can see row renders at all.
    expect(featherRenders).toBeGreaterThanOrEqual(ITEMS.length);

    featherRenders = 0;
    await pressHostTimes(RERENDERS);

    expect(featherRenders).toBe(0);
  });

  it('does not re-render the office-update rows for an unrelated parent render', async () => {
    await render(
      <RerenderHost>
        {() => (
          <NotificationInbox
            destinations={DESTINATIONS}
            errorMessage={null}
            notifications={NOTIFICATIONS}
            onMarkAllRead={noop}
            onNotificationPress={noop}
            partial={false}
            readActionError={null}
            unreadCount={1}
          />
        )}
      </RerenderHost>,
    );

    // Sanity: one mark-all icon plus one chevron per actionable row.
    expect(featherRenders).toBe(3);

    featherRenders = 0;
    await pressHostTimes(RERENDERS);

    // The header's mark-all icon is the only Feather a parent render may reach.
    expect(featherRenders).toBe(RERENDERS);
  });
});
