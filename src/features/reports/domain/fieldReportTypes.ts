import type {
  FieldReportAuthoringState,
  FieldReportLocationSource,
  GpsCaptureOutcome,
  SyncStatus,
} from '@/database/schema';
import type { MobileUserRole } from '@/features/auth/types';
import type { AuthorityReviewSnapshot } from '@/features/reports/domain/reportReviewTypes';

export interface FieldReport {
  affectedAreaHectares: number | null;
  affectedPortionPercent: number | null;
  authorityReview: AuthorityReviewSnapshot | null;
  authoringState: FieldReportAuthoringState;
  barangay: string | null;
  caneClass: string | null;
  createdAt: string;
  cropAge: string | null;
  farmerOrFarmOwnerName: string | null;
  fieldNotes: string | null;
  mismatchReported: boolean | null;
  reporterObservationText: string | null;
  reporterSuspectedCondition: string | null;
  finalLatitude: number | null;
  finalLongitude: number | null;
  gpsAccuracy: number | null;
  gpsAttemptAccuracy: number | null;
  gpsAttemptLatitude: number | null;
  gpsAttemptLongitude: number | null;
  gpsAttemptedAt: string | null;
  gpsCaptureOutcome: GpsCaptureOutcome | null;
  gpsOutcomeRecordedAt: string | null;
  id: string;
  locationSource: FieldReportLocationSource | null;
  lastSyncAttemptAt: string | null;
  lastSyncErrorCode: string | null;
  lastSyncedAt: string | null;
  manualLocationSelectedAt: string | null;
  municipality: string;
  observedAt: string;
  province: string;
  remoteId: string | null;
  scanRecordId: string;
  submittedAt: string | null;
  submitterIdentity: string | null;
  submitterRole: MobileUserRole | null;
  sugarcaneVariety: string | null;
  syncAttemptCount: number;
  syncStatus: SyncStatus;
  updatedAt: string;
}

export interface CreateFieldReportDraftInput {
  createdAt: string;
  id: string;
  municipality?: string;
  province?: string;
  scanRecordId: string;
  submitterIdentity: string;
  submitterRole: MobileUserRole;
}

export interface SaveFieldReportDraftInput {
  affectedAreaHectares?: number | null;
  affectedPortionPercent?: number | null;
  barangay?: string;
  caneClass?: string;
  cropAge?: string;
  farmerOrFarmOwnerName?: string;
  fieldNotes?: string | null;
  mismatchReported?: boolean | null;
  reporterObservationText?: string | null;
  reporterSuspectedCondition?: string | null;
  municipality?: string;
  province?: string;
  sugarcaneVariety?: string;
  updatedAt: string;
}

export interface SaveManualMapLocationInput {
  latitude: number;
  longitude: number;
  selectedAt: string;
  updatedAt: string;
}

export interface FinalizeFieldReportInput {
  affectedAreaHectares: number;
  affectedPortionPercent: number;
  barangay: string;
  caneClass?: string;
  cropAge?: string;
  farmerOrFarmOwnerName: string;
  fieldNotes?: string | null;
  mismatchReported?: boolean | null;
  reporterObservationText?: string | null;
  reporterSuspectedCondition?: string | null;
  submittedAt: string;
  sugarcaneVariety?: string;
  updatedAt: string;
}

export const FIELD_REPORT_SUBMISSION_REQUIREMENTS = [
  'original_scan_image',
  'submission_image',
  'source_image_dimensions',
  'ai_supported_result',
  'confidence',
  'class_scores',
  'symptom_checklist',
  'farmer_or_farm_owner_name',
  'submitter_identity',
  'submitter_role',
  'province',
  'municipality',
  'barangay',
  'affected_area_hectares',
  'affected_portion_percent',
  'final_coordinates',
  'location_source',
  'gps_accuracy',
  'observation_time',
] as const;

export type FieldReportSubmissionRequirement =
  (typeof FIELD_REPORT_SUBMISSION_REQUIREMENTS)[number];

export interface FieldReportSubmissionEvidence {
  checklistConsistency: string | null;
  classScores: { label: string; score: number }[];
  confidence: number | null;
  managedImageUri: string | null;
  managedImageAvailable: boolean;
  predictedLabel: string | null;
  sourceHeight: number | null;
  sourceWidth: number | null;
  submissionImageAvailable: boolean;
  expectedSubmissionImageUri?: string | null;
  submissionImageMimeType: string | null;
  submissionImageSizeBytes: number | null;
  submissionImageUri: string | null;
}

export type FinalizeFieldReportResult =
  | { report: FieldReport; status: 'finalized' }
  | {
      missingRequirements: FieldReportSubmissionRequirement[];
      report: FieldReport;
      status: 'invalid';
    };

export type GpsCaptureUnavailableReason =
  | 'location_services_disabled'
  | 'reading_unavailable';

export type SaveGpsCaptureInput =
  | {
      accuracy: number;
      capturedAt: string;
      latitude: number;
      longitude: number;
      outcome: 'low_accuracy' | 'resolved';
      updatedAt: string;
    }
  | {
      capturedAt: string;
      outcome: 'error' | 'permission_denied' | 'unavailable';
      reason?: GpsCaptureUnavailableReason;
      updatedAt: string;
    };
