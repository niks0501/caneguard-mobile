import type { ScanSessionAction, ScanSessionState } from '@/features/detection/types';

/**
 * Session action for "Retake Photo" on a result.
 *
 * Seam for the Check Again follow-up link: once the Check Again lane
 * (`followUpOf`, `START_FOLLOW_UP`) is on main, return
 * `{ type: 'START_FOLLOW_UP', payload: { scanId: state.followUpOf } }` when the
 * session is an unsaved follow-up, so a retake stays a follow-up. Until then a
 * retake always starts a clean session.
 */
export function getRetakeAction(_state: ScanSessionState): ScanSessionAction {
  return { type: 'RESET_SCAN' };
}
