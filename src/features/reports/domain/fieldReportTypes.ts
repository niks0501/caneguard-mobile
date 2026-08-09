import type {
  FieldReportAuthoringState,
  FieldReportLocationSource,
  GpsCaptureOutcome,
  SyncStatus,
} from '@/database/schema';
import type { MobileUserRole } from '@/features/auth/types';

export interface FieldReport {
  authoringState: FieldReportAuthoringState;
  barangay: string | null;
  createdAt: string;
  farmerOrFarmOwnerName: string | null;
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
  syncAttemptCount: number;
  syncStatus: SyncStatus;
  updatedAt: string;
}

export interface CreateFieldReportDraftInput {
  createdAt: string;
  id: string;
  scanRecordId: string;
  submitterIdentity: string;
  submitterRole: MobileUserRole;
}

export interface SaveFieldReportDraftInput {
  barangay?: string;
  farmerOrFarmOwnerName?: string;
  updatedAt: string;
}

export interface SaveManualMapLocationInput {
  latitude: number;
  longitude: number;
  selectedAt: string;
  updatedAt: string;
}

export interface FinalizeFieldReportInput {
  barangay: string;
  farmerOrFarmOwnerName: string;
  submittedAt: string;
  updatedAt: string;
}

export const FIELD_REPORT_SUBMISSION_REQUIREMENTS = [
  'original_scan_image',
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
  predictedLabel: string | null;
}

export type FinalizeFieldReportResult =
  | { report: FieldReport; status: 'finalized' }
  | {
      missingRequirements: FieldReportSubmissionRequirement[];
      report: FieldReport;
      status: 'invalid';
    };

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
      updatedAt: string;
    };
