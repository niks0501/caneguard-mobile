import {
  ACTIVITY_FILTERS,
  getActivityItemKind,
} from '@/features/activity/domain/activityTypes';

describe('Activity domain contract', () => {
  it('keeps the current filters focused on field work', () => {
    expect(ACTIVITY_FILTERS.map(({ key }) => key)).toEqual([
      'all',
      'reports',
      'assignments',
      'scans',
    ]);
    expect(ACTIVITY_FILTERS.map(({ label }) => label)).toEqual([
      'All',
      'Reports',
      'Assignments',
      'Scans',
    ]);
  });

  it('classifies report-backed and scan-only activity without merging storage models', () => {
    expect(getActivityItemKind(true)).toBe('report');
    expect(getActivityItemKind(false)).toBe('scan');
    expect(getActivityItemKind(undefined)).toBe('scan');
  });
});
