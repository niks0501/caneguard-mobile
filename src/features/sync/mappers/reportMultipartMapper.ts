import { File } from 'expo-file-system';

import { CHECKLIST_OBSERVATIONS } from '@/features/detection/checklist/checklistConsistency';
import { MODEL_LABELS } from '@/features/detection/constants/modelContract';
import type { ScanRecordDetails } from '@/features/records/domain/recordTypes';
import {
  getSubmissionImageUri,
  managedImageExists,
} from '@/features/records/services/scanImageStorage';
import type { FieldReportUploadRecord } from '@/features/reports/data/fieldReportSyncRepository';
import {
  isValidSubmissionImageMetadata,
  MOBILE_REPORT_UPLOAD_V1_IMAGE_MAX_BYTES,
  MOBILE_REPORT_UPLOAD_V1_IMAGE_MIME_TYPES,
  normalizeMobileReportImageMimeType,
} from '@/features/sync/constants/mobileReportUploadContract';
import { SyncError } from '@/features/sync/errors/syncErrors';

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const UTC_ISO_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const IMAGE_SOURCE_TYPES = ['camera', 'gallery'] as const;
const REPORTED_SEVERITIES = ['Mild', 'Moderate', 'Severe'] as const;
const LOCATION_SOURCES = ['gps', 'manual_map'] as const;
const SYMPTOM_KEYS = CHECKLIST_OBSERVATIONS.map(({ id }) => id);
const QUALITY_WARNING_KEYS = [
  'low-resolution',
  'too-dark',
  'too-bright',
  'low-contrast',
] as const;
const MAX_SOURCE_DIMENSION = 50_000;
const MAX_TIMING_MS = 999_999_999;
// This existing mobile-domain ceiling is stricter than v1's open upper
// bound and therefore remains a safe subset of the server contract.
const MAX_AFFECTED_AREA_HECTARES = 10_000;
const MAX_FARMER_NAME_LENGTH = 160;
const MAX_REGION_TEXT_LENGTH = 120;
const MAX_SUGARCANE_DETAIL_LENGTH = 100;
// Field notes retain the existing 120-character mobile ceiling versus v1's
// 5,000-character maximum.
const MAX_FIELD_NOTES_LENGTH = 120;
const MAX_CHECKLIST_CONSISTENCY_LENGTH = 40;
const MAX_REPORTED_SEVERITY_LENGTH = 20;
const MAX_REPORTER_SUSPECTED_CONDITION_LENGTH = 120;
const MAX_REPORTER_OBSERVATION_TEXT_LENGTH = 1_000;
const MAX_MODEL_VERSION_LENGTH = 100;

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
  const submissionImageUri = validateReport(report, scanRecord, imageExists);

  const image = createImageFile(submissionImageUri);
  validateImageFile(image, scanRecord);

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
    const score = scanRecord.classScores.find((item) => item.label === label);
    if (!score) {
      invalid('Every supported class score is required.');
    }
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
  appendOptionalText(form, 'province', report.province);
  appendOptionalText(form, 'municipality', report.municipality);
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
  form.append('model_version', scanRecord.modelVersion);
  appendNumber(form, 'preprocess_ms', scanRecord.preprocessMs);
  appendNumber(form, 'inference_ms', scanRecord.inferenceMs);
  appendNumber(form, 'total_ms', scanRecord.totalMs);
  form.append('captured_at', scanRecord.createdAt);
  form.append('image', image);

  return form;
}

function validateReport(
  report: FieldReportUploadRecord['report'],
  record: ScanRecordDetails,
  imageExists: (uri: string) => boolean,
): string {
  validateUuid(report.id, 'Field Report');
  validateUuid(record.id, 'Scan Record');

  const submissionImageUri =
    typeof record.submissionImageUri === 'string'
      ? record.submissionImageUri.trim()
      : '';
  if (
    typeof record.managedImageUri !== 'string' ||
    !record.managedImageUri.trim() ||
    !submissionImageUri ||
    !isValidSubmissionImageMetadata({
      sourceUri: record.managedImageUri,
      submissionImageMimeType: record.submissionImageMimeType,
      submissionImageSizeBytes: record.submissionImageSizeBytes,
      submissionImageUri,
      expectedSubmissionImageUri: getSubmissionImageUri(
        record.id,
        record.ownerIdentity,
      ),
    })
  ) {
    invalid('A valid persisted submission image is required.');
  }
  if (!imageExists(submissionImageUri)) {
    throw new SyncError('IMAGE_MISSING', 'The persisted submission image is missing.');
  }
  if (
    !normalizeMobileReportImageMimeType(record.submissionImageMimeType) ||
    !isIntegerInRange(
      record.submissionImageSizeBytes,
      1,
      MOBILE_REPORT_UPLOAD_V1_IMAGE_MAX_BYTES,
    )
  ) {
    invalid('Persisted submission image metadata is incomplete.');
  }

  if (report.authoringState !== 'finalized' || report.syncStatus === 'local_only') {
    invalid('Only a finalized Field Report can be uploaded.');
  }
  validateRequiredText(
    report.farmerOrFarmOwnerName,
    'Farmer or farm reference',
    MAX_FARMER_NAME_LENGTH,
  );
  validateRequiredText(report.barangay, 'Barangay', MAX_REGION_TEXT_LENGTH);
  validateOptionalText(report.province, 'Province', MAX_REGION_TEXT_LENGTH);
  validateOptionalText(report.municipality, 'Municipality', MAX_REGION_TEXT_LENGTH);
  validateMismatchFields(report);

  if (!report.submitterIdentity || report.submitterRole !== 'field_reporter') {
    invalid('Authenticated Field Report submitter context is required.');
  }
  validateRequiredUtcTimestamp(report.observedAt, 'Observation time');
  validateRequiredUtcTimestamp(report.submittedAt, 'Submission time');

  validateRequiredNumber(report.finalLatitude, -90, 90, 'Final latitude');
  validateRequiredNumber(report.finalLongitude, -180, 180, 'Final longitude');
  if (!isOneOf(report.locationSource, LOCATION_SOURCES)) {
    invalid('Valid location provenance is required.');
  }
  if (report.locationSource === 'gps') {
    validateRequiredNumber(report.gpsAccuracy, 0, undefined, 'GPS accuracy');
  } else if (report.gpsAccuracy !== null) {
    invalid('GPS accuracy is only valid for GPS locations.');
  }

  if (!isOneOf(record.imageSourceType, IMAGE_SOURCE_TYPES)) {
    invalid('The image source type is unsupported.');
  }
  if (!isOneOf(record.predictedLabel, MODEL_LABELS)) {
    invalid('The predicted label is unsupported.');
  }
  validateProbability(record.confidence, 'confidence');
  validateClassScores(record.classScores);
  validateSymptoms(record.symptoms);
  validateRequiredText(
    record.checklistConsistency,
    'Checklist consistency',
    MAX_CHECKLIST_CONSISTENCY_LENGTH,
  );
  if (
    record.reportedSeverity !== null &&
    (!isOneOf(record.reportedSeverity, REPORTED_SEVERITIES) ||
      record.reportedSeverity.length > MAX_REPORTED_SEVERITY_LENGTH)
  ) {
    invalid('The reported severity is unsupported.');
  }
  validateQualityWarnings(record.qualityWarnings);
  validateRequiredInteger(record.sourceWidth, 1, MAX_SOURCE_DIMENSION, 'Source width');
  validateRequiredInteger(record.sourceHeight, 1, MAX_SOURCE_DIMENSION, 'Source height');
  validateRequiredText(
    record.modelVersion,
    'Model version',
    MAX_MODEL_VERSION_LENGTH,
  );
  validateNumber(record.preprocessMs, 0, MAX_TIMING_MS, 'Preprocessing timing');
  validateNumber(record.inferenceMs, 0, MAX_TIMING_MS, 'Inference timing');
  validateNumber(record.totalMs, 0, MAX_TIMING_MS, 'Total timing');
  validateRequiredUtcTimestamp(record.createdAt, 'Capture time');

  validateOptionalText(
    report.sugarcaneVariety,
    'Sugarcane variety',
    MAX_SUGARCANE_DETAIL_LENGTH,
  );
  validateOptionalText(report.cropAge, 'Crop age', MAX_SUGARCANE_DETAIL_LENGTH);
  validateOptionalText(report.caneClass, 'Cane class', MAX_SUGARCANE_DETAIL_LENGTH);
  validateOptionalText(report.fieldNotes, 'Field notes', MAX_FIELD_NOTES_LENGTH);
  validateOptionalNumber(
    report.affectedAreaHectares,
    0,
    MAX_AFFECTED_AREA_HECTARES,
    'Affected area',
    true,
  );
  validateOptionalNumber(
    report.affectedPortionPercent,
    0,
    100,
    'Affected portion',
  );

  return submissionImageUri;
}

function validateImageFile(file: Blob, record: ScanRecordDetails): void {
  const wireMimeType =
    typeof file?.type === 'string'
      ? file.type.trim().toLowerCase()
      : null;
  const mimeType = normalizeMobileReportImageMimeType(file?.type);
  if (
    !wireMimeType ||
    !MOBILE_REPORT_UPLOAD_V1_IMAGE_MIME_TYPES.includes(
      wireMimeType as (typeof MOBILE_REPORT_UPLOAD_V1_IMAGE_MIME_TYPES)[number],
    ) ||
    !mimeType ||
    !isIntegerInRange(file?.size, 1, MOBILE_REPORT_UPLOAD_V1_IMAGE_MAX_BYTES) ||
    file.size !== record.submissionImageSizeBytes ||
    mimeType !== normalizeMobileReportImageMimeType(record.submissionImageMimeType)
  ) {
    invalid('The persisted submission image file metadata is invalid.');
  }
}

function validateMismatchFields(
  report: FieldReportUploadRecord['report'],
): void {
  if (report.mismatchReported !== null && typeof report.mismatchReported !== 'boolean') {
    invalid('Mismatch reported must be a boolean or null.');
  }
  validateOptionalText(
    report.reporterSuspectedCondition,
    'Reporter suspected condition',
    MAX_REPORTER_SUSPECTED_CONDITION_LENGTH,
  );
  validateOptionalText(
    report.reporterObservationText,
    'Reporter observation',
    MAX_REPORTER_OBSERVATION_TEXT_LENGTH,
  );
}

function validateClassScores(
  scores: ScanRecordDetails['classScores'],
): void {
  if (!Array.isArray(scores) || scores.length !== MODEL_LABELS.length) {
    invalid('Every supported class score is required.');
  }
  const labels = new Set<string>();
  for (const score of scores) {
    if (!isOneOf(score?.label, MODEL_LABELS) || labels.has(score.label)) {
      invalid('The class score labels are unsupported.');
    }
    labels.add(score.label);
    validateProbability(score.score, 'class score');
  }
  if (MODEL_LABELS.some((label) => !labels.has(label))) {
    invalid('Every supported class score is required.');
  }
}

function validateSymptoms(symptoms: ScanRecordDetails['symptoms']): void {
  if (!Array.isArray(symptoms) || symptoms.length < 1) {
    invalid('At least one supported symptom key is required.');
  }
  const values = new Set<string>();
  for (const symptom of symptoms) {
    if (!isOneOf(symptom, SYMPTOM_KEYS) || values.has(symptom)) {
      invalid('The symptom keys are unsupported or duplicated.');
    }
    values.add(symptom);
  }
}

function validateQualityWarnings(
  warnings: ScanRecordDetails['qualityWarnings'],
): void {
  if (!Array.isArray(warnings)) {
    invalid('The quality warning list is invalid.');
  }
  const values = new Set<string>();
  for (const warning of warnings) {
    if (!isOneOf(warning, QUALITY_WARNING_KEYS) || values.has(warning)) {
      invalid('The quality warnings are unsupported or duplicated.');
    }
    values.add(warning);
  }
}

function appendNumber(
  form: FormData,
  key: string,
  value: number | null | undefined,
): void {
  if (value !== null && value !== undefined) {
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

function appendOptionalText(
  form: FormData,
  key: string,
  value: string | null | undefined,
): void {
  const normalized = value?.trim();
  if (normalized) {
    form.append(key, normalized);
  }
}

function validateUuid(value: unknown, name: string): void {
  if (typeof value !== 'string' || !UUID_V4_PATTERN.test(value)) {
    invalid(`${name} identity must be UUIDv4.`);
  }
}

function validateRequiredUtcTimestamp(value: unknown, name: string): void {
  if (
    typeof value !== 'string' ||
    !UTC_ISO_PATTERN.test(value) ||
    Number.isNaN(Date.parse(value))
  ) {
    invalid(`${name} must be a UTC ISO timestamp.`);
  }
}

function validateRequiredText(
  value: unknown,
  name: string,
  maximumLength: number,
): string {
  const normalized = validateOptionalText(value, name, maximumLength);
  if (!normalized) {
    invalid(`${name} is required.`);
  }
  return normalized;
}

function validateOptionalText(
  value: unknown,
  name: string,
  maximumLength: number,
): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== 'string' || value.length > maximumLength) {
    invalid(`${name} is too long or invalid.`);
  }
  const normalized = value.trim();
  return normalized || null;
}

function validateRequiredInteger(
  value: unknown,
  minimum: number,
  maximum: number,
  name: string,
): void {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < minimum ||
    value > maximum
  ) {
    invalid(`${name} is outside the accepted range.`);
  }
}

function validateRequiredNumber(
  value: unknown,
  minimum: number,
  maximum: number | undefined,
  name: string,
): void {
  validateNumber(value, minimum, maximum, name);
}

function validateOptionalNumber(
  value: unknown,
  minimum: number,
  maximum: number,
  name: string,
  exclusiveMinimum = false,
): void {
  if (value === null || value === undefined) {
    return;
  }
  validateNumber(value, minimum, maximum, name, exclusiveMinimum);
}

function validateNumber(
  value: unknown,
  minimum: number,
  maximum: number | undefined,
  name: string,
  exclusiveMinimum = false,
): void {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    (exclusiveMinimum ? value <= minimum : value < minimum) ||
    (maximum !== undefined && value > maximum)
  ) {
    invalid(`${name} is outside the accepted range.`);
  }
}

function validateProbability(value: unknown, name: string): void {
  validateNumber(value, 0, 1, name);
}

function isIntegerInRange(
  value: unknown,
  minimum: number,
  maximum: number,
): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= minimum &&
    value <= maximum
  );
}

function isOneOf(value: unknown, values: readonly string[]): value is string {
  return typeof value === 'string' && values.includes(value);
}

function invalid(message: string): never {
  throw new SyncError('INVALID_LOCAL_RECORD', message);
}
