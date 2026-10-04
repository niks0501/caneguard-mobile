import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import SplashScreen from '@/app/index';
import { useAuth } from '@/features/auth/hooks/useAuth';

jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = jest.mocked(useAuth);
const mockReplace = jest.mocked(router.replace);
const mockPush = jest.mocked(router.push);

describe('public auth entry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('routes returning users directly to the password form', async () => {
    mockUseAuth.mockReturnValue({
      hasCompletedLogin: true,
      status: 'unauthenticated',
    } as unknown as ReturnType<typeof useAuth>);

    await render(<SplashScreen />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/login'));
  });

  it('keeps the welcome entry for a new installation', async () => {
    mockUseAuth.mockReturnValue({
      hasCompletedLogin: false,
      status: 'unauthenticated',
    } as unknown as ReturnType<typeof useAuth>);

    await render(<SplashScreen />);

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('keeps the logo and both welcome actions visible in a fixed no-scroll screen', async () => {
    mockUseAuth.mockReturnValue({
      hasCompletedLogin: false,
      status: 'unauthenticated',
    } as unknown as ReturnType<typeof useAuth>);

    await render(<SplashScreen />);

    expect(screen.queryByTestId('screen-container.scroll-view')).toBeNull();
    expect(screen.getByLabelText('CaneGuard Logo')).toBeOnTheScreen();
    expect(screen.getByLabelText('Get started with CaneGuard')).toBeOnTheScreen();
    expect(screen.getByLabelText('I already have an account')).toBeOnTheScreen();
  });

  it('offers the field guide as a third action that needs no account', async () => {
    mockUseAuth.mockReturnValue({
      hasCompletedLogin: false,
      status: 'unauthenticated',
    } as unknown as ReturnType<typeof useAuth>);

    await render(<SplashScreen />);

    await fireEvent.press(screen.getByTestId('welcome.field-guide'));
    expect(mockPush).toHaveBeenCalledWith('/field-guide');
  });
});
