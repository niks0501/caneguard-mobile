import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';

import ManualMapScreen from '@/app/manual-map';
import type { FieldReport } from '@/features/reports/domain/fieldReportTypes';

const SCAN_ID = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2';
const REPORT_ID = '7ea3e6f0-b893-4fd3-b414-0b797e62ec8e';

const mockSaveManualLocation = jest.fn(async () => draft());
const mockRefresh = jest.fn(async () => undefined);
let mockDraftState: {
  data: FieldReport | null;
  errorMessage: string | null;
  loading: boolean;
  refresh: typeof mockRefresh;
  saveManualLocation: typeof mockSaveManualLocation;
  savingManualLocation: boolean;
};

jest.mock('@/features/reports/hooks/useFieldReportDraft', () => ({
  useFieldReportDraft: () => mockDraftState,
}));
jest.mock('@/features/sync/hooks/useSync', () => ({
  useSync: () => ({ isOnline: true, isSyncing: false }),
}));
jest.mocked(useLocalSearchParams).mockReturnValue({
  reportId: REPORT_ID,
  scanRecordId: SCAN_ID,
});

function draft(overrides: Partial<FieldReport> = {}): FieldReport {
  return {
    authorityReview: null,
    id: REPORT_ID,
    scanRecordId: SCAN_ID,
    authoringState: 'draft',
    farmerOrFarmOwnerName: null,
    province: 'Batangas',
    municipality: 'Nasugbu',
    barangay: null,
    finalLatitude: null,
    finalLongitude: null,
    locationSource: null,
    lastSyncAttemptAt: null,
    lastSyncErrorCode: null,
    lastSyncedAt: null,
    manualLocationSelectedAt: null,
    gpsAccuracy: null,
    gpsAttemptAccuracy: null,
    gpsAttemptLatitude: null,
    gpsAttemptLongitude: null,
    gpsAttemptedAt: null,
    gpsCaptureOutcome: null,
    gpsOutcomeRecordedAt: null,
    observedAt: '2026-07-25T05:30:00.000Z',
    remoteId: null,
    submittedAt: null,
    submitterIdentity: 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17',
    submitterRole: 'field_reporter',
    syncAttemptCount: 0,
    syncStatus: 'local_only',
    createdAt: '2026-08-10T01:00:00.000Z',
    updatedAt: '2026-08-10T01:00:00.000Z',
    ...overrides,
  };
}

async function loadMapTiles() {
  await act(async () => {
    screen.getByTestId('manual-map.viewport').props.onLayout({
      nativeEvent: { layout: { height: 360, width: 390, x: 0, y: 0 } },
    });
  });
  for (const tile of screen.getAllByTestId('manual-map.tile')) {
    await act(async () => tile.props.onLoad());
  }
}

describe('ManualMapScreen', () => {
  beforeEach(() => {
    mockDraftState = {
      data: draft({
        finalLatitude: 14.0667,
        finalLongitude: 120.6319,
      }),
      errorMessage: null,
      loading: false,
      refresh: mockRefresh,
      saveManualLocation: mockSaveManualLocation,
      savingManualLocation: false,
    };
    jest.clearAllMocks();
  });

  it('expands the map to fullscreen and keeps confirm/cancel reachable', async () => {
    await render(<ManualMapScreen />);
    await act(async () => undefined);
    await loadMapTiles();

    expect(screen.getByText('Pin Report Location')).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Expand map to fullscreen'),
    ).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('manual-map.fullscreen-toggle'));

    // Fullscreen: header and instructions hidden, map fills the screen, and
    // the confirm/cancel flow stays available.
    expect(screen.queryByText('Pin Report Location')).not.toBeOnTheScreen();
    expect(
      screen.queryByText(/Move and zoom the online map/),
    ).not.toBeOnTheScreen();
    expect(screen.getByTestId('manual-map.viewport')).toHaveStyle({ flex: 1 });
    expect(screen.getByTestId('manual-map.confirm')).toBeOnTheScreen();
    expect(screen.getByText('Keep Draft Unchanged')).toBeOnTheScreen();

    // A clear exit back to the inline view.
    await fireEvent.press(screen.getByTestId('manual-map.fullscreen-toggle'));
    expect(screen.getByText('Pin Report Location')).toBeOnTheScreen();
    expect(screen.getByTestId('manual-map.viewport')).not.toHaveStyle({
      flex: 1,
    });
  });

  it('confirms the pinned location while in fullscreen', async () => {
    await render(<ManualMapScreen />);
    await act(async () => undefined);
    await loadMapTiles();

    await fireEvent(screen.getByTestId('manual-map.viewport'), 'press', {
      nativeEvent: { locationX: 195, locationY: 180 },
    });
    await fireEvent.press(screen.getByTestId('manual-map.fullscreen-toggle'));

    await fireEvent.press(screen.getByTestId('manual-map.confirm'));

    expect(mockSaveManualLocation).toHaveBeenCalledWith(
      expect.closeTo(14.0667, 6),
      expect.closeTo(120.6319, 6),
    );
    expect(router.back).toHaveBeenCalled();
  });
});
