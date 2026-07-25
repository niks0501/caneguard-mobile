import { openDatabaseSync } from 'expo-sqlite';

import { createCaneGuardDatabaseResources } from '@/database/database';
import { StorageError } from '@/database/errors';

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(),
}));

const mockOpenDatabaseSync = jest.mocked(openDatabaseSync);

function createSQLiteMock(foreignKeys = 1) {
  return {
    closeSync: jest.fn(),
    execSync: jest.fn(),
    getFirstSync: jest.fn(() => ({ foreign_keys: foreignKeys })),
  };
}

describe('database initialization', () => {
  it('opens the stable database and enables foreign keys', () => {
    const sqlite = createSQLiteMock();
    mockOpenDatabaseSync.mockReturnValue(
      sqlite as unknown as ReturnType<typeof openDatabaseSync>,
    );

    const resources = createCaneGuardDatabaseResources();

    expect(mockOpenDatabaseSync).toHaveBeenCalledWith('caneguard.db');
    expect(sqlite.execSync).toHaveBeenCalledWith('PRAGMA foreign_keys = ON');
    expect(resources.sqlite).toBe(sqlite);
  });

  it('fails safely when foreign-key enforcement is unavailable', () => {
    const sqlite = createSQLiteMock(0);
    mockOpenDatabaseSync.mockReturnValue(
      sqlite as unknown as ReturnType<typeof openDatabaseSync>,
    );

    try {
      createCaneGuardDatabaseResources();
      throw new Error('Expected database initialization to fail.');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(StorageError);
      expect((error as StorageError).code).toBe('DATABASE_OPEN_FAILED');
    }

    expect(sqlite.closeSync).toHaveBeenCalledTimes(1);
  });
});
