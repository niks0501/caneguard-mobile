import type { MobileUser } from './types';

/**
 * The server grants inspector authoring (reports, assignments, surveys) by
 * pilot-district membership and reports it as `capabilities` on /mobile/auth/me.
 * A role alone is not enough; a missing or empty list means no authoring.
 */
export const REPORT_SUBMIT_CAPABILITY = 'report:submit';
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

export function canCompleteFieldValidation(
  user: Pick<MobileUser, 'capabilities' | 'role'> | null | undefined,
): boolean {
  return (
    user?.role === 'field_reporter' &&
    hasCapability(user, ASSIGNMENT_COMPLETE_CAPABILITY)
  );
}

/** Keeps only string capabilities; anything malformed grants nothing. */
export function normalizeCapabilities(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}
