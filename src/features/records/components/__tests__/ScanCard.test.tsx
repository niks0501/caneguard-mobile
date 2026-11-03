import { render, screen } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ReactElement } from 'react';

import { LANGUAGE_STORAGE_KEY, LanguagePreferenceProvider } from '@/providers/LanguagePreferenceProvider';
import { ScanCard } from '@/features/records/components/ScanCard';

const record = {
  createdAt: '2026-11-03T08:00:00.000Z',
  id: '3f2b8c1e-aaaa-4bbb-8ccc-123456789abc',
  managedImageUri: 'file:///managed/scan.jpg',
  predictedLabel: 'smut',
};

jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ user: { role: 'farmer', uuid: 'user-1' } }),
}));

const renderCard = async (ui: ReactElement) =>
  render(<LanguagePreferenceProvider>{ui}</LanguagePreferenceProvider>);

describe('ScanCard', () => {
  let fetchSpy: jest.Mock;
  beforeEach(async () => {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
    fetchSpy = jest.fn();
    (globalThis as { fetch: unknown }).fetch = fetchSpy;
  });

  // Proves: card fields (photo, date, Possible Condition, note, ID) come from the local record alone, with no network call.
  it('renders every field from the local record without touching the network', async () => {
    await renderCard(<ScanCard record={{ ...record, personalNote: 'Seen after rain' }} />);

    expect(screen.getByTestId('scan.card.photo')).toBeOnTheScreen();
    expect(screen.getByTestId('scan.card.date')).toBeOnTheScreen();
    expect(screen.getByTestId('scan.card.condition')).toHaveTextContent('Possible Condition: Smut');
    expect(screen.getByTestId('scan.card.note')).toHaveTextContent('Seen after rain');
    expect(screen.getByTestId('scan.card.id')).toHaveTextContent(/CG-P-\d{6}/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  // Proves: the card stays clean (no empty note block) when the record carries no note.
  it('omits the note when the record has none', async () => {
    await renderCard(<ScanCard record={record} />);
    expect(screen.queryByTestId('scan.card.note')).not.toBeOnTheScreen();
    expect(screen.getByTestId('scan.card')).toBeOnTheScreen();
  });
});
