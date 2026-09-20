import type { FieldValidationAssignmentState } from '@/database/schema';
import type { PreviousVisitContext } from '@/features/assignments/domain/previousVisit';

export interface FieldValidationAssignment {
  id: string;
  ownerIdentity: string;
  reportUuid: string;
  reportClientUuid: string;
  referenceCode: string;
  submitter: { uuid: string; name: string };
  assignee: { uuid: string; name: string };
  submitterIsAssignee: boolean;
  targetVisitDate: string | null;
  fieldValidationState: FieldValidationAssignmentState;
  assignedAt: string;
  updatedAt: string;
  cachedAt: string;
  case: {
    barangay: string;
    province: string | null;
    municipality: string | null;
    farmerOrFarmOwnerName: string | null;
    affectedAreaHectares: number | null;
    affectedPortionPercent: number | null;
    capturedAt: string;
    observedAt: string | null;
    submittedAt: string;
    predictedLabel: string;
    confidence: number;
  };
  previousVisit?: PreviousVisitContext | null;
}

export interface FieldValidationAssignmentUpdate extends Omit<
  FieldValidationAssignment,
  'id' | 'ownerIdentity' | 'cachedAt'
> {
  id: string;
}
