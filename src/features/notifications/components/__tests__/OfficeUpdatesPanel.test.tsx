import { fireEvent, render, screen } from '@testing-library/react-native';
import { type ComponentProps } from 'react';
import { StyleSheet } from 'react-native';

import { OFFICE_UPDATES_PANEL_CLOSE_LABEL } from '@/constants/copy';
import { OfficeUpdatesPanel } from '@/features/notifications/components/OfficeUpdatesPanel';
import { RECENT_NOTIFICATION_COUNT } from '@/features/notifications/components/NotificationInbox';
import type { MobileNotification } from '@/features/notifications/domain/notificationTypes';

const NOTIFICATION: MobileNotification = {
  id: '4e04321c-a879-423f-875d-4cdce5e028a6',
  ownerIdentity: 'session-1',
  eventType: 'office_review_completed',
  title: 'Office review completed',
  message: 'CG-2026-0001 was reviewed by the office.',
  caseUuid: '7e8c2e48-a2d4-4aca-9a50-9ca460fd7a7f',
  referenceCode: 'CG-2026-0001',
  assignmentUuid: null,
  content: null,
  advisory: null,
  isRead: false,
  readAt: null,
  createdAt: '2026-08-13T12:00:00.000Z',
  cachedAt: '2026-08-13T12:05:00.000Z',
};

async function renderPanel(overrides: Partial<ComponentProps<typeof OfficeUpdatesPanel>> = {}) {
  const props = {
    destinations: new Map(),
    errorMessage: null,
    notifications: [NOTIFICATION],
    onClose: jest.fn(),
    onMarkAllRead: jest.fn(),
    onNotificationPress: jest.fn(),
    partial: false,
    readActionError: null,
    unreadCount: 1,
    visible: true,
    ...overrides,
  };
  const view = await render(<OfficeUpdatesPanel {...props} />);

  return { props, ...view };
}

describe('OfficeUpdatesPanel', () => {
  it('renders nothing while it is hidden', async () => {
    await renderPanel({ visible: false });

    expect(screen.queryByTestId('office-updates.panel')).not.toBeOnTheScreen();
    expect(screen.queryByTestId('office-updates.scrim')).not.toBeOnTheScreen();
  });

  it('floats the unread updates over the screen and closes on a scrim tap', async () => {
    const { props } = await renderPanel();

    expect(screen.getByTestId('office-updates.panel')).toBeOnTheScreen();
    expect(screen.getByText('1 unread item from the office.')).toBeOnTheScreen();
    expect(screen.getByText(NOTIFICATION.title)).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('office-updates.scrim'));

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('centers the panel in the viewport while keeping the content column capped', async () => {
    await renderPanel();

    const rootStyle = StyleSheet.flatten(screen.getByTestId('office-updates.root').props.style);
    expect(rootStyle.justifyContent).toBe('center');
    expect(rootStyle.alignItems).toBe('center');

    const panelStyle = StyleSheet.flatten(screen.getByTestId('office-updates.panel').props.style);
    expect(panelStyle.width).toBe('100%');
    expect(panelStyle.maxWidth).toBeDefined();
  });

  it('closes from the header exit control using the canonical label', async () => {
    const { props } = await renderPanel();

    const close = screen.getByTestId('office-updates.close');
    expect(close).toHaveProp('accessibilityLabel', OFFICE_UPDATES_PANEL_CLOSE_LABEL);

    await fireEvent.press(close);

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('hands a tapped update and mark-all-read to the panel owner', async () => {
    const { props } = await renderPanel();

    await fireEvent.press(screen.getByTestId(`activity.notification.${NOTIFICATION.id}`));
    expect(props.onNotificationPress).toHaveBeenCalledWith(NOTIFICATION);

    await fireEvent.press(screen.getByLabelText('Mark all office updates as read'));
    expect(props.onMarkAllRead).toHaveBeenCalledTimes(1);
  });

  it('keeps load and read failures visible inside the panel', async () => {
    await renderPanel({
      errorMessage: 'Could not load every update.',
      partial: true,
      readActionError: 'Could not mark every update as read.',
    });

    expect(screen.getByText('Could not load every update.')).toBeOnTheScreen();
    expect(screen.getByText('Some office updates could not be loaded.')).toBeOnTheScreen();
    expect(screen.getByText('Could not mark every update as read.')).toBeOnTheScreen();
  });

  it('draws only the newest updates when the cached history is large', async () => {
    const notifications = Array.from({ length: 250 }, (_, index) => ({
      ...NOTIFICATION,
      createdAt: new Date(Date.UTC(2026, 7, 1, 0, index)).toISOString(),
      id: `notification-${index}`,
      title: `Office update ${index}`,
    }));

    await renderPanel({ notifications, unreadCount: 250 });

    const renderedRows = screen.queryAllByTestId(/^activity\.notification\./);
    expect(renderedRows).toHaveLength(RECENT_NOTIFICATION_COUNT);
    expect(screen.getByText('Office update 249')).toBeOnTheScreen();
    expect(screen.queryByText('Office update 0')).not.toBeOnTheScreen();
    expect(renderedRows.map((node) => node.props.testID)).toEqual(
      Array.from({ length: RECENT_NOTIFICATION_COUNT }, (_, offset) =>
        `activity.notification.notification-${249 - offset}`,
      ),
    );
  });
});
