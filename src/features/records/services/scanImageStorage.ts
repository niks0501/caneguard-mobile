import { Directory, File, Paths } from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

import { StorageError, toStorageError } from '@/database/errors';
import {
  isSafeOwnerIdentity,
  requireOwnerIdentity,
} from '@/database/ownerIdentity';
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
const BACKUP_SUFFIX = '.backup';
const LEGACY_MANAGED_IMAGE_ROOTS = ['file:///caneguard'] as const;

/**
 * Long-edge bound of the display derivative. A phone list row shows a 72 pt
 * square and the detail frames are at most 390 pt wide, so 512 px covers a 3x
 * screen without making every row decode a camera-resolution file.
 */
export const SCAN_DISPLAY_IMAGE_MAX_DIMENSION = 512;
export const SCAN_DISPLAY_IMAGE_COMPRESS = 0.8;
const DISPLAY_SUFFIX = '.display';

export interface CopyScanImageInput {
  ownerIdentity: string;
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

export function getManagedScanImageDirectory(ownerIdentity: string): Directory {
  return new Directory(
    Paths.document,
    'caneguard',
    'scan-images',
    requireOwnerIdentity(ownerIdentity),
  );
}

function getManagedImageRootDirectory(): Directory {
  return new Directory(Paths.document, 'caneguard');
}

export function ensureManagedScanImageDirectory(ownerIdentity: string): Directory {
  const directory = getManagedScanImageDirectory(ownerIdentity);
  directory.create({ idempotent: true, intermediates: true });
  return directory;
}

export function getSubmissionImageUri(
  recordId: string,
  ownerIdentity: string,
): string {
  if (!UUID_V4_PATTERN.test(recordId)) {
    throw new StorageError(
      'INVALID_SCAN_RECORD',
      'The scan record ID is not UUIDv4.',
    );
  }

  return new File(
    ensureManagedScanImageDirectory(ownerIdentity),
    `${recordId}.submission.jpg`,
  ).uri;
}

export function getDisplayImageUri(
  recordId: string,
  ownerIdentity: string,
): string {
  if (!UUID_V4_PATTERN.test(recordId)) {
    throw new StorageError(
      'INVALID_SCAN_RECORD',
      'The scan record ID is not UUIDv4.',
    );
  }

  return new File(
    ensureManagedScanImageDirectory(ownerIdentity),
    `${recordId}${DISPLAY_SUFFIX}.jpg`,
  ).uri;
}

/**
 * Bounds the long edge, not the width: a portrait capture bounded on width
 * would still be taller than the bound and would stay oversized.
 */
export function getDisplayImageResizeAction(
  sourceWidth: number | null,
  sourceHeight: number | null,
): { height: number } | { width: number } {
  const usable =
    typeof sourceWidth === 'number' &&
    Number.isFinite(sourceWidth) &&
    sourceWidth > 0 &&
    typeof sourceHeight === 'number' &&
    Number.isFinite(sourceHeight) &&
    sourceHeight > 0;

  if (usable && sourceHeight > sourceWidth) {
    return { height: SCAN_DISPLAY_IMAGE_MAX_DIMENSION };
  }
  return { width: SCAN_DISPLAY_IMAGE_MAX_DIMENSION };
}

/**
 * Derives the display derivative URI from a preserved scan image URI. Purely
 * string-based, so a caller can ask for the sibling without touching the file
 * system first. Always JPEG: the derivative is always re-encoded.
 */
export function managedDisplayImageUri(
  managedImageUri: string,
): string | null {
  const recordPart = readManagedImageRecordPart(managedImageUri);
  if (!recordPart || recordPart.endsWith(DISPLAY_SUFFIX)) {
    return null;
  }
  const separatorIndex = managedImageUri.lastIndexOf('/');
  if (separatorIndex <= 0) {
    return null;
  }
  return `${managedImageUri.slice(0, separatorIndex)}/${recordPart}${DISPLAY_SUFFIX}.jpg`;
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
  const directory = ensureManagedScanImageDirectory(input.ownerIdentity);
  const existingRecordImages = listManagedScanImageFiles().filter((file) =>
    isManagedScanImageUriForRecord(
      file.uri,
      input.recordId,
      input.ownerIdentity,
    ),
  );
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

/**
 * Lists the managed scan image files this owner's partition holds, including
 * files no draft row, scan record or report names any more.
 */
export function listManagedScanImageUris(ownerIdentity: string): string[] {
  let owner: string;
  try {
    owner = requireOwnerIdentity(ownerIdentity);
  } catch {
    return [];
  }
  let entries: (File | Directory)[];
  try {
    entries = getManagedScanImageDirectory(owner).list();
  } catch {
    return [];
  }
  const uris: string[] = [];
  for (const entry of entries) {
    if (
      entry instanceof File &&
      isManagedScanImageUri(entry.uri) &&
      isManagedImageOwnedBy(entry.uri, owner)
    ) {
      uris.push(entry.uri);
    }
  }
  return uris;
}

/**
 * The display derivative to render for a preserved scan image, or `null` when
 * the derivative has not been generated. Callers fall back to the preserved
 * original, so a missing derivative is never a broken image.
 *
 * The existence check is a synchronous stat on purpose. A process-lifetime
 * memo would answer `false` for a derivative written after the first look and
 * would grow one entry per record the inspector ever scrolled past; a stat on
 * the handful of rows a virtualized list actually mounts is cheaper than both.
 */
export function managedDisplayImageUriIfPresent(
  managedImageUri: string,
): string | null {
  const displayUri = managedDisplayImageUri(managedImageUri);
  if (!displayUri) {
    return null;
  }

  try {
    return new File(displayUri).exists ? displayUri : null;
  } catch {
    return null;
  }
}

/**
 * Writes the small display derivative for an already-preserved scan image.
 * Best effort by contract: a failure leaves the preserved original in place and
 * callers keep rendering it, so a scan save is never blocked by this step.
 */
export async function writeScanDisplayImage(input: {
  ownerIdentity: string;
  recordId: string;
  sourceHeight: number | null;
  sourceUri: string;
  sourceWidth: number | null;
}): Promise<string> {
  const source = new File(input.sourceUri);
  if (!source.exists) {
    throw new StorageError('IMAGE_NOT_FOUND', 'The scan image to downscale does not exist.');
  }

  const destinationUri = getDisplayImageUri(input.recordId, input.ownerIdentity);
  let candidateUri: string | null = null;

  try {
    const result = await manipulateAsync(
      input.sourceUri,
      [{ resize: getDisplayImageResizeAction(input.sourceWidth, input.sourceHeight) }],
      {
        compress: SCAN_DISPLAY_IMAGE_COMPRESS,
        format: SaveFormat.JPEG,
      },
    );
    candidateUri = result.uri;

    const candidate = new File(candidateUri);
    if (!candidate.exists) {
      throw new Error('The display derivative was not created.');
    }

    const destination = new File(destinationUri);
    // The derivative is regenerable, and a retried save must not be blocked by a
    // stale file left by an interrupted earlier attempt.
    await candidate.copy(destination, { overwrite: true });
    if (!destination.exists) {
      throw new Error('The display derivative was not persisted.');
    }

    return destinationUri;
  } catch (error: unknown) {
    throw toStorageError(
      error,
      'IMAGE_PREPARATION_FAILED',
      'The scan display image could not be prepared.',
    );
  } finally {
    if (candidateUri && candidateUri !== destinationUri) {
      try {
        const temporary = new File(candidateUri);
        if (temporary.exists) {
          temporary.delete();
        }
      } catch {
        // The temporary is regenerable; a stuck temp file is not a save failure.
      }
    }
  }
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
  const filename = file.uri.slice(file.uri.lastIndexOf('/') + 1);
  const imageFilename = filename.endsWith(BACKUP_SUFFIX)
    ? filename.slice(0, -BACKUP_SUFFIX.length)
    : filename;
  const extension =
    normalizeExtension(imageFilename.slice(imageFilename.lastIndexOf('.'))) ??
    FALLBACK_EXTENSION;

  return {
    managedUri: file.uri,
    extension,
    mimeType: normalizeSupportedMimeType(file.type) ?? EXTENSION_TO_MIME[extension] ?? null,
    sizeBytes: typeof info.size === 'number' ? info.size : null,
  };
}

export function deleteManagedScanImage(
  uri: string,
  ownerIdentity: string,
): DeleteManagedImageResult {
  assertManagedScanImageUri(uri, ownerIdentity);
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

export function compensateManagedImageCopy(
  uri: string,
  ownerIdentity: string,
): CompensationCleanupResult {
  try {
    deleteManagedScanImage(uri, ownerIdentity);
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
  ownerIdentity: string,
): ManagedImageMetadata[] {
  const referenced =
    referencedManagedUris instanceof Set
      ? referencedManagedUris
      : new Set(referencedManagedUris);
  // A display derivative has no column of its own, so it counts as referenced
  // exactly when the preserved scan image it was generated from is referenced.
  const referencedRecordIds = new Set(
    [...referenced]
      .map((uri) => readManagedImageRecordPart(uri))
      .filter((recordId): recordId is string => Boolean(recordId)),
  );
  ensureManagedScanImageDirectory(ownerIdentity);

  return listManagedScanImageFiles()
    .filter((file) => {
      if (!isManagedImageOwnedBy(file.uri, ownerIdentity)) {
        return false;
      }
      if (referenced.has(file.uri)) {
        return false;
      }
      const recordPart = readManagedImageRecordPart(file.uri);
      if (recordPart?.endsWith(DISPLAY_SUFFIX)) {
        return !referencedRecordIds.has(
          recordPart.slice(0, -DISPLAY_SUFFIX.length),
        );
      }
      return true;
    })
    .map((file) => readManagedImageMetadata(file.uri))
    .filter((metadata): metadata is ManagedImageMetadata => metadata !== null);
}

export function isManagedSourceScanImageUriForRecord(
  uri: string,
  recordId: string,
  ownerIdentity: string,
): boolean {
  return (
    isManagedImageOwnedBy(uri, ownerIdentity) &&
    readManagedImageRecordPart(uri) === recordId
  );
}

export function isManagedScanImageUriForRecord(
  uri: string,
  recordId: string,
  ownerIdentity: string,
): boolean {
  if (!isManagedImageOwnedBy(uri, ownerIdentity)) {
    return false;
  }
  const recordPart = readManagedImageRecordPart(uri);
  return (
    recordPart === recordId ||
    recordPart === `${recordId}.submission` ||
    recordPart === `${recordId}${DISPLAY_SUFFIX}`
  );
}

export function isManagedScanImageUri(uri: string): boolean {
  if (!uri) {
    return false;
  }

  // Keep the historical logical root as a narrow compatibility allowance.
  // New writes remain under the current app document directory.
  const roots = [
    getManagedImageRootDirectory().uri,
    ...LEGACY_MANAGED_IMAGE_ROOTS,
  ];
  return roots.some((root) => isManagedImagePathUnderRoot(uri, root));
}

function isManagedImagePathUnderRoot(uri: string, rootUri: string): boolean {
  const directoryUri = withTrailingSlash(rootUri);
  if (!uri.startsWith(directoryUri)) {
    return false;
  }

  const pathParts = uri.slice(directoryUri.length).split('/');
  const isScopedCanonicalPath =
    pathParts.length === 3 &&
    pathParts[0] === 'scan-images' &&
    isSafeOwnerIdentity(pathParts[1]);
  const isCanonicalPath =
    pathParts.length === 2 && pathParts[0] === 'scan-images';
  const isLegacyFlatPath = pathParts.length === 1;
  if (
    (!isScopedCanonicalPath && !isCanonicalPath && !isLegacyFlatPath) ||
    pathParts.some((part) => !part || part === '.' || part === '..')
  ) {
    return false;
  }

  return isManagedImageFilename(pathParts[pathParts.length - 1]);
}

function isManagedImageFilename(filename: string): boolean {
  const imageFilename = filename.endsWith(BACKUP_SUFFIX)
    ? filename.slice(0, -BACKUP_SUFFIX.length)
    : filename;
  const separatorIndex = imageFilename.lastIndexOf('.');
  if (separatorIndex <= 0) {
    return false;
  }

  const basename = imageFilename.slice(0, separatorIndex);
  const recordId = readRecordIdFromImageBasename(basename);
  const extension = normalizeExtension(imageFilename.slice(separatorIndex));

  return (
    recordId !== null &&
    (extension === FALLBACK_EXTENSION || Boolean(extension && EXTENSION_TO_MIME[extension]))
  );
}

/**
 * The single place that decides which managed image basenames belong to a scan
 * record. A derivative keeps the record id and appends its own suffix, so the
 * suffix list and the UUID check stay together here.
 */
function readRecordIdFromImageBasename(basename: string): string | null {
  for (const suffix of ['.submission', DISPLAY_SUFFIX]) {
    if (basename.endsWith(suffix)) {
      const recordId = basename.slice(0, -suffix.length);
      return UUID_V4_PATTERN.test(recordId) ? recordId : null;
    }
  }
  return UUID_V4_PATTERN.test(basename) ? basename : null;
}

function validateCopyInput(input: CopyScanImageInput): void {
  try {
    requireOwnerIdentity(input.ownerIdentity);
  } catch {
    throw new StorageError(
      'INVALID_SCAN_RECORD',
      'The scan record owner identity is invalid.',
    );
  }
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

function assertManagedScanImageUri(uri: string, ownerIdentity: string): void {
  let ownedByCaller: boolean;
  try {
    ownedByCaller = isManagedImageOwnedBy(uri, requireOwnerIdentity(ownerIdentity));
  } catch {
    ownedByCaller = false;
  }
  if (!isManagedScanImageUri(uri) || !ownedByCaller) {
    throw new StorageError(
      'IMAGE_DELETE_FAILED',
      'Refusing to delete a file outside the authenticated owner image storage.',
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

function isManagedImageOwnedBy(uri: string, ownerIdentity: string): boolean {
  const normalizedOwner = requireOwnerIdentity(ownerIdentity);
  return readManagedImageOwnerPart(uri) === normalizedOwner;
}

function readManagedImageOwnerPart(uri: string): string | null {
  if (!isManagedScanImageUri(uri)) {
    return null;
  }
  const roots = [getManagedImageRootDirectory().uri, ...LEGACY_MANAGED_IMAGE_ROOTS];
  for (const root of roots) {
    const directoryUri = withTrailingSlash(root);
    if (!uri.startsWith(directoryUri)) {
      continue;
    }
    const pathParts = uri.slice(directoryUri.length).split('/');
    if (pathParts.length === 3 && pathParts[0] === 'scan-images') {
      return pathParts[1];
    }
  }
  return null;
}

function readManagedImageRecordPart(uri: string): string | null {
  if (!isManagedScanImageUri(uri)) {
    return null;
  }

  const filename = uri.slice(uri.lastIndexOf('/') + 1);
  const imageFilename = filename.endsWith(BACKUP_SUFFIX)
    ? filename.slice(0, -BACKUP_SUFFIX.length)
    : filename;
  const separatorIndex = imageFilename.lastIndexOf('.');
  return separatorIndex > 0 ? imageFilename.slice(0, separatorIndex) : null;
}

function listManagedScanImageFiles(): File[] {
  const files = new Map<string, File>();
  const visitedDirectories = new Set<string>();
  const rootDirectories = [
    getManagedImageRootDirectory(),
    ...LEGACY_MANAGED_IMAGE_ROOTS.flatMap((root) => [
      new Directory(root),
      new Directory(root, 'scan-images'),
    ]),
  ];

  for (const directory of rootDirectories) {
    collectManagedScanImageFiles(directory, files, visitedDirectories);
  }

  return [...files.values()];
}

function collectManagedScanImageFiles(
  directory: Directory,
  files: Map<string, File>,
  visitedDirectories: Set<string>,
): void {
  if (visitedDirectories.has(directory.uri)) {
    return;
  }
  visitedDirectories.add(directory.uri);

  let entries: (File | Directory)[];
  try {
    entries = directory.list();
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry instanceof File) {
      if (isManagedScanImageUri(entry.uri)) {
        files.set(entry.uri, entry);
      }
      continue;
    }
    if (entry instanceof Directory) {
      collectManagedScanImageFiles(entry, files, visitedDirectories);
    }
  }
}

function withTrailingSlash(uri: string): string {
  return uri.endsWith('/') ? uri : `${uri}/`;
}
