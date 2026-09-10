import { Directory, File, Paths } from 'expo-file-system';

import { StorageError, toStorageError } from '@/database/errors';
import {
  isSafeOwnerIdentity,
  requireOwnerIdentity,
} from '@/database/ownerIdentity';
import {
  isSupportedPhotoMimeType,
  isUuid,
} from '@/features/assignments/domain/fieldValidationCompletionValidation';

const PHOTO_DIRECTORY_NAME = 'field-validation';
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export interface FieldValidationPhotoInput {
  ownerIdentity: string;
  assignmentId: string;
  completionId: string;
  fileName?: string | null;
  mimeType?: string | null;
  sourceUri: string;
}

export interface FieldValidationPhotoArtifact {
  mimeType: string;
  sizeBytes: number;
  uri: string;
}

export function getFieldValidationPhotoDirectory(ownerIdentity?: string): Directory {
  return ownerIdentity === undefined
    ? new Directory(Paths.document, 'caneguard', PHOTO_DIRECTORY_NAME)
    : new Directory(
        Paths.document,
        'caneguard',
        PHOTO_DIRECTORY_NAME,
        requireOwnerIdentity(ownerIdentity),
      );
}

export async function persistFieldValidationPhoto(
  input: FieldValidationPhotoInput,
): Promise<FieldValidationPhotoArtifact> {
  validateInput(input);
  const mimeType = resolveMimeType(input);
  const extension = MIME_TO_EXTENSION[mimeType];
  const directory = getFieldValidationPhotoDirectory(input.ownerIdentity);
  const destination = new File(
    directory,
    `${input.assignmentId}-${input.completionId}.${extension}`,
  );

  try {
    directory.create({ idempotent: true, intermediates: true });
    await new File(input.sourceUri).copy(destination, { overwrite: false });
    if (!destination.exists) {
      throw new Error('The field validation photo was not copied.');
    }
    const size = destination.info().size;
    if (typeof size !== 'number' || !Number.isInteger(size) || size <= 0 || size > MAX_PHOTO_BYTES) {
      throw new Error('The field validation photo size is outside the accepted limit.');
    }
    return { mimeType, sizeBytes: size, uri: destination.uri };
  } catch (error: unknown) {
    removePhoto(destination.uri);
    throw toStorageError(
      error,
      'IMAGE_COPY_FAILED',
      'The field validation photo could not be saved on this device.',
    );
  }
}

export function deleteFieldValidationPhoto(
  uri: string,
  ownerIdentity: string,
): void {
  let owner: string;
  try {
    owner = requireOwnerIdentity(ownerIdentity);
  } catch {
    return;
  }
  if (!isManagedFieldValidationPhotoUri(uri, owner)) {
    return;
  }
  removePhoto(uri);
}

export function isManagedFieldValidationPhotoUri(
  uri: string,
  ownerIdentity?: string,
): boolean {
  const directory = getFieldValidationPhotoDirectory().uri;
  if (!uri.startsWith(`${directory}/`)) {
    return false;
  }
  const relative = uri.slice(directory.length + 1).split('/');
  const filename = relative.at(-1);
  const normalizedOwner =
    ownerIdentity === undefined ? null : requireOwnerIdentity(ownerIdentity);
  const scoped =
    relative.length === 2 &&
    isSafeOwnerIdentity(relative[0]) &&
    (!normalizedOwner || relative[0] === normalizedOwner) &&
    filename;
  // Unscoped legacy files are accepted for read-only validation, but an
  // owner-scoped deletion never treats them as belonging to that owner.
  const legacy = !normalizedOwner && relative.length === 1 && filename;
  return Boolean((scoped || legacy) && filename && !filename.includes('..'));
}

function validateInput(input: FieldValidationPhotoInput): void {
  try {
    requireOwnerIdentity(input.ownerIdentity);
  } catch {
    throw new StorageError(
      'INVALID_FIELD_VALIDATION_COMPLETION',
      'The field validation owner identity is invalid.',
    );
  }
  if (!isUuid(input.assignmentId) || !isUuid(input.completionId)) {
    throw new StorageError('INVALID_FIELD_VALIDATION_COMPLETION', 'The field validation photo identity is invalid.');
  }
  if (!input.sourceUri.trim()) {
    throw new StorageError('IMAGE_NOT_FOUND', 'The field validation photo URI is missing.');
  }
}

function resolveMimeType(input: FieldValidationPhotoInput): string {
  const candidate = input.mimeType?.split(';', 1)[0].trim().toLowerCase();
  if (candidate && isSupportedPhotoMimeType(candidate)) {
    return candidate;
  }
  const fileName = input.fileName ?? input.sourceUri;
  const extension = fileName.split(/[?#]/, 1)[0].split('.').pop()?.toLowerCase();
  const mimeType = extension === 'jpg' || extension === 'jpeg'
    ? 'image/jpeg'
    : extension === 'png'
      ? 'image/png'
      : extension === 'webp'
        ? 'image/webp'
        : null;
  if (!mimeType) {
    throw new StorageError('IMAGE_COPY_FAILED', 'The field validation photo format is unsupported.');
  }
  return mimeType;
}

function removePhoto(uri: string): void {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Keep the original persistence error actionable. A later diagnostics pass can find the file.
  }
}
