import {
  getStorageErrorMessage,
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
});
