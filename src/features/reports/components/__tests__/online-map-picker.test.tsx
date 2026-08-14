import { act, fireEvent, render, screen, within } from '@testing-library/react-native';

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

  it('retains loaded overlap after panning into a new tile set', async () => {
    await render(
      <OnlineMapPicker
        initialCenter={DEFAULT_MANUAL_MAP_CENTER}
        isOnline={true}
        onSelectionChange={jest.fn()}
      />,
    );
    await act(async () => undefined);
    await act(async () => {
      screen.getByTestId('manual-map.viewport').props.onLayout({
        nativeEvent: { layout: { height: 360, width: 390, x: 0, y: 0 } },
      });
    });

    for (const tile of screen.getAllByTestId('manual-map.tile')) {
      await act(async () => tile.props.onLoad());
    }
    const initialTileUrls = new Set(
      screen
        .getAllByTestId('manual-map.tile')
        .map((tile) => tile.props.source.uri),
    );

    await act(async () => {
      await fireEvent.press(screen.getByLabelText('Pan east'));
    });
    const newTiles = screen
      .getAllByTestId('manual-map.tile')
      .filter((tile) => !initialTileUrls.has(tile.props.source.uri));
    expect(newTiles.length).toBeGreaterThan(0);

    for (const tile of newTiles) {
      await act(async () => tile.props.onLoad());
    }

    expect(screen.getByTestId('manual-map.viewport')).not.toBeDisabled();
  });

  it('hides the navigation controls and shows only the exit control in fullscreen', async () => {
    await render(
      <OnlineMapPicker
        initialCenter={DEFAULT_MANUAL_MAP_CENTER}
        isOnline={true}
        onSelectionChange={jest.fn()}
      />,
    );
    await act(async () => undefined);
    await act(async () => {
      screen.getByTestId('manual-map.viewport').props.onLayout({
        nativeEvent: { layout: { height: 360, width: 390, x: 0, y: 0 } },
      });
    });
    for (const tile of screen.getAllByTestId('manual-map.tile')) {
      await act(async () => tile.props.onLoad());
    }

    await fireEvent.press(screen.getByLabelText('Enter fullscreen map'));

    expect(screen.getByTestId('manual-map.fullscreen')).toBeOnTheScreen();
    expect(screen.getByTestId('manual-map.exit-fullscreen')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Enter fullscreen map')).not.toBeOnTheScreen();
    expect(screen.queryByLabelText('Pan east')).not.toBeOnTheScreen();
    expect(screen.queryByLabelText('Zoom in')).not.toBeOnTheScreen();
    expect(screen.queryByTestId('manual-map.coordinates')).not.toBeOnTheScreen();
  });

  it('restores the navigation controls and keeps the pin when exiting fullscreen', async () => {
    await render(
      <OnlineMapPicker
        initialCenter={DEFAULT_MANUAL_MAP_CENTER}
        isOnline={true}
        onSelectionChange={jest.fn()}
      />,
    );
    await act(async () => undefined);
    await act(async () => {
      screen.getByTestId('manual-map.viewport').props.onLayout({
        nativeEvent: { layout: { height: 360, width: 390, x: 0, y: 0 } },
      });
    });
    for (const tile of screen.getAllByTestId('manual-map.tile')) {
      await act(async () => tile.props.onLoad());
    }
    const loadedViewport = screen.getByTestId('manual-map.viewport');
    await fireEvent(loadedViewport, 'press', {
      nativeEvent: { locationX: 195, locationY: 180 },
    });

    await fireEvent.press(screen.getByLabelText('Enter fullscreen map'));
    expect(
      within(screen.getByTestId('manual-map.fullscreen')).getByTestId('manual-map.pin'),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('manual-map.exit-fullscreen'));

    expect(screen.queryByTestId('manual-map.fullscreen')).not.toBeOnTheScreen();
    expect(screen.queryByTestId('manual-map.exit-fullscreen')).not.toBeOnTheScreen();
    expect(screen.getByLabelText('Pan east')).toBeOnTheScreen();
    expect(screen.getByLabelText('Zoom in')).toBeOnTheScreen();
    expect(screen.getByTestId('manual-map.coordinates')).toHaveTextContent(
      '14.066700, 120.631900',
    );
    expect(screen.getByTestId('manual-map.pin')).toBeOnTheScreen();
  });
});
