import type {
  ScanClassScoreRow,
  ScanQualityWarningRow,
  ScanRecordRow,
  ScanSymptomRow,
} from '@/database/schema';
import type {
  ScanRecordDetails,
  ScanRecordListItem,
  StoredClassScore,
} from '@/features/records/domain/recordTypes';
import type { QualityWarning } from '@/features/detection/validation/assessImageQuality';

export function mapScanRecordListItem(
  row: Pick<
    ScanRecordRow,
    | 'barangay'
    | 'confidence'
    | 'createdAt'
    | 'id'
    | 'managedImageUri'
    | 'predictedLabel'
    | 'syncStatus'
  >,
): ScanRecordListItem {
  return {
    id: row.id,
    managedImageUri: row.managedImageUri,
    predictedLabel: row.predictedLabel,
    confidence: row.confidence,
    barangay: row.barangay,
    syncStatus: row.syncStatus,
    createdAt: row.createdAt,
  };
}

export function mapScanRecordDetails(
  row: ScanRecordRow,
  children: {
    classScores: ScanClassScoreRow[];
    qualityWarnings: ScanQualityWarningRow[];
    symptoms: ScanSymptomRow[];
  },
): ScanRecordDetails {
  return {
    ...mapScanRecordListItem(row),
    imageMimeType: row.imageMimeType,
    imageSizeBytes: row.imageSizeBytes,
    imageSourceType: row.imageSourceType,
    sourceWidth: row.sourceWidth,
    sourceHeight: row.sourceHeight,
    checklistConsistency: row.checklistConsistency,
    reportedSeverity: row.reportedSeverity,
    modelVersion: row.modelVersion,
    preprocessMs: row.preprocessMs,
    inferenceMs: row.inferenceMs,
    totalMs: row.totalMs,
    remoteId: row.remoteId,
    updatedAt: row.updatedAt,
    classScores: children.classScores.map<StoredClassScore>((score) => ({
      label: score.label,
      score: score.score,
    })),
    symptoms: children.symptoms.map((symptom) => symptom.symptomKey),
    qualityWarnings: children.qualityWarnings.map(
      (warning) => warning.warningKey as QualityWarning,
    ),
  };
}
