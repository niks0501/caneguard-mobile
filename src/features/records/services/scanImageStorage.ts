import { Directory, File, Paths } from 'expo-file-system';

import { StorageError, toStorageError } from '@/database/errors';
import type { ScanSourceType } from '@/features/detection/types';

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MIME_TO_EXTENSION: Readonly<Record<string, string>> = {
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const EXTENSION_TO_MIME: Readonly<Record<string, string>> = {
  avif: 'image/avif',
  gif: 'image/gif',
  heic: 'image/heic',
  heif: 'image/heif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

const FALLBACK_EXTENSION = 'img';

export interface CopyScanImageInput {
  recordId: string;
  sourceFileName?: string | null;
  sourceHeight: number | null;
  sourceMimeType?: string | null;
  sourceType: ScanSourceType;
  sourceUri: string;
  sourceWidth: number | null;
}

export interface ManagedImage {
  extension: string;
  managedUri: string;
  mimeType: string | null;
  sizeBytes: number | null;
  sourceHeight: number | null;
  sourceType: ScanSourceType;
  sourceWidth: number | null;
}

export interface ManagedImageMetadata {
  extension: string;
  managedUri: string;
  mimeType: string | null;
  sizeBytes: number | null;
}

export interface CompensationCleanupResult {
  cleanedUp: boolean;
  error: StorageError | null;
}

export interface DeleteManagedImageResult {
  alreadyMissing: boolean;
  deleted: boolean;
}

export interface ResolvedImageFormat {
  extension: string;
  mimeType: string | null;
}

export function getManagedScanImageDirectory(): Directory {
  return new Directory(Paths.document, 'caneguard', 'scan-images');
}

export function ensureManagedScanImageDirectory(): Directory {
  const directory = getManagedScanImageDirectory();
  directory.create({ idempotent: true, intermediates: true });
  return directory;
}

export function getSubmissionImageUri(recordId: string): string {
  if (!UUID_V4_PATTERN.test(recordId)) {
    throw new StorageError(
      'INVALID_SCAN_RECORD',
      'The scan record ID is not UUIDv4.',
    );
  }

  return new File(
    ensureManagedScanImageDirectory(),
    `${recordId}.submission.jpg`,
  ).uri;
}

export function resolveImageFormat(input: {
  sourceFileName?: string | null;
  sourceMimeType?: string | null;
  sourceUri: string;
}): ResolvedImageFormat {
  const normalizedMimeType = normalizeSupportedMimeType(input.sourceMimeType);
  const mimeExtension = normalizedMimeType
    ? MIME_TO_EXTENSION[normalizedMimeType]
    : undefined;

  if (mimeExtension) {
    return {
      extension: mimeExtension,
      mimeType: EXTENSION_TO_MIME[mimeExtension],
    };
  }

  const extension =
    readSupportedExtension(input.sourceFileName) ??
    readSupportedExtension(input.sourceUri);

  if (extension) {
    return {
      extension: extension === 'jpeg' ? 'jpg' : extension,
      mimeType: EXTENSION_TO_MIME[extension],
    };
  }

  return {
    extension: FALLBACK_EXTENSION,
    mimeType: null,
  };
}

export async function copyScanImageToManagedStorage(
  input: CopyScanImageInput,
): Promise<ManagedImage> {
  validateCopyInput(input);

  const source = new File(input.sourceUri);
  if (!source.exists) {
    throw new StorageError('IMAGE_NOT_FOUND', 'The source scan image does not exist.');
  }

  const format = resolveImageFormat({
    sourceFileName: input.sourceFileName,
    sourceMimeType: input.sourceMimeType || source.type,
    sourceUri: input.sourceUri,
  });
  const directory = ensureManagedScanImageDirectory();
  const existingRecordImages = directory
    .list()
    .filter((entry): entry is File => entry instanceof File)
    .filter((file) => isManagedScanImageUriForRecord(file.uri, input.recordId));
  if (existingRecordImages.length > 0) {
    throw new StorageError(
      'DUPLICATE_RECORD',
      'A managed scan image already exists for this record identifier.',
    );
  }

  const destination = new File(directory, `${input.recordId}.${format.extension}`);

  if (destination.exists) {
    throw new StorageError(
      'DUPLICATE_RECORD',
      'A managed scan image already exists for this record identifier.',
    );
  }

  try {
    await source.copy(destination, { overwrite: false });

    if (!destination.exists) {
      throw new Error('The managed image destination was not created.');
    }

    const info = destination.info();
    return {
      managedUri: destination.uri,
      extension: format.extension,
      mimeType: normalizeSupportedMimeType(destination.type) ?? format.mimeType,
      sizeBytes: typeof info.size === 'number' ? info.size : null,
      sourceType: input.sourceType,
      sourceWidth: input.sourceWidth,
      sourceHeight: input.sourceHeight,
    };
  } catch (error: unknown) {
    removePartialDestination(destination);
    throw toStorageError(error, 'IMAGE_COPY_FAILED', 'Managed image copy failed.');
  }
}

export function managedImageExists(uri: string): boolean {
  return isManagedScanImageUri(uri) && new File(uri).exists;
}

export function readManagedImageMetadata(uri: string): ManagedImageMetadata | null {
  if (!isManagedScanImageUri(uri)) {
    return null;
  }

  const file = new File(uri);
  if (!file.exists) {
    return null;
  }

  const info = file.info();
  const extension = normalizeExtension(file.extension) ?? FALLBACK_EXTENSION;

  return {
    managedUri: file.uri,
    extension,
    mimeType: normalizeSupportedMimeType(file.type) ?? EXTENSION_TO_MIME[extension] ?? null,
    sizeBytes: typeof info.size === 'number' ? info.size : null,
  };
}

export function deleteManagedScanImage(uri: string): DeleteManagedImageResult {
  assertManagedScanImageUri(uri);
  const file = new File(uri);

  if (!file.exists) {
    return { alreadyMissing: true, deleted: false };
  }

  try {
    file.delete();
    return { alreadyMissing: false, deleted: true };
  } catch (error: unknown) {
    throw toStorageError(error, 'IMAGE_DELETE_FAILED', 'Managed image deletion failed.');
  }
}

export function compensateManagedImageCopy(uri: string): CompensationCleanupResult {
  try {
    deleteManagedScanImage(uri);
    return { cleanedUp: true, error: null };
  } catch (error: unknown) {
    const storageError = toStorageError(
      error,
      'IMAGE_DELETE_FAILED',
      'Managed image compensation cleanup failed.',
    );

    if (__DEV__) {
      console.error(`[storage:${storageError.code}] Orphan image cleanup is required.`);
    }

    return { cleanedUp: false, error: storageError };
  }
}

export function findOrphanedManagedImages(
  referencedManagedUris: ReadonlySet<string> | readonly string[],
): ManagedImageMetadata[] {
  const referenced =
    referencedManagedUris instanceof Set
      ? referencedManagedUris
      : new Set(referencedManagedUris);
  const directory = ensureManagedScanImageDirectory();

  return directory
    .list()
    .filter((entry): entry is File => entry instanceof File)
    .filter((file) => isManagedScanImageUri(file.uri) && !referenced.has(file.uri))
    .map((file) => readManagedImageMetadata(file.uri))
    .filter((metadata): metadata is ManagedImageMetadata => metadata !== null);
}

export function isManagedSourceScanImageUriForRecord(
  uri: string,
  recordId: string,
): boolean {
  return readManagedImageRecordPart(uri) === recordId;
}

export function isManagedScanImageUriForRecord(
  uri: string,
  recordId: string,
): boolean {
  const recordPart = readManagedImageRecordPart(uri);
  return recordPart === recordId || recordPart === `${recordId}.submission`;
}

export function isManagedScanImageUri(uri: string): boolean {
  if (!uri) {
    return false;
  }

  const directoryUri = withTrailingSlash(getManagedScanImageDirectory().uri);
  if (!uri.startsWith(directoryUri)) {
    return false;
  }

  const filename = uri.slice(directoryUri.length);
  if (!filename || filename.includes('/')) {
    return false;
  }

  const separatorIndex = filename.lastIndexOf('.');
  if (separatorIndex <= 0) {
    return false;
  }

  const basename = filename.slice(0, separatorIndex);
  const recordId = basename.endsWith('.submission')
    ? basename.slice(0, -'.submission'.length)
    : basename;
  const extension = normalizeExtension(filename.slice(separatorIndex));

  return (
    UUID_V4_PATTERN.test(recordId) &&
    (basename === recordId || basename === `${recordId}.submission`) &&
    (extension === FALLBACK_EXTENSION || Boolean(extension && EXTENSION_TO_MIME[extension]))
  );
}

function validateCopyInput(input: CopyScanImageInput): void {
  if (!UUID_V4_PATTERN.test(input.recordId)) {
    throw new StorageError('INVALID_SCAN_RECORD', 'The scan record ID is not UUIDv4.');
  }

  if (!input.sourceUri.trim()) {
    throw new StorageError('IMAGE_NOT_FOUND', 'The source scan image URI is missing.');
  }

  if (input.sourceType !== 'camera' && input.sourceType !== 'gallery') {
    throw new StorageError('INVALID_SCAN_RECORD', 'The image source type is invalid.');
  }

  for (const dimension of [input.sourceWidth, input.sourceHeight]) {
    if (dimension !== null && (!Number.isFinite(dimension) || dimension <= 0)) {
      throw new StorageError('INVALID_SCAN_RECORD', 'Source image dimensions are invalid.');
    }
  }
}

function assertManagedScanImageUri(uri: string): void {
  if (!isManagedScanImageUri(uri)) {
    throw new StorageError(
      'IMAGE_DELETE_FAILED',
      'Refusing to delete a file outside managed scan-image storage.',
    );
  }
}

function removePartialDestination(destination: File): void {
  if (!destination.exists) {
    return;
  }

  try {
    destination.delete();
  } catch {
    if (__DEV__) {
      console.error('[storage:IMAGE_DELETE_FAILED] Partial image cleanup is required.');
    }
  }
}

function readSupportedExtension(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const withoutQuery = value.split(/[?#]/, 1)[0];
  const separatorIndex = withoutQuery.lastIndexOf('.');
  if (separatorIndex < 0) {
    return null;
  }

  const extension = normalizeExtension(withoutQuery.slice(separatorIndex));
  return extension && EXTENSION_TO_MIME[extension] ? extension : null;
}

function normalizeExtension(value: string): string | null {
  const extension = value.trim().toLowerCase().replace(/^\./, '');
  return extension || null;
}

function normalizeMimeType(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const mimeType = value.split(';', 1)[0].trim().toLowerCase();
  return mimeType || null;
}

function normalizeSupportedMimeType(value: string | null | undefined): string | null {
  const mimeType = normalizeMimeType(value);
  const extension = mimeType ? MIME_TO_EXTENSION[mimeType] : undefined;
  return extension ? EXTENSION_TO_MIME[extension] : null;
}

function readManagedImageRecordPart(uri: string): string | null {
  if (!isManagedScanImageUri(uri)) {
    return null;
  }

  const directoryUri = withTrailingSlash(getManagedScanImageDirectory().uri);
  if (!uri.startsWith(directoryUri)) {
    return null;
  }

  const filename = uri.slice(directoryUri.length);
  const separatorIndex = filename.lastIndexOf('.');
  return separatorIndex > 0 ? filename.slice(0, separatorIndex) : null;
}

function withTrailingSlash(uri: string): string {
  return uri.endsWith('/') ? uri : `${uri}/`;
}
