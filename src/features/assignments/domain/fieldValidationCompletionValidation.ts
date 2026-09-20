import { StorageError } from '@/database/errors';
import {
  FIELD_VALIDATION_FOLLOW_UP_OUTCOMES,
  FIELD_VALIDATION_GPS_OUTCOMES,
  type FieldValidationGpsOutcome,
} from '@/database/schema';
import type { SaveFieldValidationCompletionInput } from '@/features/assignments/domain/fieldValidationCompletionTypes';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const UTC_ISO_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
export const FIELD_VALIDATION_TEXT_MAX_LENGTH = 2_000;

export function validateFieldValidationCompletionInput(
  input: SaveFieldValidationCompletionInput,
): void {
  validateUuid(input.id, 'Completion');
  validateUuid(input.assignmentId, 'Assignment');
  validateUuid(input.reportUuid, 'Report');
  validateRequiredText(input.fieldObservation, 'Field observation');
  validateRequiredText(input.fieldFinding, 'Field finding');
  validateRequiredText(input.actionTaken, 'Action taken');
  validateTimestamp(input.visitedAt, 'Visit time');
  validateTimestamp(input.gpsAttemptedAt, 'GPS attempt time');
  if (!isGpsOutcome(input.gpsOutcome)) {
    invalid('GPS outcome is invalid.');
  }
  if (!isFollowUpOutcome(input.followUpOutcome)) {
    invalid('Follow-up outcome is invalid.');
  }

  const hasLatitude = input.gpsLatitude !== null && input.gpsLatitude !== undefined;
  const hasLongitude = input.gpsLongitude !== null && input.gpsLongitude !== undefined;
  const hasAccuracy = input.gpsAccuracy !== null && input.gpsAccuracy !== undefined;
  if (hasLatitude !== hasLongitude || (hasLatitude || hasLongitude) !== hasAccuracy) {
    invalid('GPS coordinates and accuracy must be recorded together.');
  }
  if (
    hasLatitude &&
    (!Number.isFinite(input.gpsLatitude) || input.gpsLatitude! < -90 || input.gpsLatitude! > 90)
  ) {
    invalid('GPS latitude is invalid.');
  }
  if (
    hasLongitude &&
    (!Number.isFinite(input.gpsLongitude) || input.gpsLongitude! < -180 || input.gpsLongitude! > 180)
  ) {
    invalid('GPS longitude is invalid.');
  }
  if (hasAccuracy && (!Number.isFinite(input.gpsAccuracy) || input.gpsAccuracy! < 0)) {
    invalid('GPS accuracy is invalid.');
  }
  if (input.freshPhotoUri !== null && input.freshPhotoUri !== undefined) {
    if (!input.freshPhotoUri.trim()) invalid('Fresh photo URI is invalid.');
    if (!input.freshPhotoMimeType || !isSupportedPhotoMimeType(input.freshPhotoMimeType)) {
      invalid('Fresh photo MIME type is invalid.');
    }
    if (
      input.freshPhotoSizeBytes === null ||
      input.freshPhotoSizeBytes === undefined ||
      !Number.isInteger(input.freshPhotoSizeBytes) ||
      input.freshPhotoSizeBytes <= 0
    ) {
      invalid('Fresh photo size is invalid.');
    }
  } else if (input.freshPhotoMimeType !== null && input.freshPhotoMimeType !== undefined) {
    invalid('Fresh photo metadata requires a photo URI.');
  }
}

export function normalizeFieldValidationText(value: string): string {
  const normalized = value.trim();
  if (!normalized || normalized.length > FIELD_VALIDATION_TEXT_MAX_LENGTH) {
    invalid('Field validation evidence is required and must be no more than 2,000 characters.');
  }
  return normalized;
}

export function isSupportedPhotoMimeType(value: string): boolean {
  return ['image/jpeg', 'image/png', 'image/webp'].includes(value.trim().toLowerCase());
}

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function validateRequiredText(value: string, name: string): void {
  if (!value.trim() || value.trim().length > FIELD_VALIDATION_TEXT_MAX_LENGTH) {
    invalid(`${name} is required and must be no more than 2,000 characters.`);
  }
}

function validateUuid(value: string, name: string): void {
  if (!isUuid(value)) invalid(`${name} identity is invalid.`);
}

function validateTimestamp(value: string, name: string): void {
  if (!UTC_ISO_PATTERN.test(value) || Number.isNaN(Date.parse(value))) {
    invalid(`${name} must be a UTC ISO timestamp.`);
  }
}

function isGpsOutcome(value: string): value is FieldValidationGpsOutcome {
  return (FIELD_VALIDATION_GPS_OUTCOMES as readonly string[]).includes(value);
}

function isFollowUpOutcome(value: string): boolean {
  return (FIELD_VALIDATION_FOLLOW_UP_OUTCOMES as readonly string[]).includes(value);
}

function invalid(message: string): never {
  throw new StorageError('INVALID_FIELD_VALIDATION_COMPLETION', message);
}
