export type ActivityFilter = 'all' | 'reports' | 'scans' | 'assignments';

export type CurrentActivityFilter = Exclude<ActivityFilter, 'assignments'>;

export type ActivityFilterOption = {
  key: CurrentActivityFilter;
  label: string;
};

// Keep this list separate from the Activity screen so T06 can add Assignments
// without changing the navigation destination or its filtering contract.
export const ACTIVITY_FILTERS: readonly ActivityFilterOption[] = [
  { key: 'all', label: 'All' },
  { key: 'reports', label: 'Reports' },
  { key: 'scans', label: 'Scans' },
];

export type ActivityItemKind = 'report' | 'scan';

export function getActivityItemKind(
  hasFieldReport: boolean | undefined,
): ActivityItemKind {
  return hasFieldReport ? 'report' : 'scan';
}
