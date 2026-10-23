import { SyncError } from '@/features/sync/errors/syncErrors';
import {
  formatPendingSummary,
  getConnectionLabel,
  getReportSyncAttemptOutcome,
  getSyncBadgeLabel,
  getSyncRowSummary,
  isServerUnavailable,
} from '@/features/sync/utils/syncStatusCopy';

describe('syncStatusCopy', () => {
  it('summarizes pending reports and visits with one vocabulary', () => {
    expect(formatPendingSummary(0)).toBe('0 reports waiting to send');
    expect(formatPendingSummary(1)).toBe('1 report waiting to send');
    expect(formatPendingSummary(2)).toBe('2 reports waiting to send');
    expect(formatPendingSummary(3, 2, 1)).toBe('2 reports, 1 visit waiting to send');
    expect(formatPendingSummary(3, 2, 1, 1)).toBe('1 boundary, 2 reports, 1 visit waiting to send');
    expect(formatPendingSummary(1, 0, 1)).toBe('1 visit waiting to send');
  });

  it('detects server unavailability the same way for every surface', () => {
    expect(isServerUnavailable('available', 'verified', true)).toBe(false);
    expect(isServerUnavailable('unavailable', 'verified', true)).toBe(true);
    // A current successful API observation clears the stale offline wording.
    expect(isServerUnavailable('available', 'unavailable', true)).toBe(false);
    expect(isServerUnavailable('unknown', 'unavailable', true)).toBe(true);
    expect(isServerUnavailable('unavailable', 'verified', false)).toBe(false);
  });

  it('chooses one connection label for the panel', () => {
    expect(getConnectionLabel(null, 'unknown')).toBe('Checking connection');
    expect(getConnectionLabel(false, 'unknown')).toBe('Offline');
    expect(getConnectionLabel(true, 'unavailable')).toBe(
      'Network available · Cannot reach the office',
    );
    expect(getConnectionLabel(true, 'unknown')).toBe(
      'Network available · Office status not checked',
    );
    expect(getConnectionLabel(true, 'available')).toBe('Network and office available');
  });

  it('chooses one row summary across connection states', () => {
    const base = {
      apiReachability: 'available' as const,
      isOnline: true as const,
      pendingCount: 0,
    };
    expect(getSyncRowSummary({ ...base, isSyncing: true })).toBe('Sending saved reports…');
    expect(getSyncRowSummary({ ...base, isOnline: null })).toBe('Checking connection');
    expect(getSyncRowSummary({ ...base, isOnline: false })).toBe(
      'Offline · saved reports stay on this device',
    );
    expect(getSyncRowSummary({ ...base, pendingCount: 2 })).toBe('2 reports waiting to send');
    expect(
      getSyncRowSummary({ ...base, apiReachability: 'unavailable', pendingCount: 2 }),
    ).toBe('2 reports waiting to send · Cannot reach the office');
    expect(getSyncRowSummary(base)).toBe('Office connected · All saved reports are sent');
  });

  it('chooses one short badge label for the Home status', () => {
    expect(getSyncBadgeLabel({ apiReachability: 'available', isOnline: false })).toBe('Offline');
    expect(
      getSyncBadgeLabel({ apiReachability: 'available', isOnline: true, sessionVerification: 'unavailable' }),
    ).toBe('Online');
    expect(getSyncBadgeLabel({ apiReachability: 'unknown', isOnline: true })).toBe(
      'Network available',
    );
    expect(getSyncBadgeLabel({ apiReachability: 'available', isOnline: true })).toBe('Online');
    expect(getSyncBadgeLabel({ apiReachability: 'unknown', isOnline: null })).toBe(
      'Checking connection',
    );
  });

  describe('per-report send confirmation (M02)', () => {
    const target = 'report-target';

    it('confirms success only for the target report', () => {
      expect(
        getReportSyncAttemptOutcome({
          isOnline: true,
          lastSyncErrorCode: null,
          reportSyncStatus: 'synced',
          targetResult: {
            reportId: target,
            remoteId: 'remote-1',
            status: 'synced',
          },
        }),
      ).toEqual({ kind: 'sent', message: 'Sent to office' });
    });

    it('never reports another report’s success as this report’s success', () => {
      expect(
        getReportSyncAttemptOutcome({
          isOnline: true,
          lastSyncErrorCode: 'API_VALIDATION_FAILED',
          reportSyncStatus: 'failed',
          targetResult: {
            error: new SyncError('API_VALIDATION_FAILED', 'rejected'),
            reportId: target,
            status: 'failed',
          },
        }).kind,
      ).toBe('needs-attention');
    });

    it('treats a null attempt as unconfirmed instead of sent', () => {
      const outcome = getReportSyncAttemptOutcome({
        isOnline: false,
        lastSyncErrorCode: null,
        reportSyncStatus: 'pending',
        targetResult: null,
      });
      expect(outcome.kind).toBe('still-waiting');
      expect(outcome.message).toContain('offline');
    });

    it('distinguishes auth, permanent and transient failures', () => {
      expect(
        getReportSyncAttemptOutcome({
          isOnline: true,
          lastSyncErrorCode: 'AUTH_REQUIRED',
          reportSyncStatus: 'failed',
          targetResult: null,
        }).kind,
      ).toBe('sign-in');
      expect(
        getReportSyncAttemptOutcome({
          isOnline: true,
          lastSyncErrorCode: 'IMAGE_MISSING',
          reportSyncStatus: 'failed',
          targetResult: null,
        }).kind,
      ).toBe('needs-attention');
      expect(
        getReportSyncAttemptOutcome({
          isOnline: true,
          lastSyncErrorCode: 'NETWORK_REQUEST_FAILED',
          reportSyncStatus: 'failed',
          targetResult: null,
        }).kind,
      ).toBe('still-waiting');
    });

    it('does not claim success while the target is still pending after a batch', () => {
      const outcome = getReportSyncAttemptOutcome({
        isOnline: true,
        lastSyncErrorCode: null,
        reportSyncStatus: 'pending',
        targetResult: null,
      });
      expect(outcome.kind).toBe('still-waiting');
      expect(outcome.message).not.toContain('Sent to office');
    });
  });
});
