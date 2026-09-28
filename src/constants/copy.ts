/**
 * Single source of truth for canonical user-facing copy strings.
 */

export const DECISION_SUPPORT_DISCLAIMER =
  'This result is for decision support only. It does not confirm a disease.';

export const CASE_CLOSE_NOTICE =
  'Completing this visit saves your field findings. It does not verify or close the case.';

export const LOCATION_ADDED = 'Location added';

export const LOCATION_UNCONFIRMED = 'Location could not be confirmed';

/** Floating office-updates pill on Home. */
export function officeUpdatesPillLabel(count: number): string {
  return `${count} office ${count === 1 ? 'update' : 'updates'}`;
}

export const OFFICE_UPDATES_OPEN_LABEL = 'Open office updates';

export const OFFICE_UPDATES_DISMISS_LABEL = 'Hide office updates for now';

/** Floating office-updates panel. */
export const OFFICE_UPDATES_PANEL_CLOSE_LABEL = 'Close office updates';

export const OFFICE_UPDATES_MARKED_READ = 'Updates marked as read';

/** Activity tab, with the unread count when there is one. */
export function activityTabLabel(count: number): string {
  return count > 0 ? `Activity, ${officeUpdatesPillLabel(count)} unread` : 'Activity';
}
