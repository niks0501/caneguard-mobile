import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { FARMER_COPY } from '@/constants/copy';
import { FarmerAdvisoryCard } from '@/features/farmer-care/components/FarmerAdvisoryCard';
import { formatDate, formatDateTime } from '@/lib/formatters';

let mockLanguage: 'en' | 'tl' = 'tl';
let mockAdvisories: unknown[] = [];
let mockHome: { barangay: string | null; loaded: boolean } = { barangay: 'Aga', loaded: true };
let mockLastRefreshedAt: string | null = null;
let mockRefreshing = false;
const mockSyncNow = jest.fn();

jest.mock('@/providers/LanguagePreferenceProvider', () => ({
  useLanguagePreference: () => ({ language: mockLanguage }),
}));
jest.mock('@/features/farmer-care/hooks/useFarmerCare', () => ({
  useFarmerCare: () => ({
    advisories: mockAdvisories,
    isFarmer: true,
    lastAdvisoryRefreshedAt: mockLastRefreshedAt,
    refreshingAdvisories: mockRefreshing,
    syncNow: mockSyncNow,
  }),
  useHomeBarangay: () => mockHome,
}));

const advisory = {
  remoteId: 'adv-1',
  headlineTl: 'Paalala sa Smut',
  headlineEn: 'Smut reminder',
  bodyTl: 'Putulin at ibalot ang may itim na usbong.',
  bodyEn: 'Cut and bag shoots with black whips.',
  publishedAt: '2026-11-28T00:00:00.000Z',
  expiresAt: '2026-12-12T00:00:00.000Z',
};

describe('FarmerAdvisoryCard', () => {
  beforeEach(() => {
    mockLanguage = 'tl';
    mockAdvisories = [];
    mockHome = { barangay: 'Aga', loaded: true };
    mockLastRefreshedAt = '2026-11-28T03:30:00.000Z';
    mockRefreshing = false;
    mockSyncNow.mockReset().mockResolvedValue(null);
    jest.mocked(router.push).mockClear();
  });

  it('shows guidance in the farmer\'s language with dates, freshness timestamp, and opens its message on tap', async () => {
    mockAdvisories = [advisory];
    await render(<FarmerAdvisoryCard />);
    expect(screen.getByText('Paalala sa Smut')).toBeTruthy();
    expect(screen.queryByText(advisory.bodyTl)).toBeNull();
    expect(screen.getByTestId('farmer-care.advisory.adv-1.dates')).toHaveTextContent(
      FARMER_COPY.tl.care.advisories.dates(formatDate(advisory.publishedAt), formatDate(advisory.expiresAt)),
    );
    expect(screen.getByTestId('farmer-care.advisories.freshness')).toHaveTextContent(
      FARMER_COPY.tl.care.advisories.updatedAt(formatDateTime(mockLastRefreshedAt!)),
    );

    await fireEvent.press(screen.getByTestId('farmer-care.advisory.adv-1'));
    expect(screen.getByText(advisory.bodyTl)).toBeTruthy();
    expect(screen.getByText(`${FARMER_COPY.tl.care.advisories.heading} · Aga`)).toBeTruthy();
  });

  it('triggers a forced refresh when the farmer taps Refresh', async () => {
    mockAdvisories = [advisory];
    await render(<FarmerAdvisoryCard />);
    await fireEvent.press(screen.getByTestId('farmer-care.advisories.refresh'));
    expect(mockSyncNow).toHaveBeenCalledWith({ refreshAdvisories: true, forceAdvisories: true });
  });

  it('switches language with the farmer\'s choice', async () => {
    mockLanguage = 'en';
    mockAdvisories = [advisory];
    await render(<FarmerAdvisoryCard />);
    expect(screen.getByText('Smut reminder')).toBeTruthy();
    expect(screen.getByTestId('farmer-care.advisory.adv-1.dates')).toHaveTextContent(
      FARMER_COPY.en.care.advisories.dates(formatDate(advisory.publishedAt), formatDate(advisory.expiresAt)),
    );
  });

  it('asks for a home barangay when there is no guidance and none is set', async () => {
    mockHome = { barangay: null, loaded: true };
    await render(<FarmerAdvisoryCard />);
    expect(screen.getByText(FARMER_COPY.tl.care.advisories.setBarangay)).toBeTruthy();
    await fireEvent.press(screen.getByText(FARMER_COPY.tl.care.advisories.setBarangayAction));
    expect(router.push).toHaveBeenCalledWith('/settings');
  });

  it('stays out of the way when there is nothing to say', async () => {
    await render(<FarmerAdvisoryCard />);
    expect(screen.queryByTestId('farmer-care.advisories')).toBeNull();
    expect(screen.queryByTestId('farmer-care.advisories.set-barangay')).toBeNull();
  });

  it('shows nothing until the barangay has loaded', async () => {
    mockHome = { barangay: null, loaded: false };
    await render(<FarmerAdvisoryCard />);
    expect(screen.queryByTestId('farmer-care.advisories.set-barangay')).toBeNull();
  });
});
