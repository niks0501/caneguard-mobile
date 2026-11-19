import type { GUARD_V1 } from '@/features/detection/constants/guardContract';
import type { ModelLabel } from '@/features/detection/constants/modelContract';
import type { ChecklistObservationId } from '@/features/detection/checklist/checklistConsistency';
import type { ImageQualityAssessment } from '@/features/detection/validation/assessImageQuality';

export type ScanSourceType = 'camera' | 'gallery';

export type ScanSessionStatus =
  | 'idle'
  | 'image-selected'
  | 'preprocessing'
  | 'running'
  | 'finalizing'
  | 'completed'
  | 'error';

/**
 * Legacy persisted scan metadata.
 * The guided scan flow no longer collects this value, but historical records
 * remain readable and the storage contract remains backward-compatible.
 */
export type ReportedSeverity = 'Mild' | 'Moderate' | 'Severe';

export interface ClassScore {
  label: ModelLabel;
  score: number;
}

export interface InferenceTimings {
  preprocessMs: number;
  inferenceMs: number;
  totalMs: number;
}

export interface DetectionResult {
  predictedLabel: ModelLabel;
  confidence: number;
  scores: ClassScore[];
  timings: InferenceTimings;
  modelVersion: string;
  /** Snapshot of the decision-support wording shown for this result. */
  decisionSupportWording?: string;
  /**
   * Marker that Guard V1 accepted this photo before V2 ran. Every result made by
   * the scan workflow carries it; a stored result without it is never trusted.
   */
  guardModelId?: typeof GUARD_V1.modelId;
}

/** Why a guarded scan stopped: the photo was judged, or the guard itself failed. */
export type GuardFailure = 'rejected' | 'error';

export interface ScanSessionState {
  sourceUri: string | null;
  processedUri: string | null;
  preprocessMs: number | null;
  sourceWidth: number | null;
  sourceHeight: number | null;
  sourceType: ScanSourceType | null;
  status: ScanSessionStatus;
  result: DetectionResult | null;
  qualityAssessment: ImageQualityAssessment | null;
  selectedSymptoms: ChecklistObservationId[];
  reportedSeverity: ReportedSeverity | null;
  errorMessage: string | null;
  photoPreparationFailed?: boolean;
  /** Set on an error that came from the Guard V1 step. */
  guardFailure?: GuardFailure | null;
  /** Set when this scan is a Check Again of the saved scan with this id. */
  followUpOf?: string | null;
  /** The farmer's own words about what they see now (follow-up only). */
  personalNote?: string | null;
  /** The farmer's optional place in their own words (no GPS). */
  personalPlace?: string | null;
}

export type ScanSessionAction =
  | {
      type: 'SELECT_IMAGE';
      payload: {
        sourceUri: string;
        sourceWidth: number | null;
        sourceHeight: number | null;
        sourceType: ScanSourceType;
      };
    }
  | { type: 'RESET_SCAN'; payload?: { sessionUri: string | null } }
  | { type: 'START_FOLLOW_UP'; payload: { scanId: string } }
  | { type: 'SET_PERSONAL_NOTE'; payload: string }
  | { type: 'SET_PERSONAL_PLACE'; payload: string }
  | { type: 'START_PREPROCESSING' }
  | {
      type: 'COMPLETE_PREPROCESSING';
      payload: {
        processedUri: string;
        preprocessMs: number;
        qualityAssessment: ImageQualityAssessment;
      };
    }
  | { type: 'START_INFERENCE' }
  | { type: 'START_RESULT_PREPARATION' }
  | { type: 'COMPLETE_INFERENCE'; payload: DetectionResult }
  | { type: 'SET_SYMPTOMS'; payload: ChecklistObservationId[] }
  | { type: 'SET_REPORTED_SEVERITY'; payload: ReportedSeverity | null }
  | {
      type: 'SET_ERROR';
      payload: string;
      photoPreparationFailed?: boolean;
      guardFailure?: GuardFailure;
    }
  | { type: 'CLEAR_ERROR' };
