import { StorageError } from '@/database/errors';
import type {
  CreateFieldReportDraftInput,
  SaveGpsCaptureInput,
  SaveFieldReportDraftInput,
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
  if (!UTC_ISO_PATTERN.test(value) || Number.isNaN(Date.parse(value))) {
    invalid('A draft timestamp is invalid.');
  }
}

function invalid(message: string): never {
  throw new StorageError('INVALID_FIELD_REPORT', message);
}
