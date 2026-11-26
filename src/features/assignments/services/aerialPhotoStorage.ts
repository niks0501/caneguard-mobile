import { Directory, File, Paths } from 'expo-file-system';

import { StorageError, toStorageError } from '@/database/errors';
import { requireOwnerIdentity } from '@/database/ownerIdentity';
import {
  isSupportedPhotoMimeType,
  isUuid,
} from '@/features/assignments/domain/fieldValidationCompletionValidation';

const AERIAL_DIRECTORY_NAME = 'aerial-uploads';
export const MAX_AERIAL_PHOTO_BYTES = 20 * 1024 * 1024;
const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export interface AerialPhotoInput {
  ownerIdentity: string;
  assignmentId: string;
  uploadId: string;
  fileName?: string | null;
  mimeType?: string | null;
  sourceUri: string;
}

export interface AerialPhotoArtifact {
  mimeType: string;
  sizeBytes: number;
  uri: string;
}

export function getAerialUploadPhotoDirectory(ownerIdentity: string): Directory {
  return new Directory(
    Paths.document,
    'caneguard',
    AERIAL_DIRECTORY_NAME,
    requireOwnerIdentity(ownerIdentity),
  );
}

/**
 * Copy a picked drone gallery photo into owner-scoped offline storage up to
 * the 20 MiB aerial upload cap so queued uploads survive picker cache expiry.
 */
export async function persistAerialUploadPhoto(
  input: AerialPhotoInput,
): Promise<AerialPhotoArtifact> {
  validateInput(input);
  const mimeType = resolveMimeType(input);
  const extension = MIME_TO_EXTENSION[mimeType];
  const directory = getAerialUploadPhotoDirectory(input.ownerIdentity);
  const destination = new File(
    directory,
    `${input.assignmentId}-${input.uploadId}.${extension}`,
  );

  try {
    directory.create({ idempotent: true, intermediates: true });
    await new File(input.sourceUri).copy(destination, { overwrite: false });
    if (!destination.exists) {
      throw new Error('The drone photo was not copied.');
    }
    const size = destination.info().size;
    if (
      typeof size !== 'number' ||
      !Number.isInteger(size) ||
      size <= 0 ||
      size > MAX_AERIAL_PHOTO_BYTES
    ) {
      throw new Error('The drone photo must be smaller than 20 MB.');
    }
    return { mimeType, sizeBytes: size, uri: destination.uri };
  } catch (error: unknown) {
    removePhoto(destination.uri);
    throw toStorageError(
      error,
      'IMAGE_COPY_FAILED',
      error instanceof Error && error.message.includes('20 MB')
        ? error.message
        : 'The drone photo could not be saved on this device.',
    );
  }
}

export function deleteAerialUploadPhoto(
  uri: string,
  ownerIdentity: string,
): void {
  let owner: string;
  try {
    owner = requireOwnerIdentity(ownerIdentity);
  } catch {
    return;
  }
  if (!isManagedAerialUploadPhotoUri(uri, owner)) {
    return;
  }
  removePhoto(uri);
}

export function isManagedAerialUploadPhotoUri(
  uri: string,
  ownerIdentity: string,
): boolean {
  const directory = getAerialUploadPhotoDirectory(ownerIdentity).uri;
  if (!uri.startsWith(`${directory}/`)) {
    return false;
  }
  const relative = uri.slice(directory.length + 1).split('/');
  const filename = relative.at(-1);
  return Boolean(relative.length === 1 && filename && !filename.includes('..'));
}

export function aerialUploadPhotoExists(
  uri: string,
  ownerIdentity: string,
): boolean {
  try {
    return isManagedAerialUploadPhotoUri(uri, ownerIdentity) && new File(uri).exists;
  } catch {
    return false;
  }
}

export function listAerialUploadPhotoUris(ownerIdentity: string): string[] {
  let entries: (File | Directory)[];
  try {
    entries = getAerialUploadPhotoDirectory(ownerIdentity).list();
  } catch {
    return [];
  }
  const uris: string[] = [];
  for (const entry of entries) {
    if (
      entry instanceof File &&
      isManagedAerialUploadPhotoUri(entry.uri, ownerIdentity)
    ) {
      uris.push(entry.uri);
    }
  }
  return uris;
}

function validateInput(input: AerialPhotoInput): void {
  try {
    requireOwnerIdentity(input.ownerIdentity);
  } catch {
    throw new StorageError(
      'INVALID_FIELD_VALIDATION_COMPLETION',
      'The visit owner identity is invalid.',
    );
  }
  if (!isUuid(input.assignmentId) || !isUuid(input.uploadId)) {
    throw new StorageError(
      'INVALID_FIELD_VALIDATION_COMPLETION',
      'The drone photo identity is invalid.',
    );
  }
  if (!input.sourceUri.trim()) {
    throw new StorageError('IMAGE_NOT_FOUND', 'The drone photo URI is missing.');
  }
}

function resolveMimeType(input: AerialPhotoInput): string {
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
    throw new StorageError(
      'IMAGE_COPY_FAILED',
      'Choose a JPG, PNG, or WEBP drone photo.',
    );
  }
  return mimeType;
}

function removePhoto(uri: string): void {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Leftover files are reclaimed later by localDataLifecycle.
  }
}
