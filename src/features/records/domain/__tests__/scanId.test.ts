import { getScanCardId } from '@/features/records/domain/scanId';

describe('getScanCardId', () => {
  // Proves: the scan ID has the CG-P- plus six digits format.
  it('formats as CG-P- followed by six digits', () => {
    for (const uuid of ['3f2b8c1e-aaaa-4bbb-8ccc-123456789abc', '', '00000000-0000-0000-0000-000000000000']) {
      expect(getScanCardId(uuid)).toMatch(/^CG-P-\d{6}$/);
    }
  });

  // Proves: the scan ID is stable for the same scan UUID and differs across scans.
  it('is stable for the same UUID and varies between UUIDs', () => {
    const a = '3f2b8c1e-aaaa-4bbb-8ccc-123456789abc';
    expect(getScanCardId(a)).toBe(getScanCardId(a));
    expect(getScanCardId(a)).not.toBe(getScanCardId('9d1c7a52-bbbb-4ccc-8ddd-abcdef123456'));
  });
});
