import type { FieldValidationAssignment } from '@/features/assignments/domain/assignmentTypes';

export type TodayVisitBucket = 'overdue' | 'today' | 'upcoming' | 'none';

export const TODAY_VISIT_BUCKETS: TodayVisitBucket[] = [
  'overdue',
  'today',
  'upcoming',
  'none',
];

const ACTIVE_ASSIGNMENT_STATES = new Set(['assigned', 'in_progress']);

export function getLocalDateKey(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isActiveFieldValidationAssignment(
  assignment: FieldValidationAssignment,
): boolean {
  return ACTIVE_ASSIGNMENT_STATES.has(assignment.fieldValidationState);
}

export function bucketForVisit(
  assignment: FieldValidationAssignment,
  today: string,
): TodayVisitBucket {
  if (!assignment.targetVisitDate) return 'none';
  if (assignment.targetVisitDate < today) return 'overdue';
  if (assignment.targetVisitDate === today) return 'today';
  return 'upcoming';
}

export function compareVisits(
  first: FieldValidationAssignment,
  second: FieldValidationAssignment,
): number {
  return (
    compareNullableDates(first.targetVisitDate, second.targetVisitDate) ||
    first.case.barangay.localeCompare(second.case.barangay) ||
    first.referenceCode.localeCompare(second.referenceCode)
  );
}

export function selectTodayVisits(
  assignments: FieldValidationAssignment[],
  completedAssignmentIds: ReadonlySet<string> = new Set(),
): FieldValidationAssignment[] {
  return assignments
    .filter(
      (assignment) =>
        isActiveFieldValidationAssignment(assignment) &&
        !completedAssignmentIds.has(assignment.id),
    )
    .sort(compareVisits);
}

export function assignmentDueMeta(
  assignment: FieldValidationAssignment,
  today: string,
): string {
  if (!assignment.targetVisitDate) {
    return assignment.fieldValidationState === 'in_progress'
      ? 'Visit in progress'
      : 'Visit scheduled';
  }
  if (assignment.targetVisitDate < today) {
    return `Visit was due ${assignment.targetVisitDate}`;
  }
  if (assignment.targetVisitDate === today) {
    return 'Visit due today';
  }
  return `Visit due ${assignment.targetVisitDate}`;
}

export function formatTodayDueLine(
  assignment: FieldValidationAssignment,
  today: string,
): string {
  const bucket = bucketForVisit(assignment, today);
  if (!assignment.targetVisitDate) return 'No target visit date';
  const date = formatDate(assignment.targetVisitDate);
  if (bucket === 'overdue') {
    const days = daysBetweenDateKeys(assignment.targetVisitDate, today);
    return `Was due ${date} · ${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
  if (bucket === 'today') return `Due today · ${date}`;
  return `Due ${date}`;
}

function compareNullableDates(first: string | null, second: string | null): number {
  if (first === second) return 0;
  if (first === null) return 1;
  if (second === null) return -1;
  return first.localeCompare(second);
}

function daysBetweenDateKeys(earlier: string, later: string): number {
  const parse = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    return Date.UTC(year, month - 1, day);
  };
  return Math.max(1, Math.round((parse(later) - parse(earlier)) / 86_400_000));
}

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { dateStyle: 'medium' });
}
