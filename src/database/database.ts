import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import {
  openDatabaseSync,
  type SQLiteDatabase,
} from 'expo-sqlite';

import { StorageError, toStorageError } from '@/database/errors';
import * as schema from '@/database/schema';

export const CANEGUARD_DATABASE_FILENAME = 'caneguard.db';

export type CaneGuardDatabase = ExpoSQLiteDatabase<typeof schema> & {
  $client: SQLiteDatabase;
};

export interface CaneGuardDatabaseResources {
  database: CaneGuardDatabase;
  sqlite: SQLiteDatabase;
}

let sharedResources: CaneGuardDatabaseResources | null = null;

export function createCaneGuardDatabaseResources(): CaneGuardDatabaseResources {
  let sqlite: SQLiteDatabase | null = null;

  try {
    sqlite = openDatabaseSync(CANEGUARD_DATABASE_FILENAME);
    sqlite.execSync('PRAGMA foreign_keys = ON');

    const foreignKeyState = sqlite.getFirstSync<{ foreign_keys: number }>(
      'PRAGMA foreign_keys',
    );

    if (foreignKeyState?.foreign_keys !== 1) {
      throw new StorageError(
        'DATABASE_OPEN_FAILED',
        'SQLite foreign-key enforcement could not be enabled.',
      );
    }

    return {
      database: drizzle(sqlite, { schema }),
      sqlite,
    };
  } catch (error: unknown) {
    sqlite?.closeSync();
    throw toStorageError(
      error,
      'DATABASE_OPEN_FAILED',
      'CaneGuard SQLite initialization failed.',
    );
  }
}

export function getCaneGuardDatabaseResources(): CaneGuardDatabaseResources {
  sharedResources ??= createCaneGuardDatabaseResources();
  return sharedResources;
}

export function clearCaneGuardDatabaseResourcesForRetry(): void {
  const resources = sharedResources;
  sharedResources = null;

  try {
    resources?.sqlite.closeSync();
  } catch {
    if (__DEV__) {
      console.error('[storage:DATABASE_OPEN_FAILED] Previous database connection did not close.');
    }
  }
}
