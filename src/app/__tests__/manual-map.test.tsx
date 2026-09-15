import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';

import ManualMapScreen from '@/app/manual-map';
import {
  coordinateAtViewportPoint,
  DEFAULT_MANUAL_MAP_CENTER,
  DEFAULT_MANUAL_MAP_ZOOM,
} from '@/features/reports/domain/manualMap';
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
    affectedAreaHectares: null,
    affectedAreaMeasurement: 'not_measured',
    affectedPortionPercent: null,
    affectedPortionMeasurement: 'not_measured',
    barangay: null,
    caneClass: null,
    cropAge: null,
    fieldNotes: null,
    mismatchReported: null,
    reporterObservationText: null,
    reporterSuspectedCondition: null,
    province: 'Batangas',
    municipality: 'Nasugbu',
    sugarcaneVariety: null,
    finalLatitude: null,
    finalLongitude: null,
    locationSource: null,
    locationUnavailableReason: null,
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

async function loadMapTiles(width = 390, height = 360) {
  await act(async () => {
    screen.getByTestId('manual-map.viewport').props.onLayout({
      nativeEvent: { layout: { height, width, x: 0, y: 0 } },
    });
  });
  for (const tile of screen.getAllByTestId('manual-map.tile')) {
    await act(async () => tile.props.onLoad());
  }
}

async function goFullscreen() {
  await fireEvent.press(screen.getByTestId('manual-map.fullscreen-toggle'));
}

describe('ManualMapScreen', () => {
  const previousApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://proxy.example.test';
    process.env.EXPO_PUBLIC_MAP_TILE_PROXY_URL =
      'https://proxy.example.test/api/v1/mobile/map-tiles/{z}/{x}/{y}.png';
    mockDraftState = {
      data: draft({
        finalLatitude: DEFAULT_MANUAL_MAP_CENTER.latitude,
        finalLongitude: DEFAULT_MANUAL_MAP_CENTER.longitude,
      }),
      errorMessage: null,
      loading: false,
      refresh: mockRefresh,
      saveManualLocation: mockSaveManualLocation,
      savingManualLocation: false,
    };
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (previousApiBaseUrl === undefined) {
      delete process.env.EXPO_PUBLIC_API_BASE_URL;
    } else {
      process.env.EXPO_PUBLIC_API_BASE_URL = previousApiBaseUrl;
    }
    delete process.env.EXPO_PUBLIC_MAP_TILE_PROXY_URL;
  });

  it('expands the map to fullscreen and keeps confirm/cancel reachable', async () => {
    await render(<ManualMapScreen />);
    await act(async () => undefined);
    await loadMapTiles();

    expect(screen.getByText('Pin Report Location')).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Expand map to fullscreen'),
    ).toBeOnTheScreen();

    await goFullscreen();

    // Fullscreen: header and instructions hidden, the map covers the whole
    // device screen (absolutely positioned over the content), and the
    // confirm/cancel flow stays reachable as floating actions.
    expect(screen.queryByText('Pin Report Location')).not.toBeOnTheScreen();
    expect(
      screen.queryByText(/Move and zoom the online map/),
    ).not.toBeOnTheScreen();
    expect(screen.getByTestId('manual-map.viewport')).toHaveStyle({
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    });
    expect(screen.queryByTestId('manual-map.controls')).not.toBeOnTheScreen();
    expect(screen.getByTestId('manual-map.confirm')).toBeOnTheScreen();
    expect(screen.getByText('Keep Draft Unchanged')).toBeOnTheScreen();

    // A clear exit back to the inline view.
    await fireEvent.press(screen.getByTestId('manual-map.fullscreen-toggle'));
    expect(screen.getByText('Pin Report Location')).toBeOnTheScreen();
    expect(screen.getByTestId('manual-map.viewport')).not.toHaveStyle({
      position: 'absolute',
    });
    expect(screen.getByTestId('manual-map.controls')).toBeOnTheScreen();
  });

  it('confirms the pinned location while in fullscreen', async () => {
    await render(<ManualMapScreen />);
    await act(async () => undefined);
    await loadMapTiles();

    await fireEvent(screen.getByTestId('manual-map.viewport'), 'press', {
      nativeEvent: { locationX: 195, locationY: 180 },
    });
    await goFullscreen();

    await fireEvent.press(screen.getByTestId('manual-map.confirm'));

    expect(mockSaveManualLocation).toHaveBeenCalledWith(
      expect.closeTo(DEFAULT_MANUAL_MAP_CENTER.latitude, 6),
      expect.closeTo(DEFAULT_MANUAL_MAP_CENTER.longitude, 6),
    );
    expect(router.back).toHaveBeenCalled();
  });

  it('places the pin exactly under the finger after resizing to fullscreen', async () => {
    await render(<ManualMapScreen />);
    await act(async () => undefined);
    await loadMapTiles();

    await goFullscreen();
    // Fullscreen layout: the map covers the whole device screen.
    const fullscreenWidth = 390;
    const fullscreenHeight = 844;
    await loadMapTiles(fullscreenWidth, fullscreenHeight);

    const tapX = 300;
    const tapY = 100;
    await fireEvent(screen.getByTestId('manual-map.viewport'), 'press', {
      nativeEvent: { locationX: tapX, locationY: tapY },
    });
    expect(screen.getByTestId('manual-map.pin')).toBeOnTheScreen();

    const expected = coordinateAtViewportPoint(
      DEFAULT_MANUAL_MAP_CENTER,
      DEFAULT_MANUAL_MAP_ZOOM,
      fullscreenWidth,
      fullscreenHeight,
      tapX,
      tapY,
    );
    await fireEvent.press(screen.getByTestId('manual-map.confirm'));
    expect(mockSaveManualLocation).toHaveBeenCalledWith(
      expect.closeTo(expected.latitude, 8),
      expect.closeTo(expected.longitude, 8),
    );
    expect(router.back).toHaveBeenCalled();
  });

  it('keeps the pinned location and coordinates across the fullscreen toggle', async () => {
    await render(<ManualMapScreen />);
    await act(async () => undefined);
    await loadMapTiles();

    await fireEvent(screen.getByTestId('manual-map.viewport'), 'press', {
      nativeEvent: { locationX: 300, locationY: 100 },
    });
    const selected = coordinateAtViewportPoint(
      DEFAULT_MANUAL_MAP_CENTER,
      DEFAULT_MANUAL_MAP_ZOOM,
      390,
      360,
      300,
      100,
    );
    const coordinatesText = `${selected.latitude.toFixed(6)}, ${selected.longitude.toFixed(6)}`;

    await goFullscreen();
    expect(screen.getByTestId('manual-map.coordinates')).toHaveTextContent(
      coordinatesText,
    );
    expect(screen.getByTestId('manual-map.pin')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('manual-map.fullscreen-toggle'));
    expect(screen.getByTestId('manual-map.coordinates')).toHaveTextContent(
      coordinatesText,
    );
    expect(screen.getByTestId('manual-map.pin')).toBeOnTheScreen();
  });
});
