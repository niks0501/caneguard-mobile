import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import { FARMER_COPY } from '@/constants/copy';
import { AskOfficeSheet } from '@/features/farmer-care/components/AskOfficeSheet';
import { enqueueFarmerInquiry } from '@/features/farmer-care/data/farmerCareRepository';

const mockSyncNow = jest.fn();
const mockSaveBarangay = jest.fn();
let mockHome: { barangay: string | null; loaded: boolean; unsupported: boolean } = {
  barangay: 'Aga',
  loaded: true,
  unsupported: false,
};
const mockShowToast = jest.fn();

jest.mock('expo-crypto', () => ({ randomUUID: () => 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }));
jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
  useLocalSearchParams: () => ({ scanId: 'scan-1' }),
}));
jest.mock('@/database/DatabaseProvider', () => ({ useCaneGuardDatabase: () => ({}) }));
jest.mock('@/components/ui/Toast', () => ({ useToast: () => ({ showToast: mockShowToast }) }));
jest.mock('@/providers/LanguagePreferenceProvider', () => ({
  useFarmerCopy: () => jest.requireActual('@/constants/copy').FARMER_COPY.tl,
}));
jest.mock('@/features/records/hooks/useRecords', () => ({
  useScanRecordDetails: () => ({ data: { id: 'scan-1', predictedLabel: 'smut', confidence: 0.914 } }),
}));
jest.mock('@/features/farmer-care/hooks/useFarmerCare', () => ({
  isSupportedFarmerBarangay: (value: string | null) =>
    value !== null &&
    (jest.requireActual('@/features/reports/referenceData/nasugbuSeed').NASUGBU_BARANGAYS as string[]).includes(value),
  useFarmerCare: () => ({ isFarmer: true, ownerIdentity: 'owner-1', syncNow: mockSyncNow }),
  useHomeBarangay: () => ({ ...mockHome, save: mockSaveBarangay }),
}));
jest.mock('@/features/farmer-care/data/farmerCareRepository', () => ({ enqueueFarmerInquiry: jest.fn() }));

const copy = FARMER_COPY.tl.care.ask;

describe('AskOfficeSheet', () => {
  beforeEach(() => {
    mockHome = { barangay: 'Aga', loaded: true, unsupported: false };
    mockSyncNow.mockReset().mockResolvedValue({ sent: 0 });
    mockSaveBarangay.mockReset().mockResolvedValue('saved');
    mockShowToast.mockReset();
    jest.mocked(router.back).mockClear();
    jest.mocked(enqueueFarmerInquiry).mockReset().mockReturnValue({ item: {} as never, created: true });
  });

  it('reassures first and pre-selects the home barangay so a question takes two taps', async () => {
    await render(<AskOfficeSheet />);
    expect(screen.getByText(copy.reassurance)).toBeTruthy();
    expect(screen.getByText(copy.willSee)).toBeTruthy();
    expect(screen.getByTestId('ask-office.barangay')).toHaveTextContent('Aga');

    await fireEvent.press(screen.getByTestId('ask-office.concern.spreading'));
    await fireEvent.press(screen.getByTestId('ask-office.submit'));

    await waitFor(() => expect(enqueueFarmerInquiry).toHaveBeenCalledTimes(1));
    expect(enqueueFarmerInquiry).toHaveBeenCalledWith({}, expect.objectContaining({
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      ownerIdentity: 'owner-1',
      scanRecordId: 'scan-1',
      barangay: 'Aga',
      concern: 'spreading',
      aiLabel: 'smut',
      aiConfidencePercent: 91,
      landmark: null,
    }));
    expect(mockSyncNow).toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith(copy.saved, 'success');
    expect(router.back).toHaveBeenCalled();
  });

  it('says it was sent when the office already has it', async () => {
    mockSyncNow.mockResolvedValue({ sent: 1 });
    await render(<AskOfficeSheet />);
    await fireEvent.press(screen.getByTestId('ask-office.submit'));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith(copy.sentNow, 'success'));
  });

  it('does not send until a barangay is known, and says why in plain words', async () => {
    mockHome = { barangay: null, loaded: true, unsupported: false };
    await render(<AskOfficeSheet />);
    expect(screen.getByText(copy.barangayNeeded)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('ask-office.submit'));
    expect(enqueueFarmerInquiry).not.toHaveBeenCalled();
  });

  it('awaits home barangay save before syncing and refreshes advisories without racing', async () => {
    const order: string[] = [];
    mockHome = { barangay: null, loaded: true, unsupported: false };
    mockSaveBarangay.mockImplementation(async () => {
      order.push('save:start');
      await Promise.resolve();
      order.push('save:done');
      return 'saved';
    });
    mockSyncNow.mockImplementation(async () => {
      order.push('sync:start');
      return { sent: 1 };
    });

    await render(<AskOfficeSheet />);
    await fireEvent.press(screen.getByTestId('ask-office.barangay'));
    await fireEvent.press(screen.getByText('Aga'));
    await fireEvent.press(screen.getByTestId('ask-office.submit'));

    await waitFor(() => expect(mockSyncNow).toHaveBeenCalledWith({ refreshAdvisories: true, forceAdvisories: true }));
    expect(mockSaveBarangay).toHaveBeenCalledWith('Aga', { syncAfter: false });
    expect(order).toEqual(['save:start', 'save:done', 'sync:start']);
  });

  it('prevents custom unsupported barangay entries and blocks submitting legacy unsupported values', async () => {
    mockHome = { barangay: 'Atlantis', loaded: true, unsupported: true };
    await render(<AskOfficeSheet />);
    expect(screen.getByText(copy.barangayUnsupported)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('ask-office.submit'));
    expect(enqueueFarmerInquiry).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByTestId('ask-office.barangay'));
    await fireEvent.changeText(screen.getByTestId('ask-office.barangay-search'), 'Atlantis');
    expect(screen.queryByTestId('ask-office.barangay-custom-option')).toBeNull();
    expect(screen.queryByTestId('ask-office.barangay-keep-current')).toBeNull();
  });

  it('keeps the sheet open with a calm message when the request cannot be saved on the phone', async () => {
    jest.mocked(enqueueFarmerInquiry).mockImplementation(() => {
      throw new Error('disk full');
    });
    await render(<AskOfficeSheet />);
    await fireEvent.press(screen.getByTestId('ask-office.submit'));
    expect(await screen.findByText(copy.saveFailed)).toBeTruthy();
    expect(router.back).not.toHaveBeenCalled();
  });
});
