import type { ChecklistConsistency } from '@/features/detection/checklist/checklistConsistency';
import type { ModelLabel } from '@/features/detection/constants/modelContract';
import type { ClassScore, ReportedSeverity, ScanSourceType } from '@/features/detection/types';
import type { QualityWarning } from '@/features/detection/validation/assessImageQuality';
import type { SyncStatus } from '@/database/schema';

export const DEFAULT_RECORD_PAGE_SIZE = 25;

export interface DateRange {
  from?: string;
  to?: string;
}

export interface ScanRecordQuery {
  barangay?: string;
  dateRange?: DateRange;
  limit?: number;
  offset?: number;
  predictedLabel?: string;
  search?: string;
  syncStatus?: SyncStatus;
}

export interface ScanRecordListItem {
  barangay: string | null;
  confidence: number;
  createdAt: string;
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
  inferenceMs: number;
  modelVersion: string;
  preprocessMs: number;
  qualityWarnings: QualityWarning[];
  remoteId: string | null;
  reportedSeverity: ReportedSeverity | null;
  sourceHeight: number | null;
  sourceWidth: number | null;
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
  localOnlyRecords: number;
  lowScorePredictions: number;
  possibleDiseasePredictions: number;
  recordsByLabel: RecordsByLabel[];
  recentRecords: ScanRecordListItem[];
  totalSavedScans: number;
}

export interface SaveCompletedScanInput {
  barangay: string | null;
  checklistConsistency: ChecklistConsistency;
  classScores: ClassScore[];
  confidence: number;
  createdAt: string;
  id: string;
  imageMimeType: string | null;
  imageSizeBytes: number | null;
  imageSourceType: ScanSourceType;
  inferenceMs: number;
  managedImageUri: string;
  modelVersion: string;
  predictedLabel: ModelLabel;
  preprocessMs: number;
  qualityWarnings: QualityWarning[];
  reportedSeverity: ReportedSeverity | null;
  sourceHeight: number | null;
  sourceWidth: number | null;
  symptoms: string[];
  totalMs: number;
  updatedAt: string;
}
