import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet, Text } from 'react-native';

import { ActionDock } from '@/components/ui/ActionDock';
import { AppButton } from '@/components/ui/AppButton';

const noop = () => undefined;

describe('ActionDock', () => {
  it('renders the primary action first, then the secondary row', async () => {
    await render(
      <ActionDock
        primary={<AppButton testID="dock.primary" onPress={noop}>Next</AppButton>}
        secondary={<AppButton testID="dock.secondary" variant="secondary" onPress={noop}>Save</AppButton>}
      />,
    );

    const tree = JSON.stringify(screen.toJSON());
    expect(tree.indexOf('dock.primary')).toBeGreaterThan(-1);
    expect(tree.indexOf('dock.secondary')).toBeGreaterThan(tree.indexOf('dock.primary'));
  });

  it('omits the secondary row when there are no secondary actions', async () => {
    await render(
      <ActionDock primary={<AppButton testID="dock.primary" onPress={noop}>Next</AppButton>} secondary={null} />,
    );

    expect(screen.getByTestId('dock.primary')).toBeOnTheScreen();
    const dock = screen.getByTestId('action-dock');
    // Only the primary action sits in the dock's content column.
    expect(dock.children).toHaveLength(1);
    const inner = dock.children[0] as { children: unknown[] };
    expect(inner.children).toHaveLength(1);
  });

  it('shows the note above the actions', async () => {
    await render(
      <ActionDock
        note={<Text>Draft saved on this device.</Text>}
        primary={<AppButton testID="dock.primary" onPress={noop}>Next</AppButton>}
      />,
    );

    const tree = JSON.stringify(screen.toJSON());
    expect(tree.indexOf('Draft saved on this device.')).toBeLessThan(tree.indexOf('dock.primary'));
  });

  it('keeps the primary action pressable', async () => {
    const onPress = jest.fn();
    await render(<ActionDock primary={<AppButton testID="dock.primary" onPress={onPress}>Next</AppButton>} />);

    await fireEvent.press(screen.getByTestId('dock.primary'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('overlays the bottom edge and reports its height when floating', async () => {
    const onHeightChange = jest.fn();
    await render(
      <ActionDock
        floating
        onHeightChange={onHeightChange}
        primary={<AppButton onPress={noop}>Next</AppButton>}
      />,
    );

    const dock = screen.getByTestId('action-dock');
    expect(StyleSheet.flatten(dock.props.style)).toMatchObject({ position: 'absolute', bottom: 0 });

    await fireEvent(dock, 'layout', { nativeEvent: { layout: { height: 132 } } });
    expect(onHeightChange).toHaveBeenCalledWith(132);
  });
});

describe('AppButton selected state', () => {
  it('exposes a selected state only when the caller sets one', async () => {
    await render(
      <>
        <AppButton testID="plain" onPress={noop}>Plain</AppButton>
        <AppButton testID="chosen" selected onPress={noop}>Chosen</AppButton>
        <AppButton testID="unchosen" selected={false} onPress={noop}>Unchosen</AppButton>
      </>,
    );

    expect(screen.getByTestId('plain').props.accessibilityState.selected).toBeUndefined();
    expect(screen.getByTestId('chosen').props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.getByTestId('unchosen').props.accessibilityState).toMatchObject({ selected: false });
  });
});
