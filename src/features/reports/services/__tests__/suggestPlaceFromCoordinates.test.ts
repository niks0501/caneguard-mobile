import {
  matchPlaceToReferenceList,
  suggestPlaceFromCoordinates,
} from '@/features/reports/services/suggestPlaceFromCoordinates';

jest.mock('expo-location', () => ({ reverseGeocodeAsync: jest.fn() }));

const reference = {
  barangays: ['Wawa', 'Barangay 1 (Poblacion)'],
  regions: [{ province: 'Batangas', municipalities: ['Nasugbu', 'Lian'] }],
};

describe('matchPlaceToReferenceList', () => {
  it('suggests only names that exist in the saved place list', () => {
    expect(
      matchPlaceToReferenceList(
        [{ district: 'Brgy. Wawa', city: 'Nasugbu', region: 'Calabarzon' }],
        reference,
      ),
    ).toEqual({ barangay: 'Wawa', municipality: 'Nasugbu', province: 'Batangas' });
  });

  it('offers nothing when the barangay is not in the list', () => {
    expect(
      matchPlaceToReferenceList([{ district: 'Elsewhere', city: 'Nasugbu' }], reference),
    ).toBeNull();
  });

  it('offers nothing when the town is not in the list', () => {
    expect(
      matchPlaceToReferenceList([{ district: 'Wawa', city: 'Manila' }], reference),
    ).toBeNull();
  });
});

describe('suggestPlaceFromCoordinates', () => {
  it('returns no suggestion when the lookup fails', async () => {
    await expect(
      suggestPlaceFromCoordinates(14, 120, reference, async () => {
        throw new Error('offline');
      }),
    ).resolves.toBeNull();
  });
});
