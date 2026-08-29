import {
  POSSIBLE_MATCH_RECENCY_WINDOW_MS,
  selectConservativePossibleRecentMatch,
  type PossibleMatchLookupInput,
  type RecentFieldReportMatchCandidate,
} from '@/features/reports/domain/possibleMatch';

const CURRENT_OBSERVED_AT = '2026-08-10T12:00:00.000Z';

function input(overrides: Partial<PossibleMatchLookupInput> = {}): PossibleMatchLookupInput {
  return {
    barangay: 'Wawa',
    finalLatitude: 14.0667,
    finalLongitude: 120.6319,
    farmerOrFarmOwnerName: 'Maria Santos Farm',
    locationSource: 'gps',
    municipality: 'Nasugbu',
    observedAt: CURRENT_OBSERVED_AT,
    predictedLabel: 'rust',
    province: 'Batangas',
    reportId: '7ea3e6f0-b893-4fd3-b414-0b797e62ec8e',
    scanRecordId: '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2',
    ...overrides,
  };
}

function candidate(
  overrides: Partial<RecentFieldReportMatchCandidate> = {},
): RecentFieldReportMatchCandidate {
  return {
    barangay: 'Wawa',
    finalLatitude: 14.0667,
    finalLongitude: 120.6319,
    farmerOrFarmOwnerName: 'Maria Santos Farm',
    locationSource: 'gps',
    municipality: 'Nasugbu',
    observedAt: '2026-08-09T12:00:00.000Z',
    predictedLabel: 'rust',
    province: 'Batangas',
    reportId: '51214146-7439-48e0-aef4-d0e003f194b4',
    scanRecordId: '6f80a15d-3f9f-4e0a-bf79-7cf2c37e2fa1',
    ...overrides,
  };
}

describe('selectConservativePossibleRecentMatch', () => {
  it('selects a recent candidate only when the independent signals agree', () => {
    expect(
      selectConservativePossibleRecentMatch(input(), [candidate()]),
    ).toMatchObject({
      reportId: '51214146-7439-48e0-aef4-d0e003f194b4',
      predictedLabel: 'rust',
      distanceMeters: 0,
    });
  });

  it('keeps a same-location and same-condition report separate when the farm reference differs', () => {
    expect(
      selectConservativePossibleRecentMatch(input(), [
        candidate({ farmerOrFarmOwnerName: 'North Block Farm 12' }),
      ]),
    ).toBeNull();
  });

  it('does not warn for the same farm and condition outside the recent window', () => {
    expect(
      selectConservativePossibleRecentMatch(input(), [
        candidate({
          observedAt: new Date(
            Date.parse(CURRENT_OBSERVED_AT) - POSSIBLE_MATCH_RECENCY_WINDOW_MS - 1,
          ).toISOString(),
        }),
      ]),
    ).toBeNull();
  });

  it('does not warn for a nearby report beyond the conservative distance threshold', () => {
    expect(
      selectConservativePossibleRecentMatch(input(), [
        candidate({ finalLatitude: 14.0685 }),
      ]),
    ).toBeNull();
  });

  it('does not compare a report with itself', () => {
    expect(
      selectConservativePossibleRecentMatch(input(), [
        candidate({
          reportId: input().reportId,
          scanRecordId: input().scanRecordId,
        }),
      ]),
    ).toBeNull();
  });
});
