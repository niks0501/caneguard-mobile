import { fireEvent, render, screen } from '@testing-library/react-native';

import { FARMER_COPY } from '@/constants/copy';
import { HomeBarangayRow } from '@/features/farmer-care/components/HomeBarangayRow';

const mockShowToast = jest.fn();
const mockSave = jest.fn();
let mockHome: {
  barangay: string | null;
  pushPending: boolean;
  loaded: boolean;
  unsupported: boolean;
} = {
  barangay: 'Aga',
  pushPending: false,
  loaded: true,
  unsupported: false,
};

jest.mock('@/components/ui/Toast', () => ({ useToast: () => ({ showToast: mockShowToast }) }));
jest.mock('@/providers/LanguagePreferenceProvider', () => ({
  useFarmerCopy: () => jest.requireActual('@/constants/copy').FARMER_COPY.en,
}));
jest.mock('@/features/farmer-care/hooks/useFarmerCare', () => ({
  useHomeBarangay: () => ({ ...mockHome, save: mockSave }),
}));

const copy = FARMER_COPY.en.care.settings;

describe('HomeBarangayRow', () => {
  beforeEach(() => {
    mockHome = { barangay: 'Aga', pushPending: false, loaded: true, unsupported: false };
    mockShowToast.mockReset();
    mockSave.mockReset().mockResolvedValue('saved');
  });

  it('shows a pending sync indicator when the home barangay was saved offline (UX-M3)', async () => {
    mockHome = { barangay: 'Aga', pushPending: true, loaded: true, unsupported: false };
    await render(<HomeBarangayRow />);
    expect(screen.getByTestId('settings.home-barangay.pending')).toHaveTextContent(copy.homeBarangayPendingSync);
    expect(screen.queryByTestId('settings.home-barangay.unsupported')).toBeNull();
  });

  it('shows a clear recovery message when a legacy unsupported barangay is stored and disallows custom entries (CG-09, UX-M3)', async () => {
    mockHome = { barangay: 'Poblacion Old', pushPending: false, loaded: true, unsupported: true };
    await render(<HomeBarangayRow />);
    expect(screen.getByTestId('settings.home-barangay.unsupported')).toHaveTextContent(copy.homeBarangayUnsupported);

    await fireEvent.press(screen.getByTestId('settings.home-barangay.picker'));
    await fireEvent.changeText(screen.getByTestId('settings.home-barangay.picker-search'), 'Atlantis');
    expect(screen.queryByTestId('settings.home-barangay.picker-custom-option')).toBeNull();
    expect(screen.queryByTestId('settings.home-barangay.picker-keep-current')).toBeNull();
  });
});
