import type { FieldValidationFollowUpOutcome } from '@/database/schema';
import type { FieldValidationAssignment } from '@/features/assignments/domain/assignmentTypes';
import type { FieldValidationCompletion } from '@/features/assignments/domain/fieldValidationCompletionTypes';

export interface PreviousVisitContext {
  referenceCode: string;
  visitedAt: string;
  reporterSuspectedCondition: string | null;
  authorityClassifiedCondition: string | null;
  actionTaken: string;
  followUpOutcome: FieldValidationFollowUpOutcome | null;
  fieldObservation: string | null;
  fieldFinding: string | null;
  freshPhotoAvailable: boolean;
}

export interface PreviousVisit {
  assignment: FieldValidationAssignment;
  completion: FieldValidationCompletion | null;
  reporterConcern: string | null;
  visitedAt: string;
}

export interface SelectPreviousVisitInput {
  assignments: FieldValidationAssignment[];
  completions: FieldValidationCompletion[];
  currentAssignment: FieldValidationAssignment;
  currentVisitAt?: string;
  reporterConcerns?: ReadonlyMap<string, string | null>;
}

export function normalizeFarmPart(value: string | null | undefined): string {
  return (value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Farm identity follows the office plan: exact normalized barangay plus the
 * usable farmer/farm reference. A blank reference intentionally falls back to
 * barangay-only matching because the device has no farm table.
 */
export function farmKey(assignment: FieldValidationAssignment): string {
  return `${normalizeFarmPart(assignment.case.barangay)}|${normalizeFarmPart(assignment.case.farmerOrFarmOwnerName)}`;
}

export function selectPreviousVisit({
  assignments,
  completions,
  currentAssignment,
  currentVisitAt = new Date().toISOString(),
  reporterConcerns = new Map(),
}: SelectPreviousVisitInput): PreviousVisit | null {
  const currentFarmName = normalizeFarmPart(currentAssignment.case.farmerOrFarmOwnerName);
  const currentBarangay = normalizeFarmPart(currentAssignment.case.barangay);
  const currentTime = Date.parse(currentVisitAt);
  if (Number.isNaN(currentTime)) return null;

  const completionsByAssignment = new Map(
    completions.map((completion) => [completion.assignmentId, completion]),
  );
  const candidates = assignments
    .filter((assignment) => assignment.id !== currentAssignment.id)
    .filter((assignment) => {
      const sameBarangay = normalizeFarmPart(assignment.case.barangay) === currentBarangay;
      if (!sameBarangay) return false;
      if (!currentFarmName) return true;
      return farmKey(assignment) === farmKey(currentAssignment);
    })
    .map((assignment) => ({
      assignment,
      completion: completionsByAssignment.get(assignment.id) ?? null,
    }))
    .filter(({ assignment, completion }) => {
      const date = completion?.visitedAt ?? assignment.updatedAt;
      const timestamp = Date.parse(date);
      return !Number.isNaN(timestamp) && timestamp < currentTime;
    });
  const completedCandidates = candidates.filter(({ completion }) => completion !== null);
  const winner = [...(completedCandidates.length ? completedCandidates : candidates)]
    .sort((first, second) => compareCandidates(second, first))[0];
  if (!winner) return null;
  return {
    assignment: winner.assignment,
    completion: winner.completion,
    reporterConcern: reporterConcerns.get(winner.assignment.id) ?? null,
    visitedAt: winner.completion?.visitedAt ?? winner.assignment.updatedAt,
  };
}

function compareCandidates(
  first: { assignment: FieldValidationAssignment; completion: FieldValidationCompletion | null },
  second: { assignment: FieldValidationAssignment; completion: FieldValidationCompletion | null },
): number {
  const firstVisited = Date.parse(first.completion?.visitedAt ?? first.assignment.updatedAt);
  const secondVisited = Date.parse(second.completion?.visitedAt ?? second.assignment.updatedAt);
  return (
    firstVisited - secondVisited ||
    Date.parse(first.completion?.createdAt ?? first.assignment.updatedAt) -
      Date.parse(second.completion?.createdAt ?? second.assignment.updatedAt) ||
    first.assignment.id.localeCompare(second.assignment.id)
  );
}
