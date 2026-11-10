import type { FieldValidationAssignmentState } from '@/database/schema';
import type { PreviousVisitContext } from '@/features/assignments/domain/previousVisit';

/** Stored when the server sends a predicted_label this app version does not know. */
export const UNKNOWN_PREDICTED_LABEL = 'unknown';
/** Cache-only stand-in (the stored columns are NOT NULL) for an office record with no AI scan. */
export const NO_AI_SCAN_CACHE_LABEL = 'no_ai_scan';

/** The reporter's own words about an office-born case. */
export interface OfficeCaseReporterConcern {
  suspectedCondition: string | null;
  observationText: string | null;
}

/** Server lifecycle of an office-born case, as the office last saved it. */
export interface OfficeCaseStatus {
  workflowStatus: string;
  caseState: string;
  reviewStatus: string;
  updatedAt: string;
}

/**
 * Projection the server attaches only to office-born cases. The photo bytes
 * are never stored here: the phone fetches them with the session token from
 * the assignment's guarded report-photo route.
 */
export interface OfficeCase {
  version: number;
  status: OfficeCaseStatus;
  reporterConcern: OfficeCaseReporterConcern;
  photo: { contentType: string; bytes: number } | null;
}

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
    /** Null for an office record with no AI scan; field-born cases always have both. */
    predictedLabel: string | null;
    confidence: number | null;
  };
  previousVisit?: PreviousVisitContext | null;
  /** Present only for office-born cases; absent means a field-born case. */
  officeCase?: OfficeCase | null;
}

export interface FieldValidationAssignmentUpdate extends Omit<
  FieldValidationAssignment,
  'id' | 'ownerIdentity' | 'cachedAt'
> {
  id: string;
}
