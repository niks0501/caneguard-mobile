import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';

// useTheme is mocked in jest.setup.js to return each token's own name.
const noop = () => undefined;

const VARIANTS = ['primary', 'secondary', 'text', 'danger'] as const;

const ACTIVE_LABEL_COLOR: Record<(typeof VARIANTS)[number], string> = {
  primary: 'background',
  secondary: 'primaryDark',
  text: 'primary',
  danger: 'danger',
};

function flatStyle(testID: string) {
  return StyleSheet.flatten(screen.getByTestId(testID).props.style);
}

describe('AppButton busy state', () => {
  it('keeps the primary fill and no fade while busy', async () => {
    await render(
      <AppButton testID="btn" busy onPress={noop}>
        Analyzing…
      </AppButton>,
    );

    const style = flatStyle('btn');
    expect(style.backgroundColor).toBe('primary');
    expect(style.opacity).toBeUndefined();
    expect(screen.getByTestId('btn')).toBeDisabled();
    expect(screen.getByTestId('btn').props.accessibilityState).toEqual({ disabled: true, busy: true });
  });

  it.each(VARIANTS)('keeps the active %s label and no muted outline while busy', async (variant) => {
    await render(
      <AppButton variant={variant} testID="btn" busy onPress={noop}>
        Saving…
      </AppButton>,
    );

    const style = flatStyle('btn');
    expect(style.opacity).toBeUndefined();
    expect(style.borderColor).not.toBe('primaryLight');
    expect(screen.getByText('Saving…')).toHaveStyle({ color: ACTIVE_LABEL_COLOR[variant] });
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

  it.each(VARIANTS)('mutes an idle disabled %s button without fading its label', async (variant) => {
    await render(
      <AppButton variant={variant} testID="btn" disabled onPress={noop}>
        Choose an observation
      </AppButton>,
    );

    const style = flatStyle('btn');
    expect(style.backgroundColor).toBe('surfaceMuted');
    expect(style.borderColor).toBe('primaryLight');
    expect(style.borderWidth).toBe(1);
    expect(style.opacity).toBeUndefined();
    expect(screen.getByText('Choose an observation')).toHaveStyle({ color: 'textSecondary' });
  });
});
