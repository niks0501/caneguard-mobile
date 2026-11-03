import { render, screen } from '@testing-library/react-native';

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
});
