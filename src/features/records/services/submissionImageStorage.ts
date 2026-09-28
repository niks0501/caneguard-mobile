import { File } from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

import { StorageError } from '@/database/errors';
import { requireOwnerIdentity } from '@/database/ownerIdentity';
import {
  canReuseSourceAsSubmissionImage,
  MOBILE_REPORT_UPLOAD_V1_SUBMISSION_TARGET_BYTES,
  normalizeMobileReportImageMimeType,
  isValidSubmissionImageMetadata,
  type MobileReportUploadImageMimeType,
} from '@/features/sync/constants/mobileReportUploadContract';
import {
  getManagedScanImageDirectory,
  getSubmissionImageUri,
  isManagedScanImageUri,
  readManagedImageMetadata,
} from '@/features/records/services/scanImageStorage';

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const LEGACY_UNSUPPORTED_IMAGE_EXTENSIONS = new Set([
  'avif',
  'gif',
  'heic',
  'heif',
]);

const LEGACY_UNSUPPORTED_IMAGE_MIME_TYPES = new Set([
  'image/avif',
  'image/gif',
  'image/heic',
  'image/heif',
]);

export const SUBMISSION_IMAGE_QUALITY_STEPS = [
  0.85,
  0.7,
  0.55,
  0.4,
  0.25,
  0.15,
] as const;

/**
 * The no-resize rung only tries its best two quality levels. A source that is
 * over the target and still over it at quality 0.7 has to be downscaled anyway,
 * and a resized candidate at 0.85 is both smaller and visually better than a
 * no-resize candidate at 0.55. Without this bound the rung burns six full
 * camera-resolution decodes before the ladder reaches the resize it needs.
 */
const SUBMISSION_IMAGE_IDENTITY_QUALITY_LIMIT = 2;

const SUBMISSION_IMAGE_MAX_DIMENSIONS = [
  3072,
  2048,
  1600,
  1280,
  1024,
  768,
  640,
] as const;

export interface SubmissionImagePreparationInput {
  ownerIdentity: string;
  recordId: string;
  sourceHeight: number | null;
  sourceMimeType: string | null;
  sourceSizeBytes: number | null;
  sourceUri: string;
  sourceWidth: number | null;
  submissionImageMimeType: string | null;
  submissionImageSizeBytes: number | null;
  submissionImageUri: string | null;
}

export interface SubmissionImageArtifact {
  mimeType: MobileReportUploadImageMimeType;
  sizeBytes: number;
  uri: string;
}

export interface PreparedSubmissionImage {
  artifact: SubmissionImageArtifact;
  created: boolean;
  requiresPersistence: boolean;
}

export async function prepareSubmissionImage(
  input: SubmissionImagePreparationInput,
): Promise<PreparedSubmissionImage> {
  validatePreparationInput(input);

  const sourceMetadata = readManagedImageMetadata(input.sourceUri);
  if (!sourceMetadata) {
    throw new StorageError(
      'IMAGE_PREPARATION_FAILED',
      'The preserved source image could not be read for submission preparation.',
    );
  }

  const sourceMimeCandidate = sourceMetadata.mimeType ?? input.sourceMimeType;
  const sourceMimeType = normalizeMobileReportImageMimeType(sourceMimeCandidate);
  const sourceSizeBytes = sourceMetadata.sizeBytes ?? input.sourceSizeBytes;
  if (
    typeof sourceSizeBytes !== 'number' ||
    !Number.isInteger(sourceSizeBytes) ||
    sourceSizeBytes <= 0
  ) {
    throw new StorageError(
      'IMAGE_PREPARATION_FAILED',
      'The preserved source image has no valid submission metadata.',
    );
  }

  const persistedArtifact = readPersistedArtifact(input);
  if (persistedArtifact) {
    return {
      artifact: persistedArtifact,
      created: false,
      requiresPersistence: false,
    };
  }

  if (
    sourceMimeType &&
    canReuseSourceAsSubmissionImage({
      mimeType: sourceMimeType,
      sizeBytes: sourceSizeBytes,
    })
  ) {
    const artifact: SubmissionImageArtifact = {
      mimeType: sourceMimeType,
      sizeBytes: sourceSizeBytes,
      uri: input.sourceUri,
    };
    return {
      artifact,
      created: false,
      requiresPersistence: !(
        input.submissionImageUri?.trim() === input.sourceUri.trim() &&
        normalizeMobileReportImageMimeType(input.submissionImageMimeType) ===
          sourceMimeType &&
        input.submissionImageSizeBytes === sourceSizeBytes
      ),
    };
  }

  if (!sourceMimeType && !isLegacyUnsupportedSource(sourceMetadata, sourceMimeCandidate)) {
    throw new StorageError(
      'IMAGE_PREPARATION_FAILED',
      'The legacy source image format is not supported for recovery.',
    );
  }

  return prepareDerivativeFromManagedSource(input, sourceMetadata);
}

async function prepareDerivativeFromManagedSource(
  input: SubmissionImagePreparationInput,
  sourceMetadata: { extension: string },
): Promise<PreparedSubmissionImage> {
  let preparationSourceUri = input.sourceUri;
  let stagingUri: string | null = null;

  if (!isCanonicalManagedSourceUri(input)) {
    stagingUri = await copyLegacySourceToCanonical(input, sourceMetadata);
    preparationSourceUri = stagingUri;
  }

  try {
    return await generateSubmissionDerivative({
      ...input,
      sourceUri: preparationSourceUri,
    });
  } finally {
    if (stagingUri) {
      removeStagedSource(stagingUri);
    }
  }
}

function isCanonicalManagedSourceUri(
  input: SubmissionImagePreparationInput,
): boolean {
  const uri = input.sourceUri;
  const directoryUri = getManagedScanImageDirectory(input.ownerIdentity).uri;
  const relativePath = uri.startsWith(`${directoryUri}/`)
    ? uri.slice(directoryUri.length + 1)
    : null;
  return Boolean(
    relativePath &&
      !relativePath.includes('/') &&
      isManagedScanImageUri(uri),
  );
}

async function copyLegacySourceToCanonical(
  input: SubmissionImagePreparationInput,
  sourceMetadata: { extension: string },
): Promise<string> {
  const directory = getManagedScanImageDirectory(input.ownerIdentity);
  const staging = new File(
    directory,
    `${input.recordId}.legacy-source.${sourceMetadata.extension || 'img'}`,
  );

  try {
    directory.create({ idempotent: true, intermediates: true });
    await new File(input.sourceUri).copy(staging, { overwrite: true });
    if (!staging.exists) {
      throw new Error('The canonical legacy source copy was not created.');
    }
    return staging.uri;
  } catch (error: unknown) {
    removeStagedSource(staging.uri);
    throw new StorageError(
      'IMAGE_PREPARATION_FAILED',
      'The legacy source image could not be copied into managed storage.',
      { cause: error },
    );
  }
}

function removeStagedSource(uri: string): void {
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // The source remains available for a later repair attempt.
  }
}

function readPersistedArtifact(
  input: SubmissionImagePreparationInput,
): SubmissionImageArtifact | null {
  const uri = input.submissionImageUri?.trim();
  if (!uri) {
    return null;
  }

  const expectedUri = getSubmissionImageUri(input.recordId, input.ownerIdentity);
  if (uri !== input.sourceUri.trim() && uri !== expectedUri) {
    return null;
  }

  const actual = readManagedImageMetadata(uri);
  const mimeType = normalizeMobileReportImageMimeType(
    input.submissionImageMimeType,
  );
  const actualMimeType = normalizeMobileReportImageMimeType(actual?.mimeType);
  const sizeBytes = input.submissionImageSizeBytes;

  if (
    !actual ||
    actual.managedUri !== uri ||
    !actualMimeType ||
    !mimeType ||
    actualMimeType !== mimeType ||
    actual.sizeBytes === null ||
    typeof sizeBytes !== 'number' ||
    sizeBytes !== actual.sizeBytes ||
    !isValidSubmissionImageMetadata({
      sourceUri: input.sourceUri,
      submissionImageMimeType: mimeType,
      submissionImageSizeBytes: sizeBytes,
      submissionImageUri: uri,
      expectedSubmissionImageUri: expectedUri,
    })
  ) {
    return null;
  }

  return {
    mimeType,
    sizeBytes,
    uri,
  };
}

async function generateSubmissionDerivative(
  input: SubmissionImagePreparationInput,
): Promise<PreparedSubmissionImage> {
  const sourceWidth = input.sourceWidth;
  const sourceHeight = input.sourceHeight;
  if (
    sourceWidth === null ||
    sourceHeight === null ||
    !Number.isFinite(sourceWidth) ||
    !Number.isFinite(sourceHeight) ||
    sourceWidth <= 0 ||
    sourceHeight <= 0
  ) {
    throw new StorageError(
      'IMAGE_PREPARATION_FAILED',
      'Source image dimensions are required to prepare a submission image.',
    );
  }

  const destinationUri = getSubmissionImageUri(input.recordId, input.ownerIdentity);
  if (destinationUri === input.sourceUri.trim()) {
    throw new StorageError(
      'IMAGE_PREPARATION_FAILED',
      'The submission derivative cannot replace the preserved source image.',
    );
  }

  let lastError: unknown = null;
  for (const dimensions of getDimensionCandidates(sourceWidth, sourceHeight)) {
    const qualitySteps = dimensions
      ? SUBMISSION_IMAGE_QUALITY_STEPS
      : SUBMISSION_IMAGE_QUALITY_STEPS.slice(
          0,
          SUBMISSION_IMAGE_IDENTITY_QUALITY_LIMIT,
        );
    for (const quality of qualitySteps) {
      let candidateUri: string | null = null;
      try {
        const result = await manipulateAsync(
          input.sourceUri,
          dimensions
            ? [
                {
                  resize: dimensions,
                },
              ]
            : [],
          {
            compress: quality,
            format: SaveFormat.JPEG,
          },
        );
        candidateUri = result.uri;
        const candidate = new File(candidateUri);
        const candidateSizeBytes = readPositiveFileSize(candidate);

        if (
          candidateSizeBytes === null ||
          candidateSizeBytes > MOBILE_REPORT_UPLOAD_V1_SUBMISSION_TARGET_BYTES
        ) {
          continue;
        }

        const candidateMimeType = normalizeMobileReportImageMimeType(
          candidate.type || 'image/jpeg',
        );
        if (candidateMimeType !== 'image/jpeg') {
          throw new Error('The generated candidate is not a JPEG.');
        }

        const artifact = await persistCandidate(candidate, destinationUri);
        return {
          artifact,
          created: true,
          requiresPersistence: true,
        };
      } catch (error: unknown) {
        lastError = error;
      } finally {
        if (candidateUri) {
          removeTemporaryFile(candidateUri, input.sourceUri, destinationUri);
        }
      }
    }
  }

  throw new StorageError(
    'IMAGE_PREPARATION_FAILED',
    'The source image could not be reduced to an upload-ready JPEG.',
    { cause: lastError },
  );
}

function getDimensionCandidates(
  sourceWidth: number,
  sourceHeight: number,
): ({ height: number; width: number } | null)[] {
  const longestSide = Math.max(sourceWidth, sourceHeight);
  const maxDimensions = [longestSide, ...SUBMISSION_IMAGE_MAX_DIMENSIONS].filter(
    (value, index, values) =>
      value <= longestSide && values.indexOf(value) === index,
  );

  return maxDimensions.map((maxDimension) => {
    if (maxDimension === longestSide) {
      return null;
    }

    const scale = maxDimension / longestSide;
    return {
      height: Math.max(1, Math.round(sourceHeight * scale)),
      width: Math.max(1, Math.round(sourceWidth * scale)),
    };
  });
}

function isLegacyUnsupportedSource(
  metadata: { extension: string; mimeType: string | null },
  mimeType: string | null | undefined,
): boolean {
  const extension = metadata.extension.trim().toLowerCase().replace(/^\./, '');
  const normalizedMimeType = (mimeType ?? metadata.mimeType)
    ?.split(';', 1)[0]
    .trim()
    .toLowerCase();
  return (
    LEGACY_UNSUPPORTED_IMAGE_EXTENSIONS.has(extension) ||
    (normalizedMimeType !== undefined &&
      LEGACY_UNSUPPORTED_IMAGE_MIME_TYPES.has(normalizedMimeType))
  );
}

function validatePreparationInput(input: SubmissionImagePreparationInput): void {
  requireOwnerIdentity(input.ownerIdentity);
  if (!UUID_V4_PATTERN.test(input.recordId)) {
    throw new StorageError(
      'INVALID_SCAN_RECORD',
      'The scan record ID is not UUIDv4.',
    );
  }
  if (!input.sourceUri.trim()) {
    throw new StorageError(
      'IMAGE_PREPARATION_FAILED',
      'A preserved source image URI is required.',
    );
  }
}

function readPositiveFileSize(file: File): number | null {
  if (!file.exists) {
    return null;
  }
  const size = file.info().size;
  return typeof size === 'number' && Number.isInteger(size) && size > 0
    ? size
    : null;
}

async function persistCandidate(
  candidate: File,
  destinationUri: string,
): Promise<SubmissionImageArtifact> {
  const destination = new File(destinationUri);
  const hadDestination = destination.exists;
  const backup = hadDestination
    ? new File(`${destinationUri}.backup`)
    : null;
  let backupCreated = false;
  let keepBackup = false;

  try {
    if (backup) {
      await destination.copy(backup, { overwrite: true });
      if (!backup.exists) {
        throw new Error('The existing submission image backup was not created.');
      }
      backupCreated = true;
    }

    await candidate.copy(destination, { overwrite: true });
    if (!destination.exists) {
      throw new Error('The submission image destination was not created.');
    }

    const persistedSizeBytes = readPositiveFileSize(destination);
    const persistedMimeType = normalizeMobileReportImageMimeType(
      destination.type || 'image/jpeg',
    );
    if (
      persistedMimeType !== 'image/jpeg' ||
      persistedSizeBytes === null ||
      persistedSizeBytes > MOBILE_REPORT_UPLOAD_V1_SUBMISSION_TARGET_BYTES
    ) {
      throw new Error('The generated submission image metadata is invalid.');
    }

    return {
      mimeType: 'image/jpeg',
      sizeBytes: persistedSizeBytes,
      uri: destination.uri,
    };
  } catch (error: unknown) {
    if (backupCreated && backup) {
      try {
        await backup.copy(destination, { overwrite: true });
      } catch {
        keepBackup = true;
      }
    } else if (!hadDestination) {
      removeDestination(destination);
    }
    throw error;
  } finally {
    if (backup && backup.exists && !keepBackup) {
      removeDestination(backup);
    }
  }
}

function removeDestination(file: File): void {
  try {
    if (file.exists) {
      file.delete();
    }
  } catch {
    // The preparation error remains the actionable failure.
  }
}

function removeTemporaryFile(
  uri: string,
  sourceUri: string,
  destinationUri: string,
): void {
  if (
    uri === sourceUri ||
    uri === destinationUri ||
    isManagedScanImageUri(uri)
  ) {
    return;
  }

  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // Temporary cache cleanup is best effort.
  }
}
