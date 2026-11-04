import { fireEvent, render, screen } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ReactElement } from 'react';

import { FARMER_COPY } from '@/constants/copy';
import { LANGUAGE_STORAGE_KEY, LanguagePreferenceProvider } from '@/providers/LanguagePreferenceProvider';
import { SavedScanCard, ScanCard, type ScanCardRecord } from '@/features/records/components/ScanCard';

const savedScanRecord = {
  createdAt: '2026-11-03T08:00:00.000Z',
  id: '3f2b8c1e-aaaa-4bbb-8ccc-123456789abc',
  managedImageUri: 'file:///managed/scan.jpg',
  predictedLabel: 'smut',
};

const savedScanRecordWithNote = {
  ...savedScanRecord,
  personalNote: 'Seen after rain',
};

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

let mockDetailsState: {
  data: ScanCardRecord | null;
  errorMessage: string | null;
  loading: boolean;
  refresh: jest.Mock;
};

jest.mock('@/features/records/hooks/useRecords', () => ({
  useScanRecordDetails: () => mockDetailsState,
}));

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
  it('renders every field from a present-note record without touching the network', async () => {
    await renderCard(<ScanCard record={savedScanRecordWithNote} />);

    expect(screen.getByTestId('scan.card.photo')).toBeOnTheScreen();
    expect(screen.getByTestId('scan.card.date')).toBeOnTheScreen();
    expect(screen.getByTestId('scan.card.condition')).toHaveTextContent('Possible Condition: Smut');
    expect(screen.getByTestId('scan.card.note')).toHaveTextContent('Seen after rain');
    expect(screen.getByTestId('scan.card.id')).toHaveTextContent(/CG-P-\d{6}/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  // Proposal - proves "card shows exactly the agreed fields": photo, condition, AI-only line, date, place, note, scan ID, footer; no Check Again history.
  it('shows exactly the agreed fields, including the AI-only line and footer', async () => {
    await renderCard(
      <ScanCard record={{ ...savedScanRecordWithNote, personalPlace: 'North field' }} />,
    );
    const copy = FARMER_COPY.en.scanCard;

    expect(screen.getByTestId('scan.card.photo')).toBeOnTheScreen();
    expect(screen.getByTestId('scan.card.condition')).toHaveTextContent('Possible Condition: Smut');
    expect(screen.getByTestId('scan.card.ai-line')).toHaveTextContent(copy.aiOnlyLine);
    expect(screen.getByTestId('scan.card.date')).toBeOnTheScreen();
    expect(screen.getByTestId('scan.card.place')).toHaveTextContent('Place: North field');
    expect(screen.getByTestId('scan.card.note')).toHaveTextContent('Seen after rain');
    expect(screen.getByTestId('scan.card.id')).toBeOnTheScreen();
    expect(screen.getByTestId('scan.card.footer')).toHaveTextContent(copy.footer);
    expect(screen.queryByText(/check again|follow-up/i)).not.toBeOnTheScreen();
  });

  // Proposal - proves "an empty place is omitted": blank or whitespace place renders no place row.
  it('omits the place when it is empty or blank', async () => {
    await renderCard(<ScanCard record={{ ...savedScanRecord, personalPlace: '   ' }} />);
    expect(screen.queryByTestId('scan.card.place')).not.toBeOnTheScreen();
    expect(screen.getByTestId('scan.card.footer')).toBeOnTheScreen();
  });

  // Proposal - proves "no GPS or location API is touched": rendering the card never calls expo-location.
  it('never touches a location API', async () => {
    const Location = jest.requireMock('expo-location') as Record<string, jest.Mock>;
    await renderCard(<ScanCard record={{ ...savedScanRecord, personalPlace: 'Near the mill' }} />);
    for (const fn of Object.values(Location)) {
      if (typeof fn === 'function' && 'mock' in fn) expect(fn).not.toHaveBeenCalled();
    }
  });

  // Proposal - proves tl/en key parity for the new scanCard copy.
  it('keeps en and tl scanCard keys in parity', () => {
    expect(Object.keys(FARMER_COPY.tl.scanCard).sort()).toEqual(
      Object.keys(FARMER_COPY.en.scanCard).sort(),
    );
  });

  // Proves: the card stays clean (no empty note block) when the record carries no note.
  it('omits the note when the saved record has none', async () => {
    await renderCard(<ScanCard record={savedScanRecord} />);
    expect(screen.queryByTestId('scan.card.note')).not.toBeOnTheScreen();
    expect(screen.getByTestId('scan.card')).toBeOnTheScreen();
  });
});

describe('SavedScanCard', () => {
  beforeEach(async () => {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
  });

  // Proves: the loading text is shown only while the local read is in flight.
  it('shows the loading text while the local record read is in flight', async () => {
    mockDetailsState = { data: null, errorMessage: null, loading: true, refresh: jest.fn() };
    await renderCard(<SavedScanCard recordId={savedScanRecord.id} />);

    expect(screen.getByTestId('scan.card.loading')).toHaveTextContent(FARMER_COPY.en.scanCard.loading);
    expect(screen.queryByTestId('scan.card.error')).not.toBeOnTheScreen();
  });

  // Proves: a terminal local read failure stops the loading text and offers a local retry.
  it('shows the farmer retry message and retries the local read after a failed read', async () => {
    mockDetailsState = {
      data: null,
      errorMessage: 'Reading a scan record failed.',
      loading: false,
      refresh: jest.fn(),
    };
    await renderCard(<SavedScanCard recordId={savedScanRecord.id} />);

    expect(screen.queryByTestId('scan.card.loading')).not.toBeOnTheScreen();
    expect(screen.getByTestId('scan.card.error')).toBeOnTheScreen();
    expect(screen.getByTestId('scan.card.error-message')).toHaveTextContent(
      FARMER_COPY.en.scanCard.loadError,
    );

    fireEvent.press(screen.getByTestId('scan.card.retry'));

    expect(mockDetailsState.refresh).toHaveBeenCalledTimes(1);
  });

  // Proves: a saved record that is no longer on the device is reported instead of loading forever.
  it('reports a missing record instead of loading forever', async () => {
    mockDetailsState = { data: null, errorMessage: null, loading: false, refresh: jest.fn() };
    await renderCard(<SavedScanCard recordId={savedScanRecord.id} />);

    expect(screen.queryByTestId('scan.card.loading')).not.toBeOnTheScreen();
    expect(screen.getByTestId('scan.card.error-message')).toHaveTextContent(
      FARMER_COPY.en.scanCard.loadError,
    );
  });

  // Proves: the loaded record renders through the card once the local read resolves.
  it('renders the loaded record', async () => {
    mockDetailsState = {
      data: savedScanRecord,
      errorMessage: null,
      loading: false,
      refresh: jest.fn(),
    };
    await renderCard(<SavedScanCard recordId={savedScanRecord.id} />);

    expect(screen.getByTestId('scan.card.id')).toHaveTextContent(/CG-P-\d{6}/);
  });
});
