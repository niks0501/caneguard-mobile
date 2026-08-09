import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { OnlineMapPicker } from '@/features/reports/components/online-map-picker';
import { DEFAULT_MANUAL_MAP_CENTER } from '@/features/reports/domain/manualMap';

describe('OnlineMapPicker', () => {
  it('keeps selection unavailable when the device is offline', async () => {
    const onSelectionChange = jest.fn();
    await render(
      <OnlineMapPicker
        initialCenter={DEFAULT_MANUAL_MAP_CENTER}
        isOnline={false}
        onSelectionChange={onSelectionChange}
      />,
    );
    await act(async () => undefined);

    expect(screen.getByText(/Connect to the internet/)).toBeOnTheScreen();
    expect(screen.queryAllByTestId('manual-map.tile')).toHaveLength(0);
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('selects coordinates only after an online tile loads', async () => {
    const onSelectionChange = jest.fn();
    await render(
      <OnlineMapPicker
        initialCenter={DEFAULT_MANUAL_MAP_CENTER}
        isOnline={true}
        onSelectionChange={onSelectionChange}
      />,
    );
    await act(async () => undefined);

    const viewport = screen.getByTestId('manual-map.viewport');
    await act(async () => {
      viewport.props.onLayout({
        nativeEvent: { layout: { height: 360, width: 390, x: 0, y: 0 } },
      });
    });
    for (const tile of screen.getAllByTestId('manual-map.tile')) {
      await act(async () => {
        tile.props.onLoad();
      });
    }
    const loadedViewport = screen.getByTestId('manual-map.viewport');
    expect(loadedViewport).not.toBeDisabled();
    await fireEvent(loadedViewport, 'press', {
      nativeEvent: { locationX: 195, locationY: 180 },
    });

    expect(onSelectionChange).toHaveBeenCalledWith(
      expect.objectContaining({
        latitude: expect.closeTo(DEFAULT_MANUAL_MAP_CENTER.latitude, 6),
        longitude: expect.closeTo(DEFAULT_MANUAL_MAP_CENTER.longitude, 6),
      }),
    );
    expect(screen.getByTestId('manual-map.pin')).toBeOnTheScreen();
    expect(screen.getByTestId('manual-map.coordinates')).toHaveTextContent(
      '14.066700, 120.631900',
    );
  });

  it('keeps the picker disabled when any required map tile fails', async () => {
    const onSelectionChange = jest.fn();
    await render(
      <OnlineMapPicker
        initialCenter={DEFAULT_MANUAL_MAP_CENTER}
        isOnline={true}
        onSelectionChange={onSelectionChange}
      />,
    );
    await act(async () => undefined);

    await act(async () => {
      screen.getAllByTestId('manual-map.tile')[0].props.onError();
    });
    expect(screen.getByText(/online map could not load/)).toBeOnTheScreen();
    expect(screen.getByTestId('manual-map.viewport')).toBeDisabled();
    expect(onSelectionChange).not.toHaveBeenCalled();
  });
});
