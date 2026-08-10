import { StorageError } from '@/database/errors';
import { MODEL_LABELS } from '@/features/detection/constants/modelContract';
import type {
  CreateFieldReportDraftInput,
  FieldReport,
  FieldReportSubmissionEvidence,
  FieldReportSubmissionRequirement,
  FinalizeFieldReportInput,
  SaveGpsCaptureInput,
  SaveFieldReportDraftInput,
  SaveManualMapLocationInput,
} from '@/features/reports/domain/fieldReportTypes';

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const UTC_ISO_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const MAX_NAME_LENGTH = 160;
const MAX_BARANGAY_LENGTH = 120;

export function validateCreateFieldReportDraftInput(
  input: CreateFieldReportDraftInput,
): void {
  validateUuid(input.id, 'Field Report');
  validateUuid(input.scanRecordId, 'Scan Record');
  validateUtcTimestamp(input.createdAt);
  validateSubmitterIdentity(input.submitterIdentity);
  if (input.submitterRole !== 'field_reporter') {
    invalid('The authenticated user is not a field reporter.');
  }
}

export function validateGpsCaptureInput(input: SaveGpsCaptureInput): void {
  validateUtcTimestamp(input.capturedAt);
  validateUtcTimestamp(input.updatedAt);
  if ('latitude' in input) {
    if (!Number.isFinite(input.latitude) || input.latitude < -90 || input.latitude > 90) {
      invalid('GPS latitude is invalid.');
    }
    if (
      !Number.isFinite(input.longitude) ||
      input.longitude < -180 ||
      input.longitude > 180
    ) {
      invalid('GPS longitude is invalid.');
    }
    if (!Number.isFinite(input.accuracy) || input.accuracy < 0) {
      invalid('GPS accuracy is invalid.');
    }
  }
}

export function validateManualMapLocationInput(
  input: SaveManualMapLocationInput,
): void {
  validateCoordinates(input.latitude, input.longitude, 'Manual map');
  validateUtcTimestamp(input.selectedAt);
  validateUtcTimestamp(input.updatedAt);
}

export function normalizeFinalizeFieldReportInput(
  input: FinalizeFieldReportInput,
): {
  barangay: string | null;
  farmerOrFarmOwnerName: string | null;
  submittedAt: string;
  updatedAt: string;
} {
  validateUtcTimestamp(input.submittedAt);
  const values = normalizeFieldReportDraftInput(input);
  return {
    barangay: values.barangay ?? null,
    farmerOrFarmOwnerName: values.farmerOrFarmOwnerName ?? null,
    submittedAt: input.submittedAt,
    updatedAt: input.updatedAt,
  };
}

export function getMissingSubmissionRequirements(
  report: FieldReport,
  evidence: FieldReportSubmissionEvidence,
): FieldReportSubmissionRequirement[] {
  const missing: FieldReportSubmissionRequirement[] = [];
  if (!evidence.managedImageUri?.trim() || !evidence.managedImageAvailable) {
    missing.push('original_scan_image');
  }
  if (
    evidence.sourceWidth === null ||
    evidence.sourceHeight === null ||
    !Number.isFinite(evidence.sourceWidth) ||
    !Number.isFinite(evidence.sourceHeight) ||
    evidence.sourceWidth <= 0 ||
    evidence.sourceHeight <= 0
  ) {
    missing.push('source_image_dimensions');
  }
  if (
    !evidence.predictedLabel ||
    !MODEL_LABELS.some((label) => label === evidence.predictedLabel)
  ) {
    missing.push('ai_supported_result');
  }
  if (
    evidence.confidence === null ||
    !Number.isFinite(evidence.confidence) ||
    evidence.confidence < 0 ||
    evidence.confidence > 1
  ) {
    missing.push('confidence');
  }
  if (
    evidence.classScores.length !== MODEL_LABELS.length ||
    new Set(evidence.classScores.map(({ label }) => label)).size !==
      MODEL_LABELS.length ||
    evidence.classScores.some(
      ({ label, score }) =>
        !MODEL_LABELS.some((modelLabel) => modelLabel === label) ||
        !Number.isFinite(score) ||
        score < 0 ||
        score > 1,
    ) ||
    MODEL_LABELS.some(
      (modelLabel) =>
        !evidence.classScores.some(({ label }) => label === modelLabel),
    )
  ) {
    missing.push('class_scores');
  }
  if (!evidence.checklistConsistency?.trim()) missing.push('symptom_checklist');
  if (!report.farmerOrFarmOwnerName?.trim()) {
    missing.push('farmer_or_farm_owner_name');
  }
  if (!report.submitterIdentity?.trim()) missing.push('submitter_identity');
  if (report.submitterRole !== 'field_reporter') missing.push('submitter_role');
  if (report.province.trim() !== 'Batangas') missing.push('province');
  if (report.municipality.trim() !== 'Nasugbu') missing.push('municipality');
  if (!report.barangay?.trim()) missing.push('barangay');

  const coordinatesValid =
    report.finalLatitude !== null &&
    report.finalLongitude !== null &&
    coordinatesAreValid(report.finalLatitude, report.finalLongitude);
  if (!coordinatesValid) missing.push('final_coordinates');
  if (report.locationSource !== 'gps' && report.locationSource !== 'manual_map') {
    missing.push('location_source');
  }
  if (
    (report.locationSource === 'gps' &&
      (report.gpsAccuracy === null ||
        !Number.isFinite(report.gpsAccuracy) ||
        report.gpsAccuracy < 0)) ||
    (report.locationSource === 'manual_map' && report.gpsAccuracy !== null)
  ) {
    missing.push('gps_accuracy');
  }
  if (!isValidUtcTimestamp(report.observedAt)) missing.push('observation_time');
  return missing;
}

export function normalizeFieldReportDraftInput(
  input: SaveFieldReportDraftInput,
): {
  barangay?: string | null;
  farmerOrFarmOwnerName?: string | null;
  updatedAt: string;
} {
  validateUtcTimestamp(input.updatedAt);

  return {
    updatedAt: input.updatedAt,
    ...(input.barangay === undefined
      ? {}
      : { barangay: normalizeOptionalText(input.barangay, MAX_BARANGAY_LENGTH) }),
    ...(input.farmerOrFarmOwnerName === undefined
      ? {}
      : {
          farmerOrFarmOwnerName: normalizeOptionalText(
            input.farmerOrFarmOwnerName,
            MAX_NAME_LENGTH,
          ),
        }),
  };
}

function normalizeOptionalText(value: string, maximumLength: number): string | null {
  const normalized = value.trim();
  if (normalized.length > maximumLength) {
    invalid('A draft field is too long.');
  }
  return normalized || null;
}

function validateUuid(value: string, name: string): void {
  if (!UUID_V4_PATTERN.test(value)) {
    invalid(`${name} identity must be UUIDv4.`);
  }
}

function validateSubmitterIdentity(value: string): void {
  if (!value.trim() || value.length > 160) {
    invalid('Submitter identity is invalid.');
  }
}

function validateUtcTimestamp(value: string): void {
  if (!isValidUtcTimestamp(value)) {
    invalid('A draft timestamp is invalid.');
  }
}

function isValidUtcTimestamp(value: string): boolean {
  return UTC_ISO_PATTERN.test(value) && !Number.isNaN(Date.parse(value));
}

function validateCoordinates(
  latitude: number,
  longitude: number,
  source: string,
): void {
  if (!coordinatesAreValid(latitude, longitude)) {
    invalid(`${source} coordinates are invalid.`);
  }
}

function coordinatesAreValid(latitude: number, longitude: number): boolean {
  return (
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function invalid(message: string): never {
  throw new StorageError('INVALID_FIELD_REPORT', message);
}
