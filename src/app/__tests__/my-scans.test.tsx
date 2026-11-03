import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import ActivityScreen from '@/app/(tabs)/activity';
import { FARMER_COPY } from '@/constants/copy';
import { AuthContext } from '@/features/auth/providers/AuthProvider';
import type { ScanRecordListItem } from '@/features/records/domain/recordTypes';
import type { FarmerScanState } from '@/features/records/domain/scanState';

// Proposal tests. Intent: farmer ActivityScreen becomes My Scans with state
// chips and no Reports/Assignments filters; RecordCard shows the state instead
// of "On this device / not sent"; inspector rendering is unchanged.

const mockStates = new Map<string, FarmerScanState>();
const mockRecords: { data: ScanRecordListItem[] } = { data: [] };

jest.mock('@/features/records/hooks/useRecords', () => ({
  usePaginatedScanRecords: () => ({
    data: mockRecords.data,
    errorMessage: null,
    hasMore: false,
    loading: false,
    loadingMore: false,
    loadMore: jest.fn(),
    refresh: jest.fn(),
  }),
}));
jest.mock('@/features/records/hooks/useScanStates', () => ({
  useFarmerScanStates: () => mockStates,
}));
jest.mock('@/providers/LanguagePreferenceProvider', () => ({
  useFarmerCopy: () => jest.requireActual('@/constants/copy').FARMER_COPY.en,
}));

const base: ScanRecordListItem = {
  authorityReview: null,
  barangay: 'Wawa',
  confidence: 0.9,
  createdAt: '2026-11-01T05:30:00.000Z',
  hasFieldReport: false,
  id: 'scan-a',
  managedImageUri: 'file:///documents/caneguard/scan-images/a.jpg',
  predictedLabel: 'rust',
  syncStatus: 'local_only',
};

function renderAsFarmer() {
  return render(
    <AuthContext.Provider value={{ user: { role: 'farmer', uuid: 'u1' } } as never}>
      <ActivityScreen />
    </AuthContext.Provider>,
  );
}

describe('My Scans (farmer Activity)', () => {
  beforeEach(() => {
    mockStates.clear();
    mockStates.set('scan-a', 'needs_checking');
    mockStates.set('scan-b', 'followed_up');
    mockStates.set('scan-c', 'saved');
    mockRecords.data = [
      base,
      { ...base, id: 'scan-b', createdAt: '2026-10-31T05:30:00.000Z' },
      { ...base, id: 'scan-c', createdAt: '2026-10-30T05:30:00.000Z', predictedLabel: 'healthy' },
    ];
  });

  // Proves: "My Scans screen ... no Reports or Assignments filters and state chips instead".
  it('shows My Scans with state chips and no Reports or Assignments filters', async () => {
    await renderAsFarmer();
    expect(screen.getByText('My Scans')).toBeOnTheScreen();
    for (const label of ['All', 'Needs checking', 'Followed up', 'Saved']) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
    expect(screen.queryByText('Reports')).toBeNull();
    expect(screen.queryByText('Assignments')).toBeNull();
  });

  // Proves: "RecordCard.tsx shows the state in place of 'On this device / not sent' for farmers".
  it('shows each scan state on its card instead of the device and sync status', async () => {
    await renderAsFarmer();
    expect(screen.getByTestId('record-card.state.scan-a')).toHaveTextContent('Needs checking');
    expect(screen.getByTestId('record-card.state.scan-b')).toHaveTextContent('Followed up');
    expect(screen.getByTestId('record-card.state.scan-c')).toHaveTextContent('Saved');
    expect(screen.queryByText(/not sent|On this device|Waiting to send/i)).toBeNull();
  });

  // Proves: state chips filter the list by computed state.
  it('filters the list by state chip', async () => {
    await renderAsFarmer();
    await fireEvent.press(screen.getByTestId('my-scans.filter.followed_up'));
    expect(screen.getByTestId('my-scans.item.scan-b')).toBeOnTheScreen();
    expect(screen.queryByTestId('my-scans.item.scan-a')).toBeNull();
  });

  it('opens the record on press', async () => {
    await renderAsFarmer();
    await fireEvent.press(screen.getByTestId('my-scans.item.scan-a'));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/record-details',
      params: { id: 'scan-a' },
    });
  });
});

describe('FARMER_COPY.myScans', () => {
  // Proves: "State names join FARMER_COPY (en+tl)".
  it('defines the three state names in both languages', () => {
    for (const lang of ['en', 'tl'] as const) {
      const c = FARMER_COPY[lang].myScans;
      expect([c.stateNeedsChecking, c.stateFollowedUp, c.stateSaved].every(Boolean)).toBe(true);
    }
  });
});
