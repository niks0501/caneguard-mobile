import {
  getStorageErrorMessage,
  STORAGE_ERROR_CODES,
  StorageError,
  toStorageError,
} from '@/database/errors';

describe('storage errors', () => {
  it('keeps internal details out of user-facing messages', () => {
    const error = new StorageError(
      'MIGRATION_FAILED',
      'SQL failed at file:///private/caneguard.db',
    );

    expect(getStorageErrorMessage(error)).toBe(
      'CaneGuard could not update local storage. Your existing records were not reset.',
    );
    expect(getStorageErrorMessage(error)).not.toContain('file:///');
    expect(getStorageErrorMessage(error)).not.toContain('SQL');
  });

  it('wraps unknown failures with a stable error code', () => {
    const cause = new Error('native error');
    const error = toStorageError(cause, 'DATABASE_OPEN_FAILED', 'Open failed.');

    expect(error).toBeInstanceOf(StorageError);
    expect(error.code).toBe('DATABASE_OPEN_FAILED');
    expect(error.cause).toBe(cause);
  });

  it.each(STORAGE_ERROR_CODES)(
    'keeps the %s user message actionable and free of internals',
    (code) => {
      const message = getStorageErrorMessage(new StorageError(code, 'internal'));

      expect(message.length).toBeGreaterThan(20);
      expect(message).not.toMatch(/(?:file|content):\/\//i);
      expect(message).not.toMatch(/\b(?:SQL|SELECT|INSERT|DELETE|stack)\b/i);
    },
  );
});
