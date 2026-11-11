import { fireEvent, render } from '@testing-library/react-native';

import { PlotDraftRow } from '@/features/activity/components/PlotDraftRow';

describe('PlotDraftRow', () => {
  it('labels an unfinished plot "Not finished" and resumes it on one tap', async () => {
    const onPress = jest.fn();
    const view = await render(<PlotDraftRow onPress={onPress} testID="plot-draft" />);

    expect(view.getByText('Finish your plot boundary')).toBeTruthy();
    expect(view.getByText('Not finished · saved on this device')).toBeTruthy();
    await fireEvent.press(view.getByTestId('plot-draft'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
