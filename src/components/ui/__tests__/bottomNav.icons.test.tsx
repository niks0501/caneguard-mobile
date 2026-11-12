import { render, screen } from '@testing-library/react-native';

import { BottomNav } from '@/components/ui/BottomNav';

const navigation = { navigate: jest.fn() };
const icon = (tab: string) => screen.getByTestId(`nav.${tab}.icon`);
const iconName = (tab: string) => {
  expect(icon(tab)).toHaveProp('size', 26);
  return icon(tab).props.name;
};

describe('BottomNav real-world icons (proposal, unpromoted)', () => {
  // Proves: inspector tabs use the approved Material icons at 26 dp.
  it('uses the approved icon per inspector tab', async () => {
    await render(<BottomNav activeTab="home" navigation={navigation} />);
    expect(iconName('home')).toBe('home-variant');
    expect(iconName('scan')).toBe('camera');
    expect(iconName('activity')).toBe('clipboard-text-clock');
    expect(iconName('today')).toBe('map-marker-radius');
  });

  // Proves: the farmer scans tab shows the approved sprout icon.
  it('lets the farmer scans tab use sprout', async () => {
    await render(<BottomNav activeTab="home" hiddenTabs={['today']} icons={{ activity: 'sprout' }} navigation={navigation} />);
    expect(iconName('activity')).toBe('sprout');
  });
});
