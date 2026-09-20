import { File } from 'expo-file-system';

import type { FieldValidationCompletionUploadRecord } from '@/features/assignments/domain/fieldValidationCompletionTypes';
import { FIELD_VALIDATION_FOLLOW_UP_OUTCOMES } from '@/database/schema';
import {
  FIELD_VALIDATION_TEXT_MAX_LENGTH,
  isSupportedPhotoMimeType,
  isUuid,
} from '@/features/assignments/domain/fieldValidationCompletionValidation';
import { SyncError } from '@/features/sync/errors/syncErrors';

const UTC_ISO_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const GPS_OUTCOMES = ['resolved', 'low_accuracy', 'permission_denied', 'unavailable', 'error'] as const;

export interface FieldValidationCompletionMapperDependencies {
  createImageFile?: (uri: string) => Blob;
  imageExists?: (uri: string) => boolean;
}

export function mapFieldValidationCompletionToMultipart(
  record: FieldValidationCompletionUploadRecord,
  dependencies: FieldValidationCompletionMapperDependencies = {},
): FormData {
  const imageExists = dependencies.imageExists ?? ((uri: string) => new File(uri).exists);
  const createImageFile = dependencies.createImageFile ?? ((uri: string) => new File(uri));
  const completion = record.completion;
  validateCompletion(completion, imageExists);

  const form = new FormData();
  form.append('client_uuid', completion.id);
  form.append('field_observation', completion.fieldObservation.trim());
  form.append('field_finding', completion.fieldFinding.trim());
  form.append('action_taken', completion.actionTaken.trim());
  form.append('follow_up_outcome', completion.followUpOutcome);
  form.append('visited_at', completion.visitedAt);
  form.append('gps_outcome', completion.gpsOutcome);
  form.append('gps_attempted_at', completion.gpsAttemptedAt);
  appendNumber(form, 'gps_latitude', completion.gpsLatitude);
  appendNumber(form, 'gps_longitude', completion.gpsLongitude);
  appendNumber(form, 'gps_accuracy', completion.gpsAccuracy);

  if (completion.freshPhotoUri) {
    const image = createImageFile(completion.freshPhotoUri);
    validateImage(image, completion.freshPhotoMimeType, completion.freshPhotoSizeBytes);
    form.append('fresh_photo', image);
  }

  return form;
}

function validateCompletion(
  completion: FieldValidationCompletionUploadRecord['completion'],
  imageExists: (uri: string) => boolean,
): void {
  for (const [value, name] of [
    [completion.id, 'Completion'],
    [completion.assignmentId, 'Assignment'],
    [completion.reportUuid, 'Report'],
  ] as const) {
    if (!isUuid(value)) invalid(`${name} identity is invalid.`);
  }
  for (const [value, name] of [
    [completion.fieldObservation, 'Field observation'],
    [completion.fieldFinding, 'Field finding'],
    [completion.actionTaken, 'Action taken'],
  ] as const) {
    if (!value.trim() || value.trim().length > FIELD_VALIDATION_TEXT_MAX_LENGTH) {
      invalid(`${name} is required and must be no more than 2,000 characters.`);
    }
  }
  if (!(FIELD_VALIDATION_FOLLOW_UP_OUTCOMES as readonly string[]).includes(completion.followUpOutcome)) {
    invalid('Follow-up outcome is invalid.');
  }
  for (const [value, name] of [
    [completion.visitedAt, 'Visit time'],
    [completion.gpsAttemptedAt, 'GPS attempt time'],
  ] as const) {
    if (!UTC_ISO_PATTERN.test(value) || Number.isNaN(Date.parse(value))) {
      invalid(`${name} must be a UTC ISO timestamp.`);
    }
  }
  if (!(GPS_OUTCOMES as readonly string[]).includes(completion.gpsOutcome)) {
    invalid('GPS outcome is invalid.');
  }
  const coordinates = [completion.gpsLatitude, completion.gpsLongitude, completion.gpsAccuracy];
  const hasCoordinate = coordinates.some((value) => value !== null);
  if (hasCoordinate && coordinates.some((value) => value === null)) {
    invalid('GPS coordinates and accuracy must be recorded together.');
  }
  if (
    completion.gpsLatitude !== null &&
    (completion.gpsLatitude < -90 || completion.gpsLatitude > 90 || !Number.isFinite(completion.gpsLatitude))
  ) invalid('GPS latitude is invalid.');
  if (
    completion.gpsLongitude !== null &&
    (completion.gpsLongitude < -180 || completion.gpsLongitude > 180 || !Number.isFinite(completion.gpsLongitude))
  ) invalid('GPS longitude is invalid.');
  if (completion.gpsAccuracy !== null && (!Number.isFinite(completion.gpsAccuracy) || completion.gpsAccuracy < 0)) {
    invalid('GPS accuracy is invalid.');
  }
  if (completion.freshPhotoUri && !imageExists(completion.freshPhotoUri)) {
    throw new SyncError('IMAGE_MISSING', 'The saved field validation photo is missing.');
  }
  if (!completion.freshPhotoUri && (completion.freshPhotoMimeType !== null || completion.freshPhotoSizeBytes !== null)) {
    invalid('Fresh photo metadata is incomplete.');
  }
}

function validateImage(file: Blob, expectedMimeType: string | null, expectedSize: number | null): void {
  const mimeType = file.type.trim().toLowerCase();
  if (!isSupportedPhotoMimeType(mimeType) || mimeType !== expectedMimeType || file.size !== expectedSize || file.size <= 0 || file.size > MAX_PHOTO_BYTES) {
    invalid('The fresh field photo metadata is invalid.');
  }
}

function appendNumber(form: FormData, key: string, value: number | null): void {
  if (value !== null) form.append(key, String(value));
}

function invalid(message: string): never {
  throw new SyncError('INVALID_LOCAL_RECORD', message, { retryable: false });
}
