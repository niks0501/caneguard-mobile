import { StorageError } from '@/database/errors';

/**
 * Rows written before owner scoping was introduced are deliberately kept in a
 * quarantine partition. They must never be implicitly assigned to whichever
 * account signs in next, including an account whose malformed identity happens
 * to match the quarantine marker.
 */
export const LEGACY_UNASSIGNED_OWNER_IDENTITY = '__legacy_unassigned__';

const OWNER_IDENTITY_PATTERN = /^[A-Za-z0-9._-]{1,128}$/;

export function isSafeOwnerIdentity(value: string): boolean {
  return (
    OWNER_IDENTITY_PATTERN.test(value) &&
    value !== '.' &&
    value !== '..' &&
    value !== LEGACY_UNASSIGNED_OWNER_IDENTITY
  );
}

export function requireOwnerIdentity(value: string): string {
  const normalized = value.trim();
  if (!isSafeOwnerIdentity(normalized)) {
    throw new StorageError(
      'UPDATE_FAILED',
      'The authenticated owner identity is invalid.',
    );
  }
  return normalized;
}

export function isLegacyUnassignedOwnerIdentity(value: string | null | undefined): boolean {
  return value === LEGACY_UNASSIGNED_OWNER_IDENTITY;
}
