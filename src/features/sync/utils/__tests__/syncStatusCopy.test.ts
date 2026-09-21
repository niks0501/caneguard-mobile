import {
  formatPendingSummary,
  getConnectionLabel,
  getSyncBadgeLabel,
  getSyncRowSummary,
  isServerUnavailable,
} from '@/features/sync/utils/syncStatusCopy';

describe('syncStatusCopy', () => {
  it('summarizes pending reports and visits with one vocabulary', () => {
    expect(formatPendingSummary(0)).toBe('0 reports awaiting sync');
    expect(formatPendingSummary(1)).toBe('1 report awaiting sync');
    expect(formatPendingSummary(2)).toBe('2 reports awaiting sync');
    expect(formatPendingSummary(3, 2, 1)).toBe('2 reports, 1 visit awaiting sync');
    expect(formatPendingSummary(1, 0, 1)).toBe('1 visit awaiting sync');
  });

  it('detects server unavailability the same way for every surface', () => {
    expect(isServerUnavailable('available', 'verified', true)).toBe(false);
    expect(isServerUnavailable('unavailable', 'verified', true)).toBe(true);
    expect(isServerUnavailable('available', 'unavailable', true)).toBe(true);
  });

  it('chooses one connection label for the panel', () => {
    expect(getConnectionLabel(null, 'unknown')).toBe('Checking connection');
    expect(getConnectionLabel(false, 'unknown')).toBe('Offline');
    expect(getConnectionLabel(true, 'unavailable')).toBe(
      'Network available · CaneGuard server unavailable',
    );
    expect(getConnectionLabel(true, 'unknown')).toBe(
      'Network available · CaneGuard status not checked',
    );
    expect(getConnectionLabel(true, 'available')).toBe('Network and CaneGuard available');
  });

  it('chooses one row summary across connection states', () => {
    const base = {
      apiReachability: 'available' as const,
      isOnline: true as const,
      pendingCount: 0,
    };
    expect(getSyncRowSummary({ ...base, isSyncing: true })).toBe('Syncing saved reports…');
    expect(getSyncRowSummary({ ...base, isOnline: null })).toBe('Checking connection');
    expect(getSyncRowSummary({ ...base, isOnline: false })).toBe(
      'Offline · saved reports stay on this device',
    );
    expect(getSyncRowSummary({ ...base, pendingCount: 2 })).toBe('2 reports awaiting sync');
    expect(
      getSyncRowSummary({ ...base, apiReachability: 'unavailable', pendingCount: 2 }),
    ).toBe('2 reports awaiting sync · CaneGuard server unavailable');
    expect(getSyncRowSummary(base)).toBe('CaneGuard connected · All saved reports are synced');
  });

  it('chooses one short badge label for the Home status', () => {
    expect(getSyncBadgeLabel({ apiReachability: 'available', isOnline: false })).toBe('Offline');
    expect(
      getSyncBadgeLabel({ apiReachability: 'available', isOnline: true, sessionVerification: 'unavailable' }),
    ).toBe('Server unavailable');
    expect(getSyncBadgeLabel({ apiReachability: 'unknown', isOnline: true })).toBe(
      'Network available',
    );
    expect(getSyncBadgeLabel({ apiReachability: 'available', isOnline: true })).toBe('Online');
    expect(getSyncBadgeLabel({ apiReachability: 'unknown', isOnline: null })).toBe(
      'Checking connection',
    );
  });
});
