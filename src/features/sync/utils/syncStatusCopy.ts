import type { ApiReachability } from '@/features/sync/providers/SyncProvider';
import { FIELD_SURVEY_COPY } from '@/constants/copy';
import { isAutoRetryableSyncErrorCode } from '@/features/sync/errors/syncErrors';
import type { SyncResult } from '@/features/sync/services/syncFieldReport';

/** Single-sourced sync status copy for offline field-survey submissions. */
export const FIELD_SURVEY_SYNC_COPY = {
  savedOffline: 'Draft saved on this device.',
  signInRequired: 'Sign in again before syncing. Your boundary remains saved on this device.',
  offline: 'You are offline. Your boundary and measured area remain saved on this device; sync when online.',
  pendingLocked: 'This boundary has been submitted or may have reached the server. Retry the same survey, or start a separate boundary instead of changing this payload.',
  serverCorrection: 'The server needs a correction. Review the field-specific messages and edit the boundary.',
  identityRejected: FIELD_SURVEY_COPY.surveyIdentityRejected,
  synced: 'Boundary measurement synced.',
  submit: 'Save and sync measurement',
  submitting: 'Syncing measurement…',
} as const;

export type SyncWordingInput = {
  apiReachability: ApiReachability;
  isOnline: boolean | null;
  isSyncing?: boolean;
  pendingCompletionsCount?: number;
  pendingSurveysCount?: number;
  pendingCount: number;
  pendingReportsCount?: number;
  sessionVerification?: string;
};

export function formatPendingSummary(
  pendingCount: number,
  reportsCount: number = pendingCount,
  completionsCount: number = 0,
  surveysCount: number = 0,
): string {
  const parts = [
    surveysCount > 0 ? `${surveysCount} ${surveysCount === 1 ? 'boundary' : 'boundaries'}` : null,
    reportsCount > 0 ? `${reportsCount} ${reportsCount === 1 ? 'report' : 'reports'}` : null,
    completionsCount > 0 ? `${completionsCount} ${completionsCount === 1 ? 'visit' : 'visits'}` : null,
  ].filter((part): part is string => part !== null);
  return parts.length ? `${parts.join(', ')} waiting to send` : `${pendingCount} reports waiting to send`;
}

export function isServerUnavailable(
  apiReachability: ApiReachability,
  sessionVerification?: string,
  isOnline?: boolean | null,
): boolean {
  if (isOnline === false) {
    // Offline has its own label; it is not evidence the office is unreachable.
    return false;
  }
  // A current, successful API observation outranks an older verification
  // attempt that failed while the phone was offline.
  if (apiReachability === 'available') {
    return false;
  }
  if (sessionVerification === 'unavailable') {
    return true;
  }
  return apiReachability === 'unavailable';
}

export function getConnectionLabel(
  isOnline: boolean | null,
  apiReachability: ApiReachability,
  sessionVerification?: string,
): string {
  if (isOnline === null) {
    return 'Checking connection';
  }
  if (isOnline === false) {
    return 'Offline';
  }
  if (isServerUnavailable(apiReachability, sessionVerification, isOnline)) {
    return 'Network available · Cannot reach the office';
  }
  if (apiReachability === 'unknown') {
    return 'Network available · Office status not checked';
  }
  return 'Network and office available';
}

export function getSyncBadgeLabel(input: {
  apiReachability: ApiReachability;
  isOnline: boolean | null;
  sessionVerification?: string;
}): 'Offline' | 'Office unreachable' | 'Network available' | 'Online' | 'Checking connection' {
  const { apiReachability, isOnline, sessionVerification } = input;
  if (isOnline === false) {
    return 'Offline';
  }
  if (isServerUnavailable(apiReachability, sessionVerification, isOnline)) {
    return 'Office unreachable';
  }
  if (isOnline === true) {
    return apiReachability === 'unknown' ? 'Network available' : 'Online';
  }
  return 'Checking connection';
}

export function getSyncRowSummary(input: SyncWordingInput): string {
  const {
    apiReachability,
    isOnline,
    isSyncing = false,
    pendingCompletionsCount = 0,
    pendingCount,
    pendingReportsCount = pendingCount,
    pendingSurveysCount = 0,
    sessionVerification,
  } = input;

  const serverUnavail = isServerUnavailable(apiReachability, sessionVerification, isOnline);
  const hasPending = pendingCount > 0;
  const pendingSummary = formatPendingSummary(
    pendingCount,
    pendingReportsCount,
    pendingCompletionsCount,
    pendingSurveysCount,
  );

  if (isSyncing) {
    return 'Sending saved reports…';
  }
  if (isOnline === null) {
    return 'Checking connection';
  }
  if (isOnline === false) {
    return 'Offline · saved reports stay on this device';
  }
  if (serverUnavail) {
    return hasPending
      ? `${pendingSummary} · Cannot reach the office`
      : 'Network available · Cannot reach the office';
  }
  if (hasPending) {
    return pendingSummary;
  }
  if (apiReachability === 'unknown') {
    return 'Network available · Office status not checked';
  }
  return 'Office connected · All saved reports are sent';
}

export type ReportSyncAttemptKind =
  | 'sent'
  | 'sign-in'
  | 'needs-attention'
  | 'still-waiting';

export interface ReportSyncAttemptOutcome {
  kind: ReportSyncAttemptKind;
  message: string;
}

/**
 * Chooses the confirmation for one report after a manual send attempt. Success
 * for a different report in the same batch is never success for this target,
 * and a null/failed attempt never produces "Sent to office".
 */
export function getReportSyncAttemptOutcome(input: {
  isOnline: boolean | null;
  lastSyncErrorCode: string | null | undefined;
  reportSyncStatus: string | null | undefined;
  targetResult: SyncResult | null;
}): ReportSyncAttemptOutcome {
  const { isOnline, lastSyncErrorCode, reportSyncStatus, targetResult } = input;

  if (
    reportSyncStatus === 'synced' ||
    targetResult?.status === 'synced' ||
    targetResult?.status === 'already-synced'
  ) {
    return { kind: 'sent', message: 'Sent to office' };
  }

  const failedCode =
    reportSyncStatus === 'failed'
      ? lastSyncErrorCode ??
        (targetResult?.status === 'failed' ? targetResult.error.code : null)
      : targetResult?.status === 'failed'
        ? targetResult.error.code
        : null;

  if (failedCode === 'AUTH_REQUIRED') {
    return {
      kind: 'sign-in',
      message: 'Not sent — sign in again to send this report',
    };
  }
  if (failedCode && !isAutoRetryableSyncErrorCode(failedCode)) {
    return {
      kind: 'needs-attention',
      message: 'Not sent — this report needs attention before it can be sent',
    };
  }
  if (failedCode) {
    return {
      kind: 'still-waiting',
      message: 'Still waiting to send — CaneGuard will retry automatically',
    };
  }

  return {
    kind: 'still-waiting',
    message:
      isOnline === false
        ? 'Still waiting to send — you are offline. This report stays on this device'
        : 'Not confirmed as sent — check the status above before trying again',
  };
}
