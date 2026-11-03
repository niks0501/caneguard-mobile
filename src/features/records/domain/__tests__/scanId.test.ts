import { getScanCardId } from '@/features/records/domain/scanId';

// Worked examples for 32-bit FNV-1a over the UUID's ASCII characters (offset
// basis 0x811c9dc5, prime 0x01000193), reduced modulo 1,000,000 and padded to
// six digits. They pin the documented public mapping so an ID already shown to
// a farmer or read out to the office does not drift between app versions.
const SCAN_UUID = '3f2b8c1e-aaaa-4bbb-8ccc-123456789abc';
const OTHER_SCAN_UUID = '9d1c7a52-bbbb-4ccc-8ddd-abcdef123456';

describe('getScanCardId', () => {
  // Proves: the scan ID has the CG-P- plus six digits format.
  it('formats as CG-P- followed by six digits', () => {
    for (const uuid of [SCAN_UUID, '', '00000000-0000-0000-0000-000000000000']) {
      expect(getScanCardId(uuid)).toMatch(/^CG-P-\d{6}$/);
    }
  });

  // Proves: the ID is derived from the scan UUID by the documented FNV-1a mapping, not from randomness or time.
  it('derives the documented CG-P- value from each scan UUID', () => {
    expect(getScanCardId(SCAN_UUID)).toBe('CG-P-327685');
    expect(getScanCardId(OTHER_SCAN_UUID)).toBe('CG-P-075656');
  });
});
