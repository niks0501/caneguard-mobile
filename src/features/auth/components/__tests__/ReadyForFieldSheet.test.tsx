import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { ReadyForFieldSheet } from '@/features/auth/components/ReadyForFieldSheet';

let mockRole = 'field_reporter';
jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ user: { role: mockRole } }),
}));

afterEach(() => {
  jest.clearAllMocks();
  mockRole = 'field_reporter';
});

describe('ReadyForFieldSheet', () => {
  it('opens the existing biometric setup and never mentions storing a password', async () => {
    await render(<ReadyForFieldSheet />);
    expect(screen.getByText('Your password is never stored on this phone.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('ready-for-field.setup'));
    expect(router.replace).toHaveBeenCalledWith('/account-security');
  });

  it('dismisses with Not now', async () => {
    await render(<ReadyForFieldSheet />);
    await fireEvent.press(screen.getByTestId('ready-for-field.dismiss'));
    expect(router.back).toHaveBeenCalled();
  });

  it('closes itself for farmers', async () => {
    mockRole = 'farmer';
    await render(<ReadyForFieldSheet />);
    expect(screen.queryByTestId('ready-for-field.sheet')).toBeNull();
    expect(router.back).toHaveBeenCalled();
  });
});
