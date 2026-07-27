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
}

export interface ScanSessionState {
  barangay: string;
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
  | { type: 'RESET_SCAN' }
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
  | { type: 'SET_BARANGAY'; payload: string }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };
