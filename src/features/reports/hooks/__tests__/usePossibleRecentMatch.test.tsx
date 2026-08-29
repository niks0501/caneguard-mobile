import { renderHook, waitFor } from '@testing-library/react-native';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { findPossibleRecentMatch } from '@/features/reports/data/possibleMatchRepository';
import type {
  PossibleMatchLookupInput,
  PossibleRecentMatch,
} from '@/features/reports/domain/possibleMatch';
import { usePossibleRecentMatch } from '@/features/reports/hooks/usePossibleRecentMatch';

const DATABASE = {};
const SUBMITTER_ID = 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17';

jest.mock('@/database/DatabaseProvider', () => ({
  useCaneGuardDatabase: () => DATABASE,
}));
jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));
jest.mock('@/features/reports/data/possibleMatchRepository', () => ({
  findPossibleRecentMatch: jest.fn(),
}));

const mockUseAuth = jest.mocked(useAuth);
const mockFindPossibleRecentMatch = jest.mocked(findPossibleRecentMatch);

const input: PossibleMatchLookupInput = {
  barangay: 'Wawa',
  finalLatitude: 14.0667,
  finalLongitude: 120.6319,
  farmerOrFarmOwnerName: 'Maria Santos Farm',
  locationSource: 'gps',
  municipality: 'Nasugbu',
  observedAt: '2026-08-10T12:00:00.000Z',
  predictedLabel: 'rust',
  province: 'Batangas',
  reportId: '7ea3e6f0-b893-4fd3-b414-0b797e62ec8e',
  scanRecordId: '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2',
};

const match: PossibleRecentMatch = {
  barangay: 'Wawa',
  distanceMeters: 10,
  farmerOrFarmOwnerName: 'Maria Santos Farm',
  finalLatitude: 14.0667,
  finalLongitude: 120.6319,
  locationSource: 'gps',
  municipality: 'Nasugbu',
  observedAt: '2026-08-09T12:00:00.000Z',
  predictedLabel: 'rust',
  province: 'Batangas',
  reportId: '51214146-7439-48e0-aef4-d0e003f194b4',
  scanRecordId: '6f80a15d-3f9f-4e0a-bf79-7cf2c37e2fa1',
};

describe('usePossibleRecentMatch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { uuid: SUBMITTER_ID, role: 'field_reporter' },
    } as never);
  });

  it('keeps the advisory lookup absent when there is no match', async () => {
    mockFindPossibleRecentMatch.mockResolvedValue(null);

    const { result } = await renderHook(() => usePossibleRecentMatch(input));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.match).toBeNull();
    expect(result.current.unavailable).toBe(false);
    expect(mockFindPossibleRecentMatch).toHaveBeenCalledWith(
      DATABASE,
      SUBMITTER_ID,
      input,
    );
  });

  it('swallows lookup errors as an unavailable advisory feature', async () => {
    mockFindPossibleRecentMatch.mockRejectedValue(new Error('database unavailable'));

    const { result } = await renderHook(() => usePossibleRecentMatch(input));

    await waitFor(() => expect(result.current.unavailable).toBe(true));
    expect(result.current.match).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('accepts the explicit lookup seam without changing the hook contract', async () => {
    const lookup = jest.fn(async () => match);

    const { result } = await renderHook(() => usePossibleRecentMatch(input, lookup));

    await waitFor(() => expect(result.current.match).toEqual(match));
    expect(lookup).toHaveBeenCalledWith(input);
    expect(mockFindPossibleRecentMatch).not.toHaveBeenCalled();
  });

  it('treats a malformed lookup result as unavailable instead of rendering it', async () => {
    const lookup = jest.fn(async () => ({ reportId: 'not-a-match' }) as unknown as PossibleRecentMatch);

    const { result } = await renderHook(() => usePossibleRecentMatch(input, lookup));

    await waitFor(() => expect(result.current.unavailable).toBe(true));
    expect(result.current.match).toBeNull();
  });
});
