import type { ApiReachability } from '@/features/sync/providers/SyncProvider';

export type SyncWordingInput = {
  apiReachability: ApiReachability;
  isOnline: boolean | null;
  isSyncing?: boolean;
  pendingCompletionsCount?: number;
  pendingCount: number;
  pendingReportsCount?: number;
  sessionVerification?: string;
};

export function formatPendingSummary(
  pendingCount: number,
  reportsCount: number = pendingCount,
  completionsCount: number = 0,
): string {
  if (reportsCount > 0 && completionsCount > 0) {
    return `${reportsCount} ${reportsCount === 1 ? 'report' : 'reports'}, ${completionsCount} ${completionsCount === 1 ? 'visit' : 'visits'} waiting to send`;
  }
  if (completionsCount > 0 && reportsCount === 0) {
    return `${completionsCount} ${completionsCount === 1 ? 'visit' : 'visits'} waiting to send`;
  }
  return `${pendingCount} ${pendingCount === 1 ? 'report' : 'reports'} waiting to send`;
}

export function isServerUnavailable(
  apiReachability: ApiReachability,
  sessionVerification?: string,
  isOnline?: boolean | null,
): boolean {
  if (sessionVerification === 'unavailable') {
    return true;
  }
  if (isOnline === true && apiReachability === 'unavailable') {
    return true;
  }
  if (apiReachability === 'unavailable') {
    return true;
  }
  return false;
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
    sessionVerification,
  } = input;

  const serverUnavail = isServerUnavailable(apiReachability, sessionVerification, isOnline);
  const hasPending = pendingCount > 0;
  const pendingSummary = formatPendingSummary(
    pendingCount,
    pendingReportsCount,
    pendingCompletionsCount,
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
