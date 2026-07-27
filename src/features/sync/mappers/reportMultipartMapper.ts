import { File } from 'expo-file-system';

import { MODEL_LABELS } from '@/features/detection/constants/modelContract';
import type { ScanRecordDetails } from '@/features/records/domain/recordTypes';
import { managedImageExists } from '@/features/records/services/scanImageStorage';
import { SyncError } from '@/features/sync/errors/syncErrors';

export interface MultipartMapperDependencies {
  createImageFile?: (uri: string) => Blob;
  imageExists?: (uri: string) => boolean;
}

export function mapReportToMultipart(
  record: ScanRecordDetails,
  dependencies: MultipartMapperDependencies = {},
): FormData {
  const createImageFile =
    dependencies.createImageFile ?? ((uri: string) => new File(uri));
  const imageExists = dependencies.imageExists ?? managedImageExists;
  validateRecord(record, imageExists);

  const form = new FormData();
  form.append('client_uuid', record.id);
  form.append('image_source_type', record.imageSourceType);
  appendNumber(form, 'source_width', record.sourceWidth);
  appendNumber(form, 'source_height', record.sourceHeight);
  form.append('predicted_label', record.predictedLabel);
  appendNumber(form, 'confidence', record.confidence);

  for (const label of MODEL_LABELS) {
    const score = record.classScores.find((item) => item.label === label)!;
    appendNumber(form, `class_scores[${label}]`, score.score);
  }
  for (const symptom of record.symptoms) {
    form.append('symptom_keys[]', symptom);
  }
  form.append('checklist_consistency', record.checklistConsistency);
  if (record.reportedSeverity) {
    form.append('reported_severity', record.reportedSeverity);
  }
  for (const warning of record.qualityWarnings) {
    form.append('quality_warnings[]', warning);
  }
  form.append('barangay', record.barangay!.trim());
  form.append('model_version', record.modelVersion);
  appendNumber(form, 'preprocess_ms', record.preprocessMs);
  appendNumber(form, 'inference_ms', record.inferenceMs);
  appendNumber(form, 'total_ms', record.totalMs);
  form.append('captured_at', record.createdAt);
  form.append('image', createImageFile(record.managedImageUri));

  return form;
}

function validateRecord(
  record: ScanRecordDetails,
  imageExists: (uri: string) => boolean,
): void {
  if (!imageExists(record.managedImageUri)) {
    throw new SyncError('IMAGE_MISSING', 'The managed report image is missing.');
  }
  if (!record.barangay?.trim()) {
    invalid('A barangay is required.');
  }
  if (!new Set<string>(MODEL_LABELS).has(record.predictedLabel)) {
    invalid('The predicted label is unsupported.');
  }
  if (
    record.classScores.length !== MODEL_LABELS.length ||
    MODEL_LABELS.some(
      (label) =>
        !record.classScores.some(
          (score) => score.label === label && isProbability(score.score),
        ),
    )
  ) {
    invalid('Every supported class score is required.');
  }
  if (record.sourceWidth === null || record.sourceHeight === null) {
    invalid('Source image dimensions are required.');
  }
  for (const value of [
    record.confidence,
    record.sourceWidth,
    record.sourceHeight,
    record.preprocessMs,
    record.inferenceMs,
    record.totalMs,
  ]) {
    if (value !== null && !Number.isFinite(value)) {
      invalid('Report numeric values must be finite.');
    }
  }
}

function appendNumber(form: FormData, key: string, value: number | null): void {
  if (value !== null) {
    form.append(key, String(value));
  }
}

function isProbability(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

function invalid(message: string): never {
  throw new SyncError('INVALID_LOCAL_RECORD', message);
}
