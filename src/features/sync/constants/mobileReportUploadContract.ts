/**
 * Client-side image boundaries mirrored from the canonical
 * mobile-report-upload-v1 contract in caneguard-web.
 */
export const MOBILE_REPORT_UPLOAD_V1_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const MOBILE_REPORT_UPLOAD_V1_SUBMISSION_TARGET_BYTES = 9 * 1024 * 1024;

export const MOBILE_REPORT_UPLOAD_V1_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type MobileReportUploadImageMimeType =
  (typeof MOBILE_REPORT_UPLOAD_V1_IMAGE_MIME_TYPES)[number];

export function normalizeMobileReportImageMimeType(
  value: string | null | undefined,
): MobileReportUploadImageMimeType | null {
  const normalized = value?.split(';', 1)[0].trim().toLowerCase();
  if (normalized === 'image/jpg') {
    return 'image/jpeg';
  }
  return MOBILE_REPORT_UPLOAD_V1_IMAGE_MIME_TYPES.includes(
    normalized as MobileReportUploadImageMimeType,
  )
    ? (normalized as MobileReportUploadImageMimeType)
    : null;
}

export function isValidSubmissionImageMetadata(input: {
  sourceUri: string;
  submissionImageMimeType: string | null | undefined;
  submissionImageSizeBytes: number | null | undefined;
  submissionImageUri: string | null | undefined;
  expectedSubmissionImageUri?: string | null;
}): boolean {
  const uri = input.submissionImageUri?.trim();
  if (!uri) {
    return (
      input.submissionImageMimeType == null &&
      input.submissionImageSizeBytes == null
    );
  }

  const mimeType = normalizeMobileReportImageMimeType(
    input.submissionImageMimeType,
  );
  const sizeBytes = input.submissionImageSizeBytes;

  if (
    !mimeType ||
    typeof sizeBytes !== 'number' ||
    !Number.isInteger(sizeBytes) ||
    sizeBytes <= 0 ||
    sizeBytes > MOBILE_REPORT_UPLOAD_V1_IMAGE_MAX_BYTES
  ) {
    return false;
  }

  if (
    input.expectedSubmissionImageUri &&
    uri !== input.sourceUri.trim() &&
    uri !== input.expectedSubmissionImageUri.trim()
  ) {
    return false;
  }

  return (
    uri === input.sourceUri.trim() ||
    (mimeType === 'image/jpeg' &&
      sizeBytes <= MOBILE_REPORT_UPLOAD_V1_SUBMISSION_TARGET_BYTES)
  );
}

export function canReuseSourceAsSubmissionImage(input: {
  mimeType: string | null;
  sizeBytes: number | null;
}): input is {
  mimeType: string;
  sizeBytes: number;
} {
  const mimeType = normalizeMobileReportImageMimeType(input.mimeType);
  return Boolean(
    mimeType &&
      typeof input.sizeBytes === 'number' &&
      Number.isInteger(input.sizeBytes) &&
      input.sizeBytes > 0 &&
      input.sizeBytes <= MOBILE_REPORT_UPLOAD_V1_IMAGE_MAX_BYTES,
  );
}
