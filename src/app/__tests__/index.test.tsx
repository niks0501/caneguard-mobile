import { render, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import SplashScreen from '@/app/index';
import { useAuth } from '@/features/auth/hooks/useAuth';

jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = jest.mocked(useAuth);
const mockReplace = jest.mocked(router.replace);

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
});
