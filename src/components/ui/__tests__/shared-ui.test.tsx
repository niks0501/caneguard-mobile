import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

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
    expect(screen.getByText('Synced')).toBeOnTheScreen();
    expect(screen.getByText('Status update unavailable')).toBeOnTheScreen();

    await view.rerender(
      <RecordCard
        record={{ ...record, syncStatus: 'failed' }}
        onPress={jest.fn()}
      />,
    );
    expect(screen.getByText('Sync failed')).toBeOnTheScreen();
    expect(screen.queryByText('Status update unavailable')).not.toBeOnTheScreen();
  });

  it('keeps all bottom navigation destinations accessible', async () => {
    await render(<BottomNav activeTab="home" />);

    for (const label of ['Home', 'Scan', 'Records', 'Settings', 'Reports']) {
      expect(screen.getByLabelText(label)).toBeOnTheScreen();
    }

    await fireEvent.press(screen.getByLabelText('Records'));
    expect(router.push).toHaveBeenCalledWith('/records');
  });
});
