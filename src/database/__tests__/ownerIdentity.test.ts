import {
  isSafeOwnerIdentity,
  requireOwnerIdentity,
} from '@/database/ownerIdentity';

describe('owner identity boundaries', () => {
  it('rejects path traversal identity components', () => {
    expect(isSafeOwnerIdentity('.')).toBe(false);
    expect(isSafeOwnerIdentity('..')).toBe(false);
    expect(isSafeOwnerIdentity('__legacy_unassigned__')).toBe(false);
    expect(() => requireOwnerIdentity('..')).toThrow(/owner identity is invalid/i);
    expect(() => requireOwnerIdentity('__legacy_unassigned__')).toThrow(/owner identity is invalid/i);
  });

  it('normalizes safe identity whitespace', () => {
    expect(requireOwnerIdentity(' user-uuid ')).toBe('user-uuid');
  });
});
