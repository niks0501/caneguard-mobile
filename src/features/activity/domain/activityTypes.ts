export type ActivityFilter = 'all' | 'reports' | 'scans' | 'assignments';

export type CurrentActivityFilter = ActivityFilter;

export type ActivityFilterOption = {
  key: CurrentActivityFilter;
  label: string;
};

export const ACTIVITY_FILTERS: readonly ActivityFilterOption[] = [
  { key: 'all', label: 'All' },
  { key: 'reports', label: 'Reports' },
  { key: 'assignments', label: 'Assignments' },
  { key: 'scans', label: 'Scans' },
];

export type ActivityItemKind = 'report' | 'scan';

export function getActivityItemKind(
  hasFieldReport: boolean | undefined,
): ActivityItemKind {
  return hasFieldReport ? 'report' : 'scan';
}
