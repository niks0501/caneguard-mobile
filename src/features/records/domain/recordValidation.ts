import {
  CHECKLIST_OBSERVATIONS,
  getChecklistConsistency,
} from '@/features/detection/checklist/checklistConsistency';
import {
  MODEL_LABELS,
  type ModelLabel,
} from '@/features/detection/constants/modelContract';
import type {
  ClassScore,
  ReportedSeverity,
  ScanSessionState,
} from '@/features/detection/types';
import type { QualityWarning } from '@/features/detection/validation/assessImageQuality';
import { StorageError } from '@/database/errors';
import type {
  CompletedScanDraft,
  SaveCompletedScanInput,
} from '@/features/records/domain/recordTypes';
import { isManagedSourceScanImageUriForRecord } from '@/features/records/services/scanImageStorage';
import { isValidSubmissionImageMetadata } from '@/features/sync/constants/mobileReportUploadContract';

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const UTC_ISO_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const REPORTED_SEVERITIES: readonly ReportedSeverity[] = [
  'Mild',
  'Moderate',
  'Severe',
];
const QUALITY_WARNINGS: readonly QualityWarning[] = [
  'low-resolution',
  'too-dark',
  'too-bright',
  'low-contrast',
];
const SYMPTOM_KEYS: readonly string[] = CHECKLIST_OBSERVATIONS.map(
  (observation) => observation.id,
);

export function createCompletedScanDraft(
  state: ScanSessionState,
  recordId: string,
  now: Date,
): CompletedScanDraft {
  if (
    state.status !== 'completed' ||
    !state.result ||
    !state.sourceUri ||
    !state.sourceType
  ) {
    invalid('A completed inference result and source image are required.');
  }

  let timestamp: string;
  try {
    timestamp = now.toISOString();
  } catch {
    invalid('The record timestamp is invalid.');
  }

  const draft: CompletedScanDraft = {
    id: recordId,
    sourceUri: state.sourceUri,
    imageSourceType: state.sourceType,
    sourceWidth: state.sourceWidth,
    sourceHeight: state.sourceHeight,
    predictedLabel: state.result.predictedLabel,
    confidence: state.result.confidence,
    classScores: state.result.scores.map((score) => ({ ...score })),
    symptoms: [...state.selectedSymptoms],
    checklistConsistency: getChecklistConsistency(
      state.result.predictedLabel,
      state.selectedSymptoms,
    ),
    reportedSeverity: state.reportedSeverity,
    qualityWarnings: [...(state.qualityAssessment?.warnings ?? [])],
    // The scan-session barangay capture path was removed; the legacy scan
    // record column is written empty for new records.
    barangay: '',
    modelVersion: state.result.modelVersion,
    preprocessMs: state.result.timings.preprocessMs,
    inferenceMs: state.result.timings.inferenceMs,
    totalMs: state.result.timings.totalMs,
    createdAt: timestamp!,
    updatedAt: timestamp!,
  };

  validateCompletedScanDraft(draft);
  return draft;
}

export function validateCompletedScanDraft(draft: CompletedScanDraft): void {
  if (!UUID_V4_PATTERN.test(draft.id)) {
    invalid('The record identifier must be UUIDv4.');
  }
  if (!draft.sourceUri.trim()) {
    invalid('The source image URI is required.');
  }
  if (draft.imageSourceType !== 'camera' && draft.imageSourceType !== 'gallery') {
    invalid('The image source type is invalid.');
  }
  if (!MODEL_LABELS.includes(draft.predictedLabel)) {
    invalid('The predicted model label is unsupported.');
  }
  validateProbability(draft.confidence, 'confidence');
  validateClassScores(draft.classScores);
  validateRequiredDimension(draft.sourceWidth);
  validateRequiredDimension(draft.sourceHeight);
  validateNonNegativeFinite(draft.preprocessMs, 'preprocessing timing');
  validateNonNegativeFinite(draft.inferenceMs, 'inference timing');
  validateNonNegativeFinite(draft.totalMs, 'total timing');

  if (!draft.modelVersion.trim()) {
    invalid('The model version is required.');
  }
  if (draft.barangay.trim().length > 120) {
    invalid('The legacy scan barangay is too long.');
  }
  if (
    draft.reportedSeverity !== null &&
    !REPORTED_SEVERITIES.includes(draft.reportedSeverity)
  ) {
    invalid('The reported severity is invalid.');
  }
  if (
    draft.symptoms.some((symptom) => !SYMPTOM_KEYS.includes(symptom)) ||
    new Set(draft.symptoms).size !== draft.symptoms.length
  ) {
    invalid('The selected symptom keys are invalid.');
  }
  if (
    draft.qualityWarnings.some(
      (warning) => !QUALITY_WARNINGS.includes(warning),
    ) ||
    new Set(draft.qualityWarnings).size !== draft.qualityWarnings.length
  ) {
    invalid('The image-quality warning keys are invalid.');
  }
  validateUtcTimestamp(draft.createdAt);
  validateUtcTimestamp(draft.updatedAt);
}

export function validateSaveCompletedScanInput(
  input: SaveCompletedScanInput,
): void {
  validateCompletedScanDraft({ ...input, sourceUri: input.managedImageUri });

  if (
    !input.managedImageUri.trim() ||
    !isManagedSourceScanImageUriForRecord(input.managedImageUri, input.id)
  ) {
    invalid('The managed image URI is invalid.');
  }
  if (
    input.imageSizeBytes !== null &&
    (!Number.isInteger(input.imageSizeBytes) || input.imageSizeBytes < 0)
  ) {
    invalid('The managed image size is invalid.');
  }
  if (
    input.imageMimeType !== null &&
    !/^image\/[a-z0-9.+-]+$/i.test(input.imageMimeType)
  ) {
    invalid('The managed image MIME type is invalid.');
  }
  if (
    !isValidSubmissionImageMetadata({
      sourceUri: input.managedImageUri,
      submissionImageMimeType: input.submissionImageMimeType,
      submissionImageSizeBytes: input.submissionImageSizeBytes,
      submissionImageUri: input.submissionImageUri,
      expectedSubmissionImageUri: input.submissionImageUri
        ? `${input.managedImageUri.slice(0, input.managedImageUri.lastIndexOf('/') + 1)}${input.id}.submission.jpg`
        : null,
    })
  ) {
    invalid('The submission image metadata is invalid.');
  }
}

function validateClassScores(scores: readonly ClassScore[]): void {
  if (scores.length !== MODEL_LABELS.length) {
    invalid('Every model class score is required.');
  }

  const labels = new Set<ModelLabel>();
  for (const score of scores) {
    if (!MODEL_LABELS.includes(score.label) || labels.has(score.label)) {
      invalid('Model class score labels are invalid.');
    }
    labels.add(score.label);
    validateProbability(score.score, 'class score');
  }

  if (MODEL_LABELS.some((label) => !labels.has(label))) {
    invalid('Every model class score is required.');
  }
}

function validateProbability(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    invalid(`The ${name} must be between zero and one.`);
  }
}

function validateNonNegativeFinite(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    invalid(`The ${name} must be non-negative.`);
  }
}

function validateRequiredDimension(value: number | null): void {
  if (value === null || !Number.isFinite(value) || value <= 0) {
    invalid('Source image dimensions must be positive.');
  }
}

function validateUtcTimestamp(value: string): void {
  if (!UTC_ISO_PATTERN.test(value) || Number.isNaN(Date.parse(value))) {
    invalid('Record timestamps must be UTC ISO 8601 strings.');
  }
}

function invalid(message: string): never {
  throw new StorageError('INVALID_SCAN_RECORD', message);
}
