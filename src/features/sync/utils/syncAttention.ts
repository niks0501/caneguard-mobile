import { isAutoRetryableSyncErrorCode } from '@/features/sync/errors/syncErrors';

/**
 * Safe, non-sensitive explanation of a persisted sync failure. This keeps the
 * office-facing wording honest per failure class and never includes report
 * contents, photos, coordinates or credentials.
 */
export type SyncAttentionAction = 'automatic-retry' | 'sign-in' | 'support';

export interface SyncAttentionPresentation {
  action: SyncAttentionAction;
  actionLabel: string;
  reason: string;
  title: string;
}

export function getSyncAttention(
  code: string | null | undefined,
): SyncAttentionPresentation | null {
  if (typeof code !== 'string' || code.length === 0) {
    return null;
  }

  switch (code) {
    case 'NETWORK_UNAVAILABLE':
    case 'NETWORK_REQUEST_FAILED':
    case 'SERVER_ERROR':
      return {
        action: 'automatic-retry',
        actionLabel: 'Retry now',
        reason:
          'The connection or the office was unavailable. This report stays on this device and CaneGuard retries automatically.',
        title: 'Waiting to send',
      };
    case 'API_RATE_LIMITED':
      return {
        action: 'automatic-retry',
        actionLabel: 'Retry now',
        reason:
          'The office asked CaneGuard to wait before sending again. It retries automatically after a short pause.',
        title: 'Waiting to send',
      };
    case 'AUTH_REQUIRED':
      return {
        action: 'sign-in',
        actionLabel: 'Return home and sign in',
        reason:
          'The office session ended before this report could be sent. Sign in again, then send this same report.',
        title: 'Sign in to send',
      };
    case 'API_VALIDATION_FAILED':
      return {
        action: 'support',
        actionLabel: 'Contact support',
        reason:
          'The office rejected details in this report. Sending the identical report again cannot fix that, so ask the office to review it with your support reference.',
        title: 'Needs office attention',
      };
    case 'CLIENT_UUID_CONFLICT':
      return {
        action: 'support',
        actionLabel: 'Contact support',
        reason:
          'The office already knows this report reference with different saved details. CaneGuard will not create or re-key a copy; ask the office to reconcile it with your support reference.',
        title: 'Needs office attention',
      };
    case 'API_FORBIDDEN':
      return {
        action: 'support',
        actionLabel: 'Contact support',
        reason:
          'This account is not allowed to submit field reports. Ask the office to check the inspector account before sending again.',
        title: 'Account needs attention',
      };
    case 'IMAGE_MISSING':
      return {
        action: 'support',
        actionLabel: 'Contact support',
        reason:
          'The scan image for this report is no longer on this device. The report is kept unchanged; do not start a new report for the same field visit before the office advises.',
        title: 'Saved image missing',
      };
    case 'INVALID_LOCAL_RECORD':
      return {
        action: 'support',
        actionLabel: 'Contact support',
        reason:
          'This saved report is incomplete, so it cannot be sent as-is. Contact support with the reference below instead of retrying.',
        title: 'Needs office attention',
      };
    default:
      return {
        action: 'support',
        actionLabel: 'Contact support',
        reason: isAutoRetryableSyncErrorCode(code)
          ? 'The connection or the office was unavailable. CaneGuard retries automatically.'
          : 'CaneGuard could not confirm this report was accepted. Contact support with the reference below instead of resending it.',
        title: isAutoRetryableSyncErrorCode(code)
          ? 'Waiting to send'
          : 'Needs office attention',
      };
  }
}

/**
 * A support handoff that names the local report and failure only. It carries no
 * photo, token, coordinates or farmer text.
 */
export function buildSupportReference(input: {
  code: string | null;
  reportId: string;
}): string {
  const code = input.code ?? 'UNKNOWN';
  return [
    'CaneGuard support reference',
    `report: ${input.reportId}`,
    `failure: ${code}`,
    'No photo, location, sign-in token or farmer details are included.',
  ].join('\n');
}

export function supportShareMessage(input: {
  code: string | null;
  reportId: string;
}): string {
  return `${buildSupportReference(input)}\n\nPlease share this reference with the office or support so they can look up the saved report.`;
}
