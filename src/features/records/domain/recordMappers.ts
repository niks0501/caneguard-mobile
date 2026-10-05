import type {
  FieldReportRow,
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
import { toAuthorityReviewSnapshot } from '@/features/reports/domain/reportReviewTypes';

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
  > &
    {
      hasFieldReport?: boolean | number | null;
    } &
    Partial<
      Pick<
        FieldReportRow,
        | 'authorityFeedback'
        | 'authorityFetchedAt'
        | 'authorityReferenceCode'
        | 'authorityReviewedAt'
        | 'authorityStatusRaw'
        | 'authorityUpdatedAt'
      >
    >,
): ScanRecordListItem {
  return {
    authorityReview: row.authorityStatusRaw
      ? toAuthorityReviewSnapshot(
          {
            feedback: row.authorityFeedback ?? null,
            rawStatus: row.authorityStatusRaw,
            referenceCode: row.authorityReferenceCode ?? null,
            reviewedAt: row.authorityReviewedAt ?? null,
            statusUpdatedAt: row.authorityUpdatedAt ?? row.authorityFetchedAt ?? row.createdAt,
          },
          row.authorityFetchedAt ?? null,
        )
      : null,
    id: row.id,
    managedImageUri: row.managedImageUri,
    predictedLabel: row.predictedLabel,
    confidence: row.confidence,
    barangay: row.barangay,
    syncStatus: row.syncStatus,
    createdAt: row.createdAt,
    hasFieldReport: Boolean(row.hasFieldReport),
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
    syncStatus: 'local_only',
    ownerIdentity: row.ownerIdentity,
    imageMimeType: row.imageMimeType,
    imageSizeBytes: row.imageSizeBytes,
    imageSourceType: row.imageSourceType,
    submissionImageMimeType: row.submissionImageMimeType,
    submissionImageSizeBytes: row.submissionImageSizeBytes,
    submissionImageUri: row.submissionImageUri,
    sourceWidth: row.sourceWidth,
    sourceHeight: row.sourceHeight,
    checklistConsistency: row.checklistConsistency,
    reportedSeverity: row.reportedSeverity,
    modelVersion: row.modelVersion,
    decisionSupportWording: row.decisionSupportWording,
    preprocessMs: row.preprocessMs,
    inferenceMs: row.inferenceMs,
    totalMs: row.totalMs,
    remoteId: null,
    syncAttemptCount: 0,
    lastSyncErrorCode: null,
    lastSyncAttemptAt: null,
    lastSyncedAt: null,
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
