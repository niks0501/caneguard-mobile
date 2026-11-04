import type { MobileUser } from './types';

/**
 * The server grants inspector authoring (reports, assignments, surveys) by
 * pilot-district membership and reports it as `capabilities` on /mobile/auth/me.
 * A role alone is not enough; a missing or empty list means no authoring.
 */
export const REPORT_SUBMIT_CAPABILITY = 'report:submit';
export const ASSIGNMENT_READ_CAPABILITY = 'assignment:read';
export const ASSIGNMENT_COMPLETE_CAPABILITY = 'assignment:complete';

export function hasCapability(
  user: Pick<MobileUser, 'capabilities'> | null | undefined,
  capability: string,
): boolean {
  return Boolean(user?.capabilities?.includes(capability));
}

export function canAuthorInspectorWork(
  user: Pick<MobileUser, 'capabilities' | 'role'> | null | undefined,
): boolean {
  return (
    user?.role === 'field_reporter' &&
    hasCapability(user, REPORT_SUBMIT_CAPABILITY)
  );
}

export function canReadFieldValidationAssignments(
  user: Pick<MobileUser, 'capabilities' | 'role'> | null | undefined,
): boolean {
  return (
    user?.role === 'field_reporter' &&
    hasCapability(user, ASSIGNMENT_READ_CAPABILITY)
  );
}

export function canCompleteFieldValidation(
  user: Pick<MobileUser, 'capabilities' | 'role'> | null | undefined,
): boolean {
  return (
    user?.role === 'field_reporter' &&
    hasCapability(user, ASSIGNMENT_COMPLETE_CAPABILITY)
  );
}

/** Only a fully well-formed list is usable; anything malformed grants nothing. */
export function normalizeCapabilities(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const capabilities = value.filter(
    (item): item is string => typeof item === 'string' && item.trim() !== '',
  );
  return capabilities.length === value.length ? capabilities : [];
}
