import { render, screen } from '@testing-library/react-native';

import { SheetScreen } from '@/components/ui/SheetScreen';

const noop = () => undefined;

describe('SheetScreen footer', () => {
  it('keeps the in-progress submit label in full ink with a spinner while the sheet saves', async () => {
    await render(
      <SheetScreen
        title="Log a symptom"
        onCancel={noop}
        onSubmit={noop}
        submitLoading
        submitLoadingLabel="Saving symptom…"
        submitTestID="sheet.submit">
        {null}
      </SheetScreen>,
    );

    const submit = screen.getByTestId('sheet.submit');
    expect(screen.getByText('Saving symptom…')).toHaveStyle({ color: 'background' });
    expect(screen.getByTestId('sheet.submit.spinner')).toBeOnTheScreen();
    expect(submit).toBeDisabled();
    expect(submit.props.accessibilityState).toEqual({ disabled: true, busy: true });
  });

  it('mutes the submit button when the sheet is blocked by invalid input instead of showing progress', async () => {
    await render(
      <SheetScreen
        title="Log a symptom"
        onCancel={noop}
        onSubmit={noop}
        submitDisabled
        submitLoadingLabel="Saving symptom…"
        submitTestID="sheet.submit">
        {null}
      </SheetScreen>,
    );

    expect(screen.queryByTestId('sheet.submit.spinner')).toBeNull();
    expect(screen.getByText('Save')).toHaveStyle({ color: 'textSecondary' });
    expect(screen.getByTestId('sheet.submit')).toBeDisabled();
  });
});
