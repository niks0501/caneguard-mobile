import { fireEvent, render, screen } from '@testing-library/react-native';
import { BottomNav } from '@/components/ui/BottomNav';
import { BrandedScreenHeader } from '@/components/ui/BrandedScreenHeader';
import { RecordCard } from '@/components/ui/RecordCard';
import type { ScanRecordListItem } from '@/features/records/domain/recordTypes';

describe('shared navigation UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a tonal Feather header without decorative artwork', async () => {
    await render(<BrandedScreenHeader title="Scan Sugarcane" />);

    expect(screen.getByRole('header')).toHaveTextContent('Scan Sugarcane');
    expect(screen.getByLabelText('Go back')).toBeOnTheScreen();
  });

  it('renders a close button and triggers onClosePress when showClose is true', async () => {
    const onClosePress = jest.fn();
    await render(
      <BrandedScreenHeader
        title="Active Flow"
        showClose
        onClosePress={onClosePress}
        closeTestID="test-header-close"
      />,
    );

    expect(screen.getByRole('header')).toHaveTextContent('Active Flow');
    const closeBtn = screen.getByTestId('test-header-close');
    expect(closeBtn).toBeOnTheScreen();
    expect(screen.getByLabelText('Cancel and return home')).toBeOnTheScreen();

    await fireEvent.press(closeBtn);
    expect(onClosePress).toHaveBeenCalledTimes(1);
  });

  it('keeps authority review separate from dominant delivery status', async () => {
    const record: ScanRecordListItem = {
      id: 'record-1',
      managedImageUri: 'file:///record.jpg',
      predictedLabel: 'rust',
      confidence: 0.8,
      barangay: null,
      syncStatus: 'synced',
      createdAt: '2026-08-13T12:00:00.000Z',
      authorityReview: {
        rawStatus: 'future_status',
        statusKind: 'unknown',
        statusLabel: 'Status update unavailable',
        referenceCode: null,
        feedback: null,
        reviewedAt: null,
        statusUpdatedAt: '2026-08-13T12:00:00.000Z',
        fetchedAt: '2026-08-13T12:01:00.000Z',
      },
    };

    const view = await render(<RecordCard record={record} onPress={jest.fn()} />);
    expect(screen.getByText('Sent to office')).toBeOnTheScreen();
    expect(screen.getByText('Status update unavailable')).toBeOnTheScreen();

    await view.rerender(
      <RecordCard
        record={{ ...record, syncStatus: 'failed' }}
        onPress={jest.fn()}
      />,
    );
    expect(screen.getByText('Could not send — try again')).toBeOnTheScreen();
    expect(screen.queryByText('Status update unavailable')).not.toBeOnTheScreen();
  });

  it('keeps the operational destinations accessible without analytics or settings tabs', async () => {
    const navigation = { navigate: jest.fn() };
    await render(<BottomNav activeTab="home" navigation={navigation} />);

    for (const label of ['Home', 'Scan', 'Activity']) {
      expect(screen.getByLabelText(label)).toBeOnTheScreen();
    }
    for (const label of ['Records', 'Settings', 'Reports']) {
      expect(screen.queryByLabelText(label)).not.toBeOnTheScreen();
    }

    await fireEvent.press(screen.getByLabelText('Activity'));
    expect(navigation.navigate).toHaveBeenCalledWith('activity');
  });
});
