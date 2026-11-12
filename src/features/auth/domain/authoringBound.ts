import type { AuthoringProvenance } from '@/features/auth/domain/sessionState';

/**
 * The authoring bound as a finish-point screen reads it: the provenance to
 * freeze onto the record, or `null` when the session may not finish work now.
 * `undefined` only when the auth value predates the session union (test doubles);
 * the real provider always answers.
 */
export function readAuthoringBound(auth: {
  getAuthoringProvenance?: () => AuthoringProvenance | null;
}): AuthoringProvenance | null | undefined {
  return typeof auth.getAuthoringProvenance === 'function'
    ? auth.getAuthoringProvenance()
    : undefined;
}
