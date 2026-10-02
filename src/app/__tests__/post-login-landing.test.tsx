import { render, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import { AppNavigator } from '@/app/_layout';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { AuthStatus } from '@/features/auth/types';

jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// expo-router is globally mocked in jest.setup.js without navigator
// primitives. This suite renders the real AppNavigator, so it replaces that
// mock with a faithful-enough stand-in: Stack.Protected hides its screens
// while its guard is false (as expo-router's useFilterScreenChildren does),
// and restores the last focused protected route when the guard flips back to
// true (the preserved route state that survives across a login).
jest.mock(
  'expo-router',
  () => {
    const React = jest.requireActual('react');

    const navigationState = {
      route: '/login',
      lastProtectedRoute: '/records',
    };

    const routerMock = {
      back: jest.fn(),
      dismissTo: jest.fn(),
      navigate: jest.fn(),
      push: jest.fn((href: string) => {
        navigationState.route = href;
      }),
      replace: jest.fn((href: string) => {
        navigationState.route = href;
      }),
      setParams: jest.fn(),
    };

    function Screen() {
      return null;
    }

    function Protected({
      guard,
      children,
    }: {
      guard: boolean;
      children: React.ReactNode;
    }) {
      const previousGuard = React.useRef(guard);
      if (previousGuard.current !== guard) {
        previousGuard.current = guard;
        if (guard) {
          // Guard re-enabled: the router restores the preserved protected
          // route instead of the initial route.
          navigationState.route = navigationState.lastProtectedRoute;
        }
      }
      return guard ? <>{children}</> : null;
    }

    const Stack = Object.assign(({ children }: { children: React.ReactNode }) => <>{children}</>, {
      Protected,
      Screen,
    });

    return {
      __navigationState: navigationState,
      router: routerMock,
      DarkTheme: {},
      DefaultTheme: {},
      Stack,
      ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    };
  },
  { virtual: false },
);

jest.mock('expo-splash-screen', () => ({
  hideAsync: jest.fn(async () => undefined),
  preventAutoHideAsync: jest.fn(async () => undefined),
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

// AppNavigator shares its route file with the provider composition root, so
// stub the native-heavy providers it never renders itself.
jest.mock('@/database/DatabaseProvider', () => {
  const React = jest.requireActual('react');
  return {
    CaneGuardDatabaseProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});
jest.mock('@/features/detection/context/ScanSessionProvider', () => {
  const React = jest.requireActual('react');
  return {
    ScanSessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});
jest.mock('@/features/detection/model/useCaneGuardModel', () => {
  const React = jest.requireActual('react');
  return {
    CaneGuardModelProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});
jest.mock('@/features/sync/providers/SyncProvider', () => {
  const React = jest.requireActual('react');
  return {
    SyncProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});
jest.mock('@/components/ui/Toast', () => {
  const React = jest.requireActual('react');
  return {
    ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

jest.mock('@/features/notifications/components/MobileAttentionLifecycle', () => ({
  MobileAttentionLifecycle: () => null,
}));

const mockUseAuth = jest.mocked(useAuth);
const mockReplace = jest.mocked(router.replace);
const navigationState = (jest.requireMock('expo-router') as { __navigationState: { route: string; lastProtectedRoute: string } })
  .__navigationState;

function setAuthStatus(status: AuthStatus) {
  mockUseAuth.mockReturnValue({ status } as unknown as ReturnType<typeof useAuth>);
}

describe('post-login landing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    navigationState.route = '/login';
    navigationState.lastProtectedRoute = '/records';
    setAuthStatus('unauthenticated');
  });

  it('lands on the dashboard when a leftover protected destination survives the login', async () => {
    navigationState.lastProtectedRoute = '/records';

    const { rerender } = await render(<AppNavigator />);
    expect(navigationState.route).toBe('/login');

    setAuthStatus('authenticated');
    await rerender(<AppNavigator />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/home'));
    expect(navigationState.route).toBe('/home');
  });

  it('lands on the dashboard regardless of which stale page was left open', async () => {
    navigationState.lastProtectedRoute = '/reports';

    const { rerender } = await render(<AppNavigator />);

    setAuthStatus('authenticated');
    await rerender(<AppNavigator />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/home'));
    expect(navigationState.route).toBe('/home');
  });

  it('does not yank the route again once the session is stable', async () => {
    const { rerender } = await render(<AppNavigator />);

    setAuthStatus('authenticated');
    await rerender(<AppNavigator />);
    await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(1));

    await rerender(<AppNavigator />);
    expect(mockReplace).toHaveBeenCalledTimes(1);
  });
});
