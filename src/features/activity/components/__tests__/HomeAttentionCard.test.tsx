import { fireEvent, render, screen } from '@testing-library/react-native';

import { HomeAttentionCard } from '@/features/activity/components/HomeAttentionCard';
import {
  buildNeedsAttention,
  type NeedsAttentionItem,
} from '@/features/activity/domain/needsAttention';
import type { MobileNotification } from '@/features/notifications/domain/notificationTypes';

const noop = () => undefined;

const UNREAD_UPDATE: MobileNotification = {
  id: 'notification-1',
  ownerIdentity: 'owner-1',
  eventType: 'office_review_completed',
  title: 'Office review completed',
  message: 'CG-2026-0002 was reviewed by the office.',
  caseUuid: 'case-2',
  referenceCode: 'CG-2026-0002',
  assignmentUuid: null,
  content: null,
  advisory: null,
  isRead: false,
  readAt: null,
  createdAt: '2026-09-10T00:00:00.000Z',
  cachedAt: '2026-09-10T00:00:00.000Z',
};

function visit(id: string, referenceCode: string): NeedsAttentionItem {
  return {
    bucket: 'today',
    destination: { kind: 'assignment', assignmentId: `assign-${id}` },
    id,
    kind: 'assignment',
    message: 'Mabini · submitted by Ana Reporter',
    meta: 'Visit due today',
    place: 'Mabini',
    referenceCode,
    title: `Field visit for ${referenceCode}`,
  };
}

function renderCard(items: NeedsAttentionItem[], onOpenItem = noop) {
  return render(
    <HomeAttentionCard
      items={items}
      onOpenItem={onOpenItem}
      onSeeAll={noop}
      total={items.length}
    />,
  );
}

describe('HomeAttentionCard', () => {
  it('keeps two visits in the same barangay distinguishable by their case reference', async () => {
    await renderCard([visit('assignment-1', 'CG-2026-0001'), visit('assignment-2', 'CG-2026-0002')]);

    expect(screen.getAllByText('Mabini')).toHaveLength(2);
    expect(screen.getAllByText('Visit due today')).toHaveLength(2);
    expect(screen.getByText('CG-2026-0001')).toBeOnTheScreen();
    expect(screen.getByText('CG-2026-0002')).toBeOnTheScreen();
  });

  it('shows why an office update cannot be opened on this device', async () => {
    const onOpenItem = jest.fn();
    await renderCard(
      buildNeedsAttention({
        assignments: [],
        destinations: new Map(),
        notifications: [UNREAD_UPDATE],
        pendingUploadCount: 0,
        syncErrorMessage: null,
        today: '2026-09-15',
      }).items,
      onOpenItem,
    );

    expect(screen.getByText('Office review completed')).toBeOnTheScreen();
    expect(screen.getByText('CG-2026-0002 was reviewed by the office.')).toBeOnTheScreen();
    expect(screen.getByText('Not on this phone: open on the web')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('home.attention.notification-1'));
    expect(onOpenItem).not.toHaveBeenCalled();
  });

  it('opens an office update that can be read here and shows its case reference', async () => {
    const item: NeedsAttentionItem = {
      destination: { kind: 'field_report', scanRecordId: 'scan-1' },
      id: 'notification-2',
      kind: 'notification',
      message: 'CG-2026-0003 was reviewed by the office.',
      meta: 'CG-2026-0003',
      title: 'Office review completed',
    };
    const onOpenItem = jest.fn();
    await renderCard([item], onOpenItem);

    expect(screen.getByText('CG-2026-0003')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('home.attention.notification-2'));
    expect(onOpenItem).toHaveBeenCalledWith(item);
  });
});
