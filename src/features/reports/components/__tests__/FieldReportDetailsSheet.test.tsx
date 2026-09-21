import { fireEvent, render, screen } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';

import FieldReportDetailsRoute from '@/app/field-report-details';

const mockUseLocalSearchParams = jest.mocked(useLocalSearchParams);
const mockDismissTo = router.dismissTo as unknown as jest.Mock;
const mockBack = router.back as jest.Mock;

describe('FieldReportDetailsSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({
      caneClass: '',
      cropAge: '',
      notes: '',
      scanRecordId: 'scan-1',
      variety: '',
    });
  });

  it('opens with the current values and no fetching', async () => {
    mockUseLocalSearchParams.mockReturnValue({
      caneClass: 'Plant cane',
      cropAge: '~3 months',
      notes: '',
      scanRecordId: 'scan-1',
      variety: 'Phil 2000',
    });
    await render(<FieldReportDetailsRoute />);

    expect(screen.getByRole('header', { name: 'More field details' })).toBeOnTheScreen();
    expect(screen.getByTestId('field-report.variety-input')).toHaveProp('value', 'Phil 2000');
    expect(screen.getByTestId('field-report.crop-age-input')).toHaveProp('value', '~3 months');
    expect(screen.getByTestId('field-report.cane-class-input')).toHaveProp('value', 'Plant cane');
  });

  it('returns edited values to the review step on save', async () => {
    await render(<FieldReportDetailsRoute />);

    await fireEvent.changeText(screen.getByTestId('field-report.variety-input'), 'Phil 2000');
    await fireEvent.changeText(screen.getByTestId('field-report.crop-age-input'), '~3 months');
    await fireEvent.changeText(screen.getByTestId('field-report.cane-class-input'), 'Plant cane');
    await fireEvent.changeText(screen.getByTestId('field-report.notes-input'), 'Near the river');
    await fireEvent.press(screen.getByTestId('field-report.save-optional-details'));

    expect(mockDismissTo).toHaveBeenCalledWith({
      params: {
        caneClass: 'Plant cane',
        cropAge: '~3 months',
        detailsSaved: '1',
        notes: 'Near the river',
        scanRecordId: 'scan-1',
        variety: 'Phil 2000',
      },
      pathname: '/field-report',
    });
    expect(screen.queryByTestId('field-report.variety-input')).toBeNull();
  });

  it('cancels without returning values, keeping the parent state untouched', async () => {
    await render(<FieldReportDetailsRoute />);

    await fireEvent.changeText(screen.getByTestId('field-report.variety-input'), 'Phil 2000');
    await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));

    // Dirty sheet asks once before discarding.
    expect(mockDismissTo).not.toHaveBeenCalled();
    expect(screen.getByText('Discard changes?')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Discard' }));
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockDismissTo).not.toHaveBeenCalled();
  });
});
