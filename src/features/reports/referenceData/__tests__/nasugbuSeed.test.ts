import {
  NASUGBU_BARANGAYS,
  SEED_DEFAULT_REGION,
  SEED_LOCATION_REFERENCE_DATA,
} from '@/features/reports/referenceData/nasugbuSeed';

describe('seeded location reference data (D2/D3 offline fallback)', () => {
  it('lists Nasugbu’s 42 PSGC barangays with the known test values', () => {
    expect(NASUGBU_BARANGAYS).toHaveLength(42);
    expect(NASUGBU_BARANGAYS).toEqual(
      expect.arrayContaining(['Wawa', 'Lumbangan', 'Aga', 'Barangay 1 (Poblacion)']),
    );
  });

  it('seeds the Batangas/Nasugbu region and default draft region', () => {
    expect(SEED_LOCATION_REFERENCE_DATA.regions).toEqual([
      { province: 'Batangas', municipalities: ['Nasugbu'] },
    ]);
    expect(SEED_LOCATION_REFERENCE_DATA.barangays).toEqual(NASUGBU_BARANGAYS);
    expect(SEED_DEFAULT_REGION).toEqual({
      province: 'Batangas',
      municipality: 'Nasugbu',
    });
  });
});
