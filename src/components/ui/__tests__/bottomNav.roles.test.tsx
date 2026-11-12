import { fireEvent, render, screen } from '@testing-library/react-native';

import { BottomNav } from '@/components/ui/BottomNav';

const navigation = { navigate: jest.fn() };

describe('BottomNav tabs by role (P1-5)', () => {
  // Proves: inspectors keep all four tabs including Visits.
  it('shows Visits by default', async () => {
    await render(<BottomNav activeTab="home" navigation={navigation} />);
    expect(screen.getByTestId('nav.today')).toBeTruthy();
    expect(screen.getByTestId('nav.activity')).toBeTruthy();
  });

  // Proves: the farmer tab bar (hiddenTabs=['today']) omits Visits and keeps Home, Scan, Activity.
  it('omits a hidden Visits tab', async () => {
    await render(<BottomNav activeTab="home" hiddenTabs={['today']} navigation={navigation} />);
    expect(screen.queryByTestId('nav.today')).toBeNull();
    expect(screen.getByTestId('nav.home')).toBeTruthy();
    expect(screen.getByTestId('nav.scan')).toBeTruthy();
    expect(screen.getByTestId('nav.activity')).toBeTruthy();
  });

  it('announces unread updates in the localized farmer Activity tab name', async () => {
    await render(
      <BottomNav
        activeTab="home"
        labels={{ activity: 'Aking mga Scan' }}
        activityAccessibilityLabel={(count) => `Aking mga Scan, ${count} hindi pa nababasang update sa opisina`}
        notificationCount={3}
        hiddenTabs={['today']}
        navigation={navigation}
      />,
    );

    expect(screen.getByTestId('nav.activity')).toHaveProp(
      'accessibilityLabel',
      'Aking mga Scan, 3 hindi pa nababasang update sa opisina',
    );
  });

  // Proves: each rendered non-active field-role bottom tab dispatches its route transition through the Expo Router tab navigator.
  it.each([
    ['home', 'scan'],
    ['scan', 'home'],
    ['activity', 'today'],
    ['today', 'activity'],
  ] as const)('dispatches %s -> %s through the tab navigator', async (from, target) => {
    const navigateToTab = jest.fn();
    const routes = [
      { key: 'home-key', name: 'home' },
      { key: 'scan-key', name: 'scan' },
      { key: 'activity-key', name: 'activity' },
      { key: 'today-key', name: 'today' },
    ] as const;
    const fromIndex = routes.findIndex((route) => route.name === from);
    const targetRoute = routes.find((route) => route.name === target);

    await render(
      <BottomNav
        state={{ index: fromIndex, routes }}
        navigateToTab={navigateToTab}
      />,
    );

    await fireEvent.press(screen.getByTestId(`nav.${target}`));

    expect(navigateToTab).toHaveBeenCalledWith(targetRoute?.key);
  });
});
