import { fireEvent, render, screen } from '@testing-library/react-native';
import RegisterScreen from '@/app/register';

describe('RegisterScreen', () => {
  it('keeps the lower password field in a keyboard-aware scroll container while preserving form behavior', async () => {
    await render(<RegisterScreen />);

    expect(
      screen.getByTestId('screen-container.keyboard-avoiding-view'),
    ).toBeOnTheScreen();

    const passwordInput = screen.getByTestId('register.password-input');
    await fireEvent(passwordInput, 'focus');
    await fireEvent.changeText(passwordInput, 'secret-password');
    expect(screen.getByTestId('register.password-input')).toHaveProp(
      'value',
      'secret-password',
    );
    expect(screen.getByTestId('register.password-input')).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByTestId('register.full-name-input'), 'Maria Santos');
    await fireEvent.changeText(screen.getByTestId('register.barangay-input'), 'Wawa');
    await fireEvent.changeText(screen.getByTestId('register.phone-input'), '09171234567');
    await fireEvent(passwordInput, 'blur');
    await fireEvent.press(screen.getByText('Create Account'));

    expect(screen.getByText('Account creation is not connected yet. Registration will be added next.')).toBeOnTheScreen();
    expect(screen.getByTestId('register.password-input')).toHaveProp(
      'value',
      'secret-password',
    );
  });
});
