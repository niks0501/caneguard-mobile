import { fireEvent, render, screen } from '@testing-library/react-native';

import { BarangayPicker } from '@/features/reports/components/BarangayPicker';
import { NASUGBU_BARANGAYS } from '@/features/reports/referenceData/nasugbuSeed';

describe('BarangayPicker', () => {
  it('allows custom typed values by default for inspector legacy compatibility', async () => {
    const onChange = jest.fn();
    await render(
      <BarangayPicker
        barangays={NASUGBU_BARANGAYS}
        value="Legacy Sitio"
        onChange={onChange}
        testID="picker"
      />,
    );
    await fireEvent.press(screen.getByTestId('picker'));
    expect(screen.getByTestId('picker-keep-current')).toBeTruthy();

    await fireEvent.changeText(screen.getByTestId('picker-search'), 'Sitio Nuevo');
    const customOption = screen.getByTestId('picker-custom-option');
    await fireEvent.press(customOption);
    expect(onChange).toHaveBeenCalledWith('Sitio Nuevo');
  });

  it('restricts selection strictly to the provided list when allowCustom is false (CG-09)', async () => {
    const onChange = jest.fn();
    await render(
      <BarangayPicker
        allowCustom={false}
        barangays={NASUGBU_BARANGAYS}
        value="Legacy Sitio"
        onChange={onChange}
        testID="picker"
      />,
    );
    await fireEvent.press(screen.getByTestId('picker'));
    expect(screen.queryByTestId('picker-keep-current')).toBeNull();

    await fireEvent.changeText(screen.getByTestId('picker-search'), 'Sitio Nuevo');
    expect(screen.queryByTestId('picker-custom-option')).toBeNull();
    expect(screen.getByText('No matching barangay.')).toBeTruthy();

    await fireEvent.changeText(screen.getByTestId('picker-search'), 'Aga');
    await fireEvent.press(screen.getByText('Aga'));
    expect(onChange).toHaveBeenCalledWith('Aga');
  });
});
