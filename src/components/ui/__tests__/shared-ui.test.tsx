import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { BottomNav } from '@/components/ui/BottomNav';
import { BrandedScreenHeader } from '@/components/ui/BrandedScreenHeader';

describe('shared navigation UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a tonal Feather header without decorative artwork', async () => {
    await render(<BrandedScreenHeader title="Scan Sugarcane" />);

    expect(screen.getByRole('header')).toHaveTextContent('Scan Sugarcane');
    expect(screen.getByLabelText('Go back')).toBeOnTheScreen();
  });

  it('keeps all bottom navigation destinations accessible', async () => {
    await render(<BottomNav activeTab="home" />);

    for (const label of ['Home', 'Scan', 'Records', 'Settings', 'Reports']) {
      expect(screen.getByLabelText(label)).toBeOnTheScreen();
    }

    await fireEvent.press(screen.getByLabelText('Records'));
    expect(router.push).toHaveBeenCalledWith('/records');
  });
});
