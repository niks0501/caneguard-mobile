import type { ChecklistConsistency } from '@/features/detection/checklist/checklistConsistency';
import type { ModelLabel } from '@/features/detection/constants/modelContract';
import type { ClassScore, ReportedSeverity, ScanSourceType } from '@/features/detection/types';
import type { QualityWarning } from '@/features/detection/validation/assessImageQuality';
import type { SyncStatus } from '@/database/schema';
import type { AuthorityReviewSnapshot } from '@/features/reports/domain/reportReviewTypes';

export const DEFAULT_RECORD_PAGE_SIZE = 25;
export const MAX_RECORD_PAGE_SIZE = 100;

export interface DateRange {
  from?: string;
  to?: string;
}

export interface ScanRecordQuery {
  barangay?: string;
  dateRange?: DateRange;
  hasFieldReport?: boolean;
  limit?: number;
  offset?: number;
  predictedLabel?: string;
  search?: string;
  syncStatus?: SyncStatus;
}

export interface ScanRecordListItem {
  authorityReview: AuthorityReviewSnapshot | null;
  barangay: string | null;
  confidence: number;
  createdAt: string;
  hasFieldReport?: boolean;
  id: string;
  managedImageUri: string;
  predictedLabel: string;
  syncStatus: SyncStatus;
}

export interface StoredClassScore {
  label: string;
  score: number;
}

export interface ScanRecordDetails extends ScanRecordListItem {
  checklistConsistency: ChecklistConsistency;
  classScores: StoredClassScore[];
  imageMimeType: string | null;
  imageSizeBytes: number | null;
  imageSourceType: ScanSourceType;
  submissionImageMimeType: string | null;
  submissionImageSizeBytes: number | null;
  submissionImageUri: string | null;
  inferenceMs: number;
  lastSyncAttemptAt: string | null;
  lastSyncErrorCode: string | null;
  lastSyncedAt: string | null;
  modelVersion: string;
  preprocessMs: number;
  qualityWarnings: QualityWarning[];
  remoteId: string | null;
  reportedSeverity: ReportedSeverity | null;
  sourceHeight: number | null;
  sourceWidth: number | null;
  syncAttemptCount: number;
  symptoms: string[];
  totalMs: number;
  updatedAt: string;
}

export interface RecordsByLabel {
  count: number;
  label: string;
}

export interface LocalReportSummary {
  healthyPredictions: number;
  pendingSyncRecords: number;
  lowScorePredictions: number;
  possibleDiseasePredictions: number;
  recordsByLabel: RecordsByLabel[];
  recentRecords: ScanRecordListItem[];
  totalSavedScans: number;
}

export interface CompletedScanDraft {
  barangay: string;
  checklistConsistency: ChecklistConsistency;
  classScores: ClassScore[];
  confidence: number;
  createdAt: string;
  id: string;
  imageSourceType: ScanSourceType;
  inferenceMs: number;
  modelVersion: string;
  predictedLabel: ModelLabel;
  preprocessMs: number;
  qualityWarnings: QualityWarning[];
  reportedSeverity: ReportedSeverity | null;
  sourceHeight: number | null;
  sourceUri: string;
  sourceWidth: number | null;
  symptoms: string[];
  totalMs: number;
  updatedAt: string;
}

export interface SaveCompletedScanInput
  extends Omit<CompletedScanDraft, 'sourceUri'> {
  imageMimeType: string | null;
  imageSizeBytes: number | null;
  managedImageUri: string;
  submissionImageMimeType?: string | null;
  submissionImageSizeBytes?: number | null;
  submissionImageUri?: string | null;
}
