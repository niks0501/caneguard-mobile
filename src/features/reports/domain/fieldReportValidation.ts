import type {
  LocationUnavailableReason,
  MeasurementProvenance,
} from '@/database/schema';
import { StorageError } from '@/database/errors';
import { MODEL_LABELS } from '@/features/detection/constants/modelContract';
import { isValidSubmissionImageMetadata } from '@/features/sync/constants/mobileReportUploadContract';
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
const MAX_REGION_TEXT_LENGTH = 120;
const MAX_SUGARCANE_DETAIL_LENGTH = 100;
const MAX_FIELD_NOTES_LENGTH = 120;
const MAX_REPORTER_SUSPECTED_CONDITION_LENGTH = 120;
const MAX_REPORTER_OBSERVATION_TEXT_LENGTH = 1_000;
const MAX_AFFECTED_AREA_HECTARES = 10_000;
function hasCompleteClassScores(
  scores: FieldReportSubmissionEvidence['classScores'],
): boolean {
  if (
    scores.length !== MODEL_LABELS.length ||
    new Set(scores.map(({ label }) => label)).size !== MODEL_LABELS.length
  ) {
    return false;
  }

  return (
    scores.every(
      ({ label, score }) =>
        MODEL_LABELS.some((supportedLabel) => supportedLabel === label) &&
        Number.isFinite(score) &&
        score >= 0 &&
        score <= 1,
    ) &&
    MODEL_LABELS.every((supportedLabel) =>
      scores.some(({ label }) => label === supportedLabel),
    )
  );
}

export function validateCreateFieldReportDraftInput(
  input: CreateFieldReportDraftInput,
): void {
  validateUuid(input.id, 'Field Report');
  validateUuid(input.scanRecordId, 'Scan Record');
  validateUtcTimestamp(input.createdAt);
  validateSubmitterIdentity(input.submitterIdentity);
  if (input.submitterRole !== 'field_reporter') {
    invalid('The authenticated user is not a Field Inspector.');
  }
  if (input.province !== undefined) {
    validateRegionText(input.province, 'province');
  }
  if (input.municipality !== undefined) {
    validateRegionText(input.municipality, 'municipality');
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
  affectedAreaHectares: number | null;
  affectedAreaMeasurement: MeasurementProvenance;
  affectedPortionPercent: number | null;
  affectedPortionMeasurement: MeasurementProvenance;
  barangay: string | null;
  caneClass: string | null;
  cropAge: string | null;
  farmerOrFarmOwnerName: string | null;
  fieldNotes: string | null;
  mismatchReported: boolean | null;
  reporterObservationText: string | null;
  reporterSuspectedCondition: string | null;
  submittedAt: string;
  sugarcaneVariety: string | null;
  updatedAt: string;
} {
  validateUtcTimestamp(input.submittedAt);
  const values = normalizeFieldReportDraftInput(input);
  const areaMeasurement = validateMeasurementPairing(
    input.affectedAreaMeasurement ??
      resolveMeasurementProvenance(input.affectedAreaHectares),
    input.affectedAreaHectares,
    validateAffectedAreaHectares,
  );
  const portionMeasurement = validateMeasurementPairing(
    input.affectedPortionMeasurement ??
      resolveMeasurementProvenance(input.affectedPortionPercent),
    input.affectedPortionPercent,
    validateAffectedPortionPercent,
  );
  return {
    affectedAreaHectares: input.affectedAreaHectares,
    affectedAreaMeasurement: areaMeasurement,
    affectedPortionPercent: input.affectedPortionPercent,
    affectedPortionMeasurement: portionMeasurement,
    barangay: values.barangay ?? null,
    caneClass: values.caneClass ?? null,
    cropAge: values.cropAge ?? null,
    farmerOrFarmOwnerName: values.farmerOrFarmOwnerName ?? null,
    fieldNotes: values.fieldNotes ?? null,
    mismatchReported: values.mismatchReported ?? null,
    reporterObservationText: values.reporterObservationText ?? null,
    reporterSuspectedCondition: values.reporterSuspectedCondition ?? null,
    submittedAt: input.submittedAt,
    sugarcaneVariety: values.sugarcaneVariety ?? null,
    updatedAt: input.updatedAt,
  };
}

/**
 * D-01: a value is either measured with a number, or explicitly not measured and
 * empty. Provenance and value can never disagree once this returns.
 */
export function validateMeasurementPairing(
  measurement: MeasurementProvenance,
  value: number | null,
  validateValue: (value: number) => void,
): MeasurementProvenance {
  if (measurement !== 'measured' && measurement !== 'not_measured') {
    invalid('Report whether the value was measured or not measured.');
  }
  if (measurement === 'measured') {
    if (value === null) {
      invalid('A measured value needs a number.');
    }
    validateValue(value);
    return 'measured';
  }
  if (value !== null) {
    invalid('A value cannot be provided when it was not measured.');
  }
  return 'not_measured';
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
    !evidence.submissionImageUri?.trim() ||
    !evidence.submissionImageAvailable ||
    !isValidSubmissionImageMetadata({
      sourceUri: evidence.managedImageUri ?? '',
      submissionImageMimeType: evidence.submissionImageMimeType,
      submissionImageSizeBytes: evidence.submissionImageSizeBytes,
      submissionImageUri: evidence.submissionImageUri,
      expectedSubmissionImageUri: evidence.expectedSubmissionImageUri,
    })
  ) {
    missing.push('submission_image');
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
  if (!hasCompleteClassScores(evidence.classScores)) {
    missing.push('class_scores');
  }
  if (!evidence.checklistConsistency?.trim()) missing.push('symptom_checklist');
  if (!report.farmerOrFarmOwnerName?.trim()) {
    missing.push('farmer_or_farm_owner_name');
  }
  if (!report.submitterIdentity?.trim()) missing.push('submitter_identity');
  if (report.submitterRole !== 'field_reporter') missing.push('submitter_role');
  if (!report.province.trim()) missing.push('province');
  if (!report.municipality.trim()) missing.push('municipality');
  if (!report.barangay?.trim()) missing.push('barangay');
  if (report.affectedAreaMeasurement === 'measured' && report.affectedAreaHectares === null) {
    missing.push('affected_area_hectares');
  }
  if (report.affectedPortionMeasurement === 'measured' && report.affectedPortionPercent === null) {
    missing.push('affected_portion_percent');
  }

  if (report.locationSource === 'unavailable') {
    // D-02: a deliberately unlocated report still needs a bounded reason and
    // must not carry fabricated coordinates.
    if (!report.locationUnavailableReason) {
      missing.push('location_unavailable_reason');
    }
    if (report.finalLatitude !== null || report.finalLongitude !== null) {
      missing.push('final_coordinates');
    }
    if (report.gpsAccuracy !== null) {
      missing.push('gps_accuracy');
    }
  } else {
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
  }
  if (!isValidUtcTimestamp(report.observedAt)) missing.push('observation_time');
  return missing;
}

export function normalizeFieldReportDraftInput(
  input: SaveFieldReportDraftInput,
): {
  affectedAreaHectares?: number | null;
  affectedAreaMeasurement?: MeasurementProvenance;
  affectedPortionPercent?: number | null;
  affectedPortionMeasurement?: MeasurementProvenance;
  locationUnavailableReason?: LocationUnavailableReason | null;
  barangay?: string | null;
  caneClass?: string | null;
  cropAge?: string | null;
  farmerOrFarmOwnerName?: string | null;
  fieldNotes?: string | null;
  mismatchReported?: boolean | null;
  reporterObservationText?: string | null;
  reporterSuspectedCondition?: string | null;
  municipality?: string;
  province?: string;
  sugarcaneVariety?: string | null;
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
    ...(input.province === undefined
      ? {}
      : { province: normalizeRegionText(input.province) }),
    ...(input.municipality === undefined
      ? {}
      : { municipality: normalizeRegionText(input.municipality) }),
    ...(input.sugarcaneVariety === undefined
      ? {}
      : {
          sugarcaneVariety: normalizeOptionalText(
            input.sugarcaneVariety,
            MAX_SUGARCANE_DETAIL_LENGTH,
          ),
        }),
    ...(input.cropAge === undefined
      ? {}
      : {
          cropAge: normalizeOptionalText(
            input.cropAge,
            MAX_SUGARCANE_DETAIL_LENGTH,
          ),
        }),
    ...(input.caneClass === undefined
      ? {}
      : {
          caneClass: normalizeOptionalText(
            input.caneClass,
            MAX_SUGARCANE_DETAIL_LENGTH,
          ),
        }),
    ...(input.fieldNotes === undefined
      ? {}
      : {
          fieldNotes: normalizeOptionalText(
            input.fieldNotes,
            MAX_FIELD_NOTES_LENGTH,
          ),
        }),
    ...(input.mismatchReported === undefined
      ? {}
      : { mismatchReported: normalizeMismatchReported(input.mismatchReported) }),
    ...(input.reporterSuspectedCondition === undefined
      ? {}
      : {
          reporterSuspectedCondition: normalizeOptionalText(
            input.reporterSuspectedCondition,
            MAX_REPORTER_SUSPECTED_CONDITION_LENGTH,
          ),
        }),
    ...(input.reporterObservationText === undefined
      ? {}
      : {
          reporterObservationText: normalizeOptionalText(
            input.reporterObservationText,
            MAX_REPORTER_OBSERVATION_TEXT_LENGTH,
          ),
        }),
    ...(input.affectedAreaHectares === undefined
      ? {}
      : {
          affectedAreaHectares: normalizeOptionalAffectedArea(
            input.affectedAreaHectares,
          ),
          // D-01: an explicit measurement decision always wins; otherwise the
          // presence of a number is what makes the value measured.
          affectedAreaMeasurement:
            input.affectedAreaMeasurement === undefined
              ? resolveMeasurementProvenance(input.affectedAreaHectares)
              : normalizeMeasurementProvenance(input.affectedAreaMeasurement),
        }),
    ...(input.affectedPortionPercent === undefined
      ? {}
      : {
          affectedPortionPercent: normalizeOptionalAffectedPortion(
            input.affectedPortionPercent,
          ),
          affectedPortionMeasurement:
            input.affectedPortionMeasurement === undefined
              ? resolveMeasurementProvenance(input.affectedPortionPercent)
              : normalizeMeasurementProvenance(
                  input.affectedPortionMeasurement,
                ),
        }),
    ...(input.locationUnavailableReason === undefined
      ? {}
      : {
          locationUnavailableReason: normalizeLocationUnavailableReason(
            input.locationUnavailableReason,
          ),
        }),
  };
}

/**
 * D-01 default: a stored number reads as measured and an empty value reads as
 * explicitly not measured once the inspector finalizes.
 */
export function resolveMeasurementProvenance(
  value: number | null | undefined,
): MeasurementProvenance {
  return value === null || value === undefined ? 'not_measured' : 'measured';
}

function normalizeMeasurementProvenance(
  value: MeasurementProvenance,
): MeasurementProvenance {
  if (value !== 'measured' && value !== 'not_measured') {
    invalid('Report whether the value was measured or not measured.');
  }
  return value;
}

function normalizeLocationUnavailableReason(
  value: LocationUnavailableReason | null,
): LocationUnavailableReason | null {
  if (value === null) {
    return null;
  }
  if (
    value !== 'permission_denied' &&
    value !== 'services_unavailable' &&
    value !== 'low_accuracy' &&
    value !== 'offline_no_map' &&
    value !== 'other'
  ) {
    invalid('Choose why the location is unavailable.');
  }
  return value;
}

function normalizeOptionalText(
  value: string | null,
  maximumLength: number,
): string | null {
  if (value === null) {
    return null;
  }
  const normalized = value.trim();
  if (normalized.length > maximumLength) {
    invalid('A draft field is too long.');
  }
  return normalized || null;
}

function normalizeRegionText(value: string): string {
  const normalized = value.trim();
  if (!normalized) {
    invalid('The region field is empty.');
  }
  if (normalized.length > MAX_REGION_TEXT_LENGTH) {
    invalid('A region field is too long.');
  }
  return normalized;
}

function validateRegionText(value: string, label: string): void {
  const normalized = value.trim();
  if (!normalized) {
    invalid(`The ${label} is empty.`);
  }
  if (normalized.length > MAX_REGION_TEXT_LENGTH) {
    invalid(`The ${label} is too long.`);
  }
}

function normalizeMismatchReported(value: boolean | null): boolean | null {
  if (value !== null && typeof value !== 'boolean') {
    invalid('Mismatch reported must be a boolean or null.');
  }
  return value;
}

function normalizeOptionalAffectedArea(value: number | null): number | null {
  if (value === null) {
    return null;
  }
  validateAffectedAreaHectares(value);
  return value;
}

function normalizeOptionalAffectedPortion(value: number | null): number | null {
  if (value === null) {
    return null;
  }
  validateAffectedPortionPercent(value);
  return value;
}

function validateAffectedAreaHectares(value: number): void {
  if (
    !Number.isFinite(value) ||
    value <= 0 ||
    value > MAX_AFFECTED_AREA_HECTARES
  ) {
    invalid(
      `Affected area must be greater than 0 and at most ${MAX_AFFECTED_AREA_HECTARES} hectares.`,
    );
  }
}

function validateAffectedPortionPercent(value: number): void {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    invalid('Estimated affected portion must be between 0 and 100 percent.');
  }
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
