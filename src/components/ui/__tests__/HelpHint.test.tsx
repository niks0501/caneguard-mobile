import { fireEvent, render, screen } from '@testing-library/react-native';

import { HelpHint, HelpHintGroup } from '@/components/ui/HelpHint';

describe('HelpHint', () => {
  it('reveals the help text in place on tap and hides it on a second tap', async () => {
    await render(
      <HelpHint label="Fresh field observation" text="What you physically saw on this visit." />,
    );

    expect(
      screen.queryByText('What you physically saw on this visit.'),
    ).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Help: Fresh field observation' }));
    expect(
      screen.getByText('What you physically saw on this visit.'),
    ).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Help: Fresh field observation' }));
    expect(
      screen.queryByText('What you physically saw on this visit.'),
    ).not.toBeOnTheScreen();
  });

  it('names the field in its accessible name and carries the full help as its hint', async () => {
    await render(
      <HelpHint
        label="Model version"
        text="The AI model build that scored this image."
        testID="help.model-version"
      />,
    );

    const control = screen.getByTestId('help.model-version');
    expect(control).toHaveProp('accessibilityLabel', 'Help: Model version');
    expect(control).toHaveProp('accessibilityHint', 'The AI model build that scored this image.');
  });

  it('offers a 44 dp touch target', async () => {
    await render(
      <HelpHint label="Model version" text="The AI model build." testID="help.target" />,
    );

    const style = screen.getByTestId('help.target').props.style;
    const flattened = Array.isArray(style) ? Object.assign({}, ...style) : style;
    expect(flattened.minHeight).toBeGreaterThanOrEqual(44);
    expect(flattened.minWidth).toBeGreaterThanOrEqual(44);
  });

  it('keeps exactly one help text open per group', async () => {
    await render(
      <HelpHintGroup>
        <HelpHint label="First field" text="First help text." testID="help.first" />
        <HelpHint label="Second field" text="Second help text." testID="help.second" />
      </HelpHintGroup>,
    );

    await fireEvent.press(screen.getByTestId('help.first'));
    expect(screen.getByText('First help text.')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('help.second'));
    expect(screen.getByText('Second help text.')).toBeOnTheScreen();
    expect(screen.queryByText('First help text.')).not.toBeOnTheScreen();
  });
});
