import { fireEvent, render, screen } from '@testing-library/react-native';

import { ClampedText } from '@/components/ui/ClampedText';

const LONG_EVIDENCE =
  'Orange-brown pustules across the lower leaves of about a fifth of the block, with several stalks showing early smut whip emergence near the northern irrigation channel.';

describe('ClampedText', () => {
  it('clamps long free text to three lines with a Show more control that keeps the full string', async () => {
    await render(<ClampedText text={LONG_EVIDENCE} testID="evidence" />);

    // The full string stays in the view at all times, so the accessible
    // name and getByText still see the whole value.
    expect(screen.getByTestId('evidence').props.numberOfLines).toBe(3);
    expect(screen.getByText(LONG_EVIDENCE)).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Show more' }));
    expect(screen.getByTestId('evidence').props.numberOfLines).toBeUndefined();
    expect(screen.getByText(LONG_EVIDENCE)).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Show less' }));
    expect(screen.getByTestId('evidence').props.numberOfLines).toBe(3);
  });

  it('renders short values with no expansion control', async () => {
    await render(<ClampedText text="Healthy regrowth observed." testID="short" />);

    expect(screen.getByText('Healthy regrowth observed.')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Show more' })).not.toBeOnTheScreen();
  });

  it('never clamps placeholder values', async () => {
    await render(<ClampedText text="Not provided" testID="placeholder" />);

    expect(screen.getByTestId('placeholder').props.numberOfLines).toBeUndefined();
    expect(screen.queryByRole('button', { name: 'Show more' })).not.toBeOnTheScreen();
  });
});
