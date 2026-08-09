export const STORAGE_ERROR_CODES = [
  'DATABASE_NOT_READY',
  'DATABASE_OPEN_FAILED',
  'MIGRATION_FAILED',
  'INVALID_SCAN_RECORD',
  'INVALID_FIELD_REPORT',
  'IMAGE_COPY_FAILED',
  'IMAGE_NOT_FOUND',
  'SAVE_TRANSACTION_FAILED',
  'RECORD_NOT_FOUND',
  'FIELD_REPORT_NOT_FOUND',
  'QUERY_FAILED',
  'UPDATE_FAILED',
  'DELETE_FAILED',
  'IMAGE_DELETE_FAILED',
  'DUPLICATE_RECORD',
] as const;

export type StorageErrorCode = (typeof STORAGE_ERROR_CODES)[number];

const USER_MESSAGES: Record<StorageErrorCode, string> = {
  DATABASE_NOT_READY: 'Local storage is still starting. Please try again shortly.',
  DATABASE_OPEN_FAILED:
    'CaneGuard could not open local storage. Close and reopen the app, then try again.',
  MIGRATION_FAILED:
    'CaneGuard could not update local storage. Your existing records were not reset.',
  INVALID_SCAN_RECORD: 'This scan is incomplete and cannot be saved yet.',
  INVALID_FIELD_REPORT: 'This report draft contains invalid information.',
  IMAGE_COPY_FAILED: 'The scan image could not be saved on this device.',
  IMAGE_NOT_FOUND: 'The saved scan image is no longer available on this device.',
  SAVE_TRANSACTION_FAILED: 'The record could not be saved. Your scan result is still available.',
  RECORD_NOT_FOUND: 'This saved record could not be found.',
  FIELD_REPORT_NOT_FOUND: 'This field report could not be found on this device.',
  QUERY_FAILED: 'Saved records could not be loaded. Please try again.',
  UPDATE_FAILED: 'The saved record could not be updated. Please try again.',
  DELETE_FAILED: 'The local record could not be deleted. Please try again.',
  IMAGE_DELETE_FAILED:
    'The record was removed, but its saved image could not be cleaned up.',
  DUPLICATE_RECORD: 'This scan result is already saved on this device.',
};

export class StorageError extends Error {
  readonly code: StorageErrorCode;
  readonly cause?: unknown;

  constructor(code: StorageErrorCode, message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'StorageError';
    this.code = code;
    this.cause = options?.cause;
  }
}

export function getStorageErrorMessage(error: StorageError): string {
  return USER_MESSAGES[error.code];
}

export function toStorageError(
  error: unknown,
  code: StorageErrorCode,
  internalMessage: string,
): StorageError {
  return error instanceof StorageError
    ? error
    : new StorageError(code, internalMessage, { cause: error });
}
