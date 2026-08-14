import type { LocationReferenceData } from '@/features/reports/referenceData/referenceDataTypes';

/**
 * Seeded offline fallback for the region and barangay reference lists
 * (decisions D2/D3).
 *
 * Used until the backend reference endpoint exists and whenever the device is
 * offline. The backend list, when it arrives, replaces this snapshot entirely.
 *
 * Source: PSGC barangay names for Nasugbu, Batangas (42 barangays, retrieved
 * from Wikipedia's PH brgy table on 2026-08-13). Order is alphabetical for
 * stable picker rendering.
 */
export const NASUGBU_BARANGAYS: string[] = [
  'Aga',
  'Balaytigui',
  'Banilad',
  'Barangay 1 (Poblacion)',
  'Barangay 10 (Poblacion)',
  'Barangay 11 (Poblacion)',
  'Barangay 12 (Poblacion)',
  'Barangay 2 (Poblacion)',
  'Barangay 3 (Poblacion)',
  'Barangay 4 (Poblacion)',
  'Barangay 5 (Poblacion)',
  'Barangay 6 (Poblacion)',
  'Barangay 7 (Poblacion)',
  'Barangay 8 (Poblacion)',
  'Barangay 9 (Poblacion)',
  'Bilaran',
  'Bucana',
  'Bulihan',
  'Bunducan',
  'Butucan',
  'Calayo',
  'Catandaan',
  'Cogunan',
  'Dayap',
  'Kaylaway',
  'Kayrilaw',
  'Latag',
  'Looc',
  'Lumbangan',
  'Malapad na Bato',
  'Mataas na Pulo',
  'Maugat',
  'Munting Indan',
  'Natipuan',
  'Pantalan',
  'Papaya',
  'Putat',
  'Reparo',
  'Talangan',
  'Tumalim',
  'Utod',
  'Wawa',
];

export const SEED_LOCATION_REFERENCE_DATA: LocationReferenceData = {
  version: 'seed-nasugbu-2026-08-13',
  etag: null,
  regions: [
    {
      province: 'Batangas',
      municipalities: ['Nasugbu'],
    },
  ],
  barangays: NASUGBU_BARANGAYS,
  fetchedAt: new Date(0).toISOString(),
};

/** Default region used when seeding a brand-new Field Report draft. */
export const SEED_DEFAULT_REGION = {
  province: 'Batangas',
  municipality: 'Nasugbu',
};
