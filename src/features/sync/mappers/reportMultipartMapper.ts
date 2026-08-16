import { File } from 'expo-file-system';

import { MODEL_LABELS } from '@/features/detection/constants/modelContract';
import type { ScanRecordDetails } from '@/features/records/domain/recordTypes';
import { managedImageExists } from '@/features/records/services/scanImageStorage';
import type { FieldReportUploadRecord } from '@/features/reports/data/fieldReportSyncRepository';
import { SyncError } from '@/features/sync/errors/syncErrors';

export interface MultipartMapperDependencies {
  createImageFile?: (uri: string) => Blob;
  imageExists?: (uri: string) => boolean;
}

export function mapFieldReportToMultipart(
  uploadRecord: FieldReportUploadRecord,
  dependencies: MultipartMapperDependencies = {},
): FormData {
  const createImageFile =
    dependencies.createImageFile ?? ((uri: string) => new File(uri));
  const imageExists = dependencies.imageExists ?? managedImageExists;
  const { report, scanRecord } = uploadRecord;
  validateReport(report, scanRecord, imageExists);

  const form = new FormData();
  form.append('client_uuid', report.id);
  form.append('scan_record_client_uuid', scanRecord.id);
  form.append('image_source_type', scanRecord.imageSourceType);
  appendNumber(form, 'source_width', scanRecord.sourceWidth);
  appendNumber(form, 'source_height', scanRecord.sourceHeight);
  form.append('predicted_label', scanRecord.predictedLabel);
  appendNumber(form, 'confidence', scanRecord.confidence);
  appendMismatchReported(form, report.mismatchReported);
  appendOptionalText(
    form,
    'reporter_suspected_condition',
    report.reporterSuspectedCondition,
  );
  appendOptionalText(
    form,
    'reporter_observation_text',
    report.reporterObservationText,
  );

  for (const label of MODEL_LABELS) {
    const score = scanRecord.classScores.find((item) => item.label === label)!;
    appendNumber(form, `class_scores[${label}]`, score.score);
  }
  for (const symptom of scanRecord.symptoms) {
    form.append('symptom_keys[]', symptom);
  }
  form.append('checklist_consistency', scanRecord.checklistConsistency);
  if (scanRecord.reportedSeverity) {
    form.append('reported_severity', scanRecord.reportedSeverity);
  }
  for (const warning of scanRecord.qualityWarnings) {
    form.append('quality_warnings[]', warning);
  }
  form.append('farmer_or_farm_owner_name', report.farmerOrFarmOwnerName!.trim());
  // The backend derives submitter authority from the bearer session rather
  // than trusting client-claimed identity or role fields.
  form.append('province', report.province);
  form.append('municipality', report.municipality);
  form.append('barangay', report.barangay!.trim());
  appendOptionalText(form, 'sugarcane_variety', report.sugarcaneVariety);
  appendOptionalText(form, 'crop_age', report.cropAge);
  appendOptionalText(form, 'cane_class', report.caneClass);
  appendNumber(form, 'affected_area_hectares', report.affectedAreaHectares);
  appendNumber(form, 'affected_portion_percent', report.affectedPortionPercent);
  appendOptionalText(form, 'field_notes', report.fieldNotes);
  appendNumber(form, 'final_latitude', report.finalLatitude);
  appendNumber(form, 'final_longitude', report.finalLongitude);
  form.append('location_source', report.locationSource!);
  if (report.locationSource === 'gps') {
    appendNumber(form, 'gps_accuracy', report.gpsAccuracy);
  }
  form.append('observed_at', report.observedAt);
  form.append('submitted_at', report.submittedAt!);
  form.append('model_version', scanRecord.modelVersion);
  appendNumber(form, 'preprocess_ms', scanRecord.preprocessMs);
  appendNumber(form, 'inference_ms', scanRecord.inferenceMs);
  appendNumber(form, 'total_ms', scanRecord.totalMs);
  form.append('captured_at', scanRecord.createdAt);
  form.append('image', createImageFile(scanRecord.managedImageUri));

  return form;
}

function validateReport(
  report: FieldReportUploadRecord['report'],
  record: ScanRecordDetails,
  imageExists: (uri: string) => boolean,
): void {
  if (!imageExists(record.managedImageUri)) {
    throw new SyncError('IMAGE_MISSING', 'The managed report image is missing.');
  }
  if (report.authoringState !== 'finalized' || report.syncStatus === 'local_only') {
    invalid('Only a finalized Field Report can be uploaded.');
  }
  if (!report.farmerOrFarmOwnerName?.trim() || !report.barangay?.trim()) {
    invalid('Farmer and barangay report fields are required.');
  }
  validateMismatchFields(report);
  if (!report.submitterIdentity || report.submitterRole !== 'field_reporter') {
    invalid('Authenticated Field Report submitter context is required.');
  }
  if (!report.submittedAt || !report.observedAt) {
    invalid('Observation and local submission times are required.');
  }
  if (
    report.finalLatitude === null ||
    report.finalLongitude === null ||
    !Number.isFinite(report.finalLatitude) ||
    !Number.isFinite(report.finalLongitude) ||
    report.finalLatitude < -90 ||
    report.finalLatitude > 90 ||
    report.finalLongitude < -180 ||
    report.finalLongitude > 180
  ) {
    invalid('Valid final report coordinates are required.');
  }
  if (
    (report.locationSource === 'gps' &&
      (report.gpsAccuracy === null ||
        !Number.isFinite(report.gpsAccuracy) ||
        report.gpsAccuracy < 0)) ||
    (report.locationSource === 'manual_map' && report.gpsAccuracy !== null) ||
    report.locationSource === null
  ) {
    invalid('Valid location provenance is required.');
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

function appendMismatchReported(
  form: FormData,
  value: boolean | null,
): void {
  if (value !== null) {
    form.append('mismatch_reported', value ? '1' : '0');
  }
}

function validateMismatchFields(report: FieldReportUploadRecord['report']): void {
  if (report.mismatchReported !== null && typeof report.mismatchReported !== 'boolean') {
    invalid('Mismatch reported must be a boolean or null.');
  }
  if (report.reporterSuspectedCondition && report.reporterSuspectedCondition.length > 120) {
    invalid('The suspected condition is too long.');
  }
  if (report.reporterObservationText && report.reporterObservationText.length > 1_000) {
    invalid('The reporter observation is too long.');
  }
}

function appendOptionalText(form: FormData, key: string, value: string | null): void {
  const normalized = value?.trim();
  if (normalized) {
    form.append(key, normalized);
  }
}

function isProbability(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

function invalid(message: string): never {
  throw new SyncError('INVALID_LOCAL_RECORD', message);
}
