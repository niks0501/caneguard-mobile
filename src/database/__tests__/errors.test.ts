import {
  describeStorageErrorCause,
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

describe('storage error cause description', () => {
  it('describes an error cause on one bounded line', () => {
    const cause = new Error('Sync operation timeout');

    expect(describeStorageErrorCause(cause)).toBe('Error: Sync operation timeout');
  });

  it('reads the message of a non-Error object cause', () => {
    expect(describeStorageErrorCause({ message: 'NoModificationAllowedError' })).toBe(
      'Error: NoModificationAllowedError',
    );
  });

  it('collapses newlines and caps the length', () => {
    const description = describeStorageErrorCause(
      new Error(`first line\nsecond line ${'x'.repeat(500)}`),
    );

    expect(description).not.toMatch(/\n/);
    expect(description).toHaveLength(241);
  });

  it('has nothing to say about a missing cause', () => {
    expect(describeStorageErrorCause(undefined)).toBeNull();
    expect(describeStorageErrorCause(null)).toBeNull();
  });
});
