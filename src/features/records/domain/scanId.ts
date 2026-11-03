/**
 * Farmer-facing scan ID: `CG-P-` plus six digits derived deterministically
 * from the scan UUID (FNV-1a hash), so it needs no stored column and is
 * stable for the same scan.
 */
export function getScanCardId(scanUuid: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < scanUuid.length; i += 1) {
    hash ^= scanUuid.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `CG-P-${String(hash % 1_000_000).padStart(6, '0')}`;
}
