import type {
  FieldReportAuthoringState,
  FieldReportLocationSource,
  GpsCaptureOutcome,
  LocationUnavailableReason,
  MeasurementProvenance,
  SyncStatus,
} from '@/database/schema';
import type { MobileUserRole } from '@/features/auth/types';
import type { AuthorityReviewSnapshot } from '@/features/reports/domain/reportReviewTypes';

export type {
  LocationUnavailableReason,
  MeasurementProvenance,
} from '@/database/schema';

/** Stable reporter-observation value used by the RSSI quick choice. */
export const REPORTER_OBSERVED_CONCERN_RSSI = 'RSSI' as const;

/**
 * D-02: bounded reasons an inspector may submit without an exact coordinate.
 * Barangay stays mandatory, so the report still locates the case.
 */
export const LOCATION_UNAVAILABLE_REASON_LABELS: Record<
  LocationUnavailableReason,
  string
> = {
  permission_denied: 'Location permission was denied',
  services_unavailable: 'Device location services were unavailable',
  low_accuracy: 'The location could not be confirmed',
  offline_no_map: 'Offline, so the online map could not be used',
  other: 'Another reason',
};

export interface FieldReport {
  affectedAreaHectares: number | null;
  /**
   * D-01: resolved provenance. A row written before provenance existed reads as
   * measured when a value is stored and not measured when it is empty.
   */
  affectedAreaMeasurement: MeasurementProvenance;
  /** False only for legacy rows that predate the explicit D-01 choice. */
  affectedAreaMeasurementExplicit?: boolean;
  affectedPortionPercent: number | null;
  affectedPortionMeasurement: MeasurementProvenance;
  /** False only for legacy rows that predate the explicit D-01 choice. */
  affectedPortionMeasurementExplicit?: boolean;
  locationUnavailableReason: LocationUnavailableReason | null;
  authorityReview: AuthorityReviewSnapshot | null;
  authoringState: FieldReportAuthoringState;
  barangay: string | null;
  caneClass: string | null;
  createdAt: string;
  cropAge: string | null;
  /** Backward-compatible field name; the value may be any usable farmer/farm reference. */
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
  affectedAreaMeasurement?: MeasurementProvenance;
  affectedPortionPercent?: number | null;
  affectedPortionMeasurement?: MeasurementProvenance;
  locationUnavailableReason?: LocationUnavailableReason | null;
  barangay?: string;
  caneClass?: string;
  cropAge?: string;
  /** Accepts a farmer/owner name, farm name, or usable local farm identifier. */
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
  affectedAreaHectares: number | null;
  /**
   * D-01: optional on the wire so existing callers keep working; when omitted,
   * a number reads as measured and an empty value reads as not measured.
   */
  affectedAreaMeasurement?: MeasurementProvenance;
  affectedPortionPercent: number | null;
  affectedPortionMeasurement?: MeasurementProvenance;
  barangay: string;
  caneClass?: string;
  cropAge?: string;
  /** Accepts a farmer/owner name, farm name, or usable local farm identifier. */
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
  'location_unavailable_reason',
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
      /**
       * The draft revision the attempt started from. A reading that returns
       * after the inspector changed the location is dropped rather than
       * overwriting the newer choice.
       */
      expectedUpdatedAt?: string;
      latitude: number;
      longitude: number;
      outcome: 'low_accuracy' | 'resolved';
      updatedAt: string;
    }
  | {
      capturedAt: string;
      expectedUpdatedAt?: string;
      outcome: 'error' | 'permission_denied' | 'unavailable';
      reason?: GpsCaptureUnavailableReason;
      updatedAt: string;
    };
