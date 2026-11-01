import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';

// useTheme is mocked in jest.setup.js to return each token's own name.
const noop = () => undefined;

function flatStyle(testID: string) {
  return StyleSheet.flatten(screen.getByTestId(testID).props.style);
}

describe('AppButton busy state', () => {
  it('keeps the active fill, full-ink label and no fade while busy', async () => {
    await render(
      <AppButton testID="btn" busy onPress={noop}>
        Analyzing…
      </AppButton>,
    );

    const style = flatStyle('btn');
    expect(style.backgroundColor).toBe('primary');
    expect(style.opacity).toBeUndefined();
    expect(screen.getByText('Analyzing…')).toHaveStyle({ color: 'background' });
    expect(screen.getByTestId('btn')).toBeDisabled();
    expect(screen.getByTestId('btn').props.accessibilityState).toEqual({ disabled: true, busy: true });
  });

  it('shows a spinner only while busy', async () => {
    const { rerender } = await render(
      <AppButton testID="btn" busy onPress={noop}>
        Saving…
      </AppButton>,
    );
    expect(screen.queryByTestId('btn.spinner')).not.toBeNull();

    await rerender(
      <AppButton testID="btn" onPress={noop}>
        Save
      </AppButton>,
    );
    expect(screen.queryByTestId('btn.spinner')).toBeNull();
  });

  it('mutes an idle disabled button without fading its label', async () => {
    await render(
      <AppButton testID="btn" disabled onPress={noop}>
        Choose an observation
      </AppButton>,
    );

    const style = flatStyle('btn');
    expect(style.backgroundColor).toBe('surfaceMuted');
    expect(style.opacity).toBeUndefined();
    expect(screen.getByText('Choose an observation')).toHaveStyle({ color: 'textSecondary' });
  });
});
