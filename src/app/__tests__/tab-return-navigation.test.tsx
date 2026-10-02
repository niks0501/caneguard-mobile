import fs from 'fs';
import path from 'path';

import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { router, Stack, Tabs, type Href } from 'expo-router';
import { useEffect, useRef, useSyncExternalStore, type PropsWithChildren } from 'react';
import { View } from 'react-native';

import { BrandedScreenHeader } from '@/components/ui/BrandedScreenHeader';
import { returnToTab, type TabHref } from '@/features/navigation/returnToTab';

jest.unmock('expo-router');

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  const frame = { x: 0, y: 0, width: 320, height: 640 };
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    SafeAreaView: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement('SafeAreaView', props, children),
    SafeAreaInsetsContext: React.createContext(inset),
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => frame,
    initialWindowMetrics: { insets: inset, frame },
  };
});

// Stand-in for the native stack. Every mounted screen registers itself and
// replays the native removal event both platforms emit when a screen leaves
// the stack (Android from `ScreenFragment.onDestroy`, iOS from `RNSScreen`'s
// `viewDidDisappear`). That is what lets this suite check whether the JS root
// stack and the native stack still agree.
const mockPendingRemovals: (() => void)[] = [];
const mockNativeScreens = new Map<string, { dismiss: (event: unknown) => void }>();
jest.mock('react-native-screens', () => {
  const React = require('react');
  const actual = jest.requireActual('react-native-screens');
  return {
    ...actual,
    ScreenStackItem: (props: { screenId: string; onDismissed?: (event: unknown) => void }) => {
      const handlerRef = React.useRef(props.onDismissed);
      handlerRef.current = props.onDismissed;
      React.useEffect(() => {
        const entry = { dismiss: (event: unknown) => handlerRef.current?.(event) };
        mockNativeScreens.set(props.screenId, entry);
        return () => {
          mockNativeScreens.delete(props.screenId);
          mockPendingRemovals.push(() => entry.dismiss({ nativeEvent: { dismissCount: 1 } }));
        };
      }, [props.screenId]);
      return React.createElement(actual.ScreenStackItem, props);
    },
  };
});

type AuthStatus = 'authenticated' | 'unauthenticated';

let authStatus: AuthStatus = 'unauthenticated';
const authListeners = new Set<() => void>();
function setAuthStatus(status: AuthStatus) {
  authStatus = status;
  authListeners.forEach((listener) => listener());
}
function useAuthStatus() {
  return useSyncExternalStore(
    (listener) => {
      authListeners.add(listener);
      return () => authListeners.delete(listener);
    },
    () => authStatus,
  );
}

/**
 * Mirrors the `Stack.Protected` guards and the "land on the dashboard after
 * login" effect of `src/app/_layout.tsx`.
 */
function RootLayout() {
  const status = useAuthStatus();
  const previousStatusRef = useRef(status);

  useEffect(() => {
    const previousStatus = previousStatusRef.current;
    previousStatusRef.current = status;
    if (previousStatus !== 'authenticated' && status === 'authenticated') {
      router.replace('/home');
    }
  }, [status]);

  return (
    <Stack>
      <Stack.Protected guard={status === 'authenticated'}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="reports" />
        <Stack.Screen name="field-report" />
        <Stack.Screen name="analysis-result" />
        <Stack.Screen name="image-preview" />
        <Stack.Screen name="symptom-checklist" />
        <Stack.Screen name="record-details" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'unauthenticated'}>
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  );
}

function TabsLayout(_: PropsWithChildren) {
  return (
    <Tabs>
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="scan" options={{ title: 'Scan' }} />
      <Tabs.Screen name="activity" options={{ title: 'Activity' }} />
      <Tabs.Screen name="today" options={{ title: "Today's visits" }} />
    </Tabs>
  );
}

function screenStub(testID: string) {
  return function ScreenStub() {
    return <View testID={testID} />;
  };
}

function TodayTabStub() {
  return (
    <View testID="screen.today">
      <BrandedScreenHeader title="Today's field work" />
    </View>
  );
}

function ScanTabStub() {
  return (
    <View testID="screen.scan">
      <BrandedScreenHeader
        title="Scan sugarcane"
        showClose
        onClosePress={() => router.replace('/home')}
        closeTestID="scan.header-close"
      />
    </View>
  );
}

const routes = {
  _layout: RootLayout,
  login: screenStub('screen.login'),
  '(tabs)/_layout': TabsLayout,
  '(tabs)/home': screenStub('screen.home'),
  '(tabs)/scan': ScanTabStub,
  '(tabs)/activity': screenStub('screen.activity'),
  '(tabs)/today': TodayTabStub,
  reports: screenStub('screen.reports'),
  'field-report': screenStub('screen.field-report'),
  'analysis-result': screenStub('screen.analysis-result'),
  'image-preview': screenStub('screen.image-preview'),
  'symptom-checklist': screenStub('screen.symptom-checklist'),
  'record-details': screenStub('screen.record-details'),
};

/** Route keys of the `(tabs)` screens currently mounted in the native stack. */
const nativeTabScreens = () =>
  [...mockNativeScreens.keys()].filter((screenId) => screenId.startsWith('(tabs)-'));

const consoleError = jest.spyOn(console, 'error');
const dismissedNativelyErrors = () =>
  consoleError.mock.calls
    .map((args) => args.map(String).join(' '))
    .filter((message) => message.includes('was removed natively'));

const TAB_TITLES = ['Home', 'Scan', 'Activity', "Today's visits"];

/** The single tab whose bar button is announced as selected. */
function selectedTab(): string | null {
  const [selected, ...rest] = screen.queryAllByRole('button', { selected: true });
  if (!selected || rest.length > 0) {
    return null;
  }
  const { accessibilityLabel } = selected.props;
  if (typeof accessibilityLabel !== 'string') {
    return null;
  }
  return TAB_TITLES.find((title) => accessibilityLabel.startsWith(title)) ?? null;
}

async function settleNativeRemovals() {
  while (mockPendingRemovals.length > 0) {
    const fireRemoval = mockPendingRemovals.shift()!;
    await act(async () => {
      fireRemoval();
    });
  }
}

/** Runs one navigation step, then replays the native removals it caused. */
async function step(action: () => void | Promise<void>) {
  await act(async () => {
    await action();
  });
  await settleNativeRemovals();
}

const signIn = () => step(() => setAuthStatus('authenticated'));
const signOut = () => step(() => setAuthStatus('unauthenticated'));

/** Opens the app signed out, signs in and lands on the Scan tab. */
async function renderSignedInAppOnScan() {
  await renderRouter(routes, { initialUrl: '/login' });
  await signIn();
  await step(() => router.push('/scan'));
}

beforeEach(() => {
  consoleError.mockClear();
  mockPendingRemovals.length = 0;
  mockNativeScreens.clear();
  setAuthStatus('unauthenticated');
});

describe('returning to a bottom tab from a root-level screen', () => {
  it('keeps one (tabs) screen in the native stack through a report-flow return', async () => {
    await renderSignedInAppOnScan();
    expect(nativeTabScreens()).toHaveLength(1);

    await step(() => router.push('/reports'));
    await step(() => returnToTab('/home'));

    expect(nativeTabScreens()).toHaveLength(1);
    expect(screen.getByTestId('screen.home')).toBeTruthy();
    expect(selectedTab()).toBe('Home');
    expect(dismissedNativelyErrors()).toEqual([]);
  });

  it('reuses the existing (tabs) entry instead of stacking a new one', async () => {
    await renderSignedInAppOnScan();
    const [tabsScreenBeforeReturn] = nativeTabScreens();

    await step(() => router.push('/field-report'));
    await step(() => returnToTab('/home'));

    // Same native screen: the stack popped back to the original entry rather
    // than replacing it with a second (tabs) route.
    expect(nativeTabScreens()).toEqual([tabsScreenBeforeReturn]);
    expect(selectedTab()).toBe('Home');
  });

  it.each<{ enter: Href; enteredScreen: string; tab: TabHref; tabTitle: string }>([
    { enter: '/reports', enteredScreen: 'screen.reports', tab: '/home', tabTitle: 'Home' },
    {
      enter: '/field-report',
      enteredScreen: 'screen.field-report',
      tab: '/home',
      tabTitle: 'Home',
    },
    {
      enter: '/image-preview',
      enteredScreen: 'screen.image-preview',
      tab: '/scan',
      tabTitle: 'Scan',
    },
    {
      enter: '/analysis-result',
      enteredScreen: 'screen.analysis-result',
      tab: '/scan',
      tabTitle: 'Scan',
    },
    {
      enter: '/symptom-checklist',
      enteredScreen: 'screen.symptom-checklist',
      tab: '/home',
      tabTitle: 'Home',
    },
    {
      enter: '/record-details',
      enteredScreen: 'screen.record-details',
      tab: '/activity',
      tabTitle: 'Activity',
    },
  ])('returns from $enter to the $tabTitle tab', async ({ enter, enteredScreen, tab, tabTitle }) => {
    await renderSignedInAppOnScan();

    await step(() => router.push(enter));
    expect(screen.getByTestId(enteredScreen)).toBeTruthy();

    await step(() => returnToTab(tab));

    expect(nativeTabScreens()).toHaveLength(1);
    expect(selectedTab()).toBe(tabTitle);
    expect(dismissedNativelyErrors()).toEqual([]);
  });

  it('returns from a pushed field-report route to its previous screen', async () => {
    await renderSignedInAppOnScan();
    await step(() => router.push('/field-report'));
    expect(screen.getByTestId('screen.field-report')).toBeTruthy();
    expect(router.canGoBack()).toBe(true);

    await step(() => router.back());

    expect(screen.getByTestId('screen.scan')).toBeTruthy();
    expect(screen.queryByTestId('screen.field-report')).toBeNull();
    expect(dismissedNativelyErrors()).toEqual([]);
  });

  it('returns to home in one step from a stack of flow screens', async () => {
    await renderSignedInAppOnScan();
    await step(() => router.push('/image-preview'));
    await step(() => router.push('/analysis-result'));
    await step(() => router.push('/field-report'));
    expect(nativeTabScreens()).toHaveLength(1);

    await step(() => returnToTab('/home'));

    expect(nativeTabScreens()).toHaveLength(1);
    expect(screen.getByTestId('screen.home')).toBeTruthy();
    expect(selectedTab()).toBe('Home');
  });

  it('drops the popped screen from the native stack in the same step as the JS stack', async () => {
    await renderSignedInAppOnScan();
    await step(() => router.push('/reports'));
    expect(nativeTabScreens()).toHaveLength(1);

    await step(() => router.back());

    expect(screen.getByTestId('screen.scan')).toBeTruthy();
    expect(screen.queryByTestId('screen.reports')).toBeNull();
    expect(dismissedNativelyErrors()).toEqual([]);
  });
});

describe('tab-root header navigation', () => {
  it('returns from the Scan close affordance to Home without an unhandled action', async () => {
    await renderSignedInAppOnScan();

    await step(() => fireEvent.press(screen.getByTestId('scan.header-close')));

    expect(screen.getByTestId('screen.home')).toBeTruthy();
    expect(selectedTab()).toBe('Home');
    expect(consoleError.mock.calls.flat().join(' ')).not.toContain('GO_BACK');
    expect(dismissedNativelyErrors()).toEqual([]);
  });

  it("returns from Today's field work back button to Home without an unhandled action", async () => {
    await renderRouter(routes, { initialUrl: '/login' });
    await signIn();
    await step(() => router.push('/today'));

    await step(() => fireEvent.press(screen.getByRole('button', { name: 'Go back' })));

    expect(screen.getByTestId('screen.home')).toBeTruthy();
    expect(selectedTab()).toBe('Home');
    expect(consoleError.mock.calls.flat().join(' ')).not.toContain('GO_BACK');
    expect(dismissedNativelyErrors()).toEqual([]);
  });
});

describe('root stack agreement across auth transitions', () => {
  it('leaves no (tabs) screen behind after logout and re-login', async () => {
    await renderSignedInAppOnScan();
    await step(() => router.push('/reports'));
    await step(() => returnToTab('/home'));

    await signOut();
    expect(nativeTabScreens()).toHaveLength(0);
    expect(screen.getByTestId('screen.login')).toBeTruthy();

    await signIn();
    expect(nativeTabScreens()).toHaveLength(1);
    expect(selectedTab()).toBe('Home');
    expect(dismissedNativelyErrors()).toEqual([]);
  });
});

describe('root-level tab navigation guard', () => {
  // `/home`, `/scan`, `/activity` and `/today` all resolve to the root stack's
  // single `(tabs)` screen. Reaching one of them from a root-level screen with
  // `replace`/`push` stacks a second `(tabs)` route, which is what produced
  // "The screen '(tabs)' was removed natively but didn't get removed from JS
  // state". Root-level screens must use `returnToTab`.
  const appDir = path.resolve(__dirname, '..');
  const allowedCallers = new Set([
    // Sign-in replaces the signed-out route with the first authenticated
    // screen, so there is no `(tabs)` entry to reuse yet.
    'login.tsx',
  ]);
  const tabHrefPattern = /router\.(replace|push|navigate)\(\s*['"](\/home|\/scan|\/activity|\/today)['"]/;

  it('returns to a tab route through returnToTab instead of replace or push', () => {
    const violations: string[] = [];

    for (const file of fs.readdirSync(appDir)) {
      if (!file.endsWith('.tsx') || file.startsWith('_') || allowedCallers.has(file)) {
        continue;
      }

      const lines = fs.readFileSync(path.join(appDir, file), 'utf8').split('\n');
      lines.forEach((line, index) => {
        if (line.trim().startsWith('//')) {
          return;
        }
        if (tabHrefPattern.test(line)) {
          violations.push(`${file}:${index + 1}: ${line.trim()}`);
        }
      });
    }

    expect(violations).toEqual([]);
  });
});
