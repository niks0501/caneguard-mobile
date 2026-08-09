import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';

import FieldReportScreen from '@/app/field-report';
import type { FieldReport } from '@/features/reports/domain/fieldReportTypes';

const SCAN_ID = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2';
const REPORT_ID = '7ea3e6f0-b893-4fd3-b414-0b797e62ec8e';
const mockSave = jest.fn(async () => null);
const mockRefresh = jest.fn(async () => undefined);
let mockDraftState: {
  data: FieldReport | null;
  errorMessage: string | null;
  loading: boolean;
  refresh: typeof mockRefresh;
  save: typeof mockSave;
  saved: boolean;
  saving: boolean;
};

jest.mock('@/features/reports/hooks/useFieldReportDraft', () => ({
  useFieldReportDraft: () => mockDraftState,
}));

const mockUseLocalSearchParams = jest.mocked(useLocalSearchParams);

function draft(overrides: Partial<FieldReport> = {}): FieldReport {
  return {
    id: REPORT_ID,
    scanRecordId: SCAN_ID,
    authoringState: 'draft',
    farmerOrFarmOwnerName: null,
    province: 'Batangas',
    municipality: 'Nasugbu',
    barangay: null,
    finalLatitude: null,
    finalLongitude: null,
    locationSource: null,
    gpsAccuracy: null,
    observedAt: '2026-07-25T05:30:00.000Z',
    submittedAt: null,
    syncStatus: 'local_only',
    createdAt: '2026-08-10T01:00:00.000Z',
    updatedAt: '2026-08-10T01:00:00.000Z',
    ...overrides,
  };
}

describe('FieldReportScreen', () => {
  beforeEach(() => {
    mockUseLocalSearchParams.mockReturnValue({ scanRecordId: SCAN_ID });
    mockDraftState = {
      data: draft(),
      errorMessage: null,
      loading: false,
      refresh: mockRefresh,
      save: mockSave,
      saved: false,
      saving: false,
    };
  });

  it('saves incomplete report values as a local Draft', async () => {
    await render(<FieldReportScreen />);

    await act(async () => undefined);

    expect(screen.getByText('Draft')).toBeOnTheScreen();
    expect(
      screen.getByText(/Drafts are stored only on this device and are not queued/),
    ).toBeOnTheScreen();
    expect(screen.getByText('Nasugbu, Batangas')).toBeOnTheScreen();

    await act(async () => {
      fireEvent.changeText(
        screen.getByTestId('field-report.farmer-name-input'),
        'Maria Santos',
      );
    });
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Save Field Report draft'));
    });

    expect(mockSave).toHaveBeenCalledWith({
      farmerOrFarmOwnerName: 'Maria Santos',
      barangay: '',
    });
  });

  it('reopens persisted partial values under the same report identity', async () => {
    mockDraftState = {
      ...mockDraftState,
      data: draft({
        farmerOrFarmOwnerName: 'Maria Santos',
        updatedAt: '2026-08-10T01:05:00.000Z',
      }),
      saved: true,
    };

    await render(<FieldReportScreen />);

    await act(async () => undefined);

    expect(screen.getByTestId('field-report.farmer-name-input')).toHaveProp(
      'value',
      'Maria Santos',
    );
    expect(screen.getByText(`Report ID: ${REPORT_ID}`)).toBeOnTheScreen();
    expect(screen.getByTestId('field-report.saved')).toHaveTextContent(
      'Draft saved on this device.',
    );
  });
});
