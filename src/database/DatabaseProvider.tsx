import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import type { PropsWithChildren } from 'react';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import migrations from '../../drizzle/migrations';
import {
  clearCaneGuardDatabaseResourcesForRetry,
  getCaneGuardDatabaseResources,
  type CaneGuardDatabase,
  type CaneGuardDatabaseResources,
} from '@/database/database';
import {
  getStorageErrorMessage,
  StorageError,
  toStorageError,
} from '@/database/errors';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type DatabaseInitializationStatus = 'migrating' | 'ready' | 'error';

interface DatabaseContextValue {
  database: CaneGuardDatabase | null;
  error: StorageError | null;
  migrating: boolean;
  ready: boolean;
  retry: () => void;
  status: DatabaseInitializationStatus;
}

const DatabaseContext = createContext<DatabaseContextValue | null>(null);

export function CaneGuardDatabaseProvider({ children }: PropsWithChildren) {
  const [attempt, setAttempt] = useState(0);

  const retry = () => {
    clearCaneGuardDatabaseResourcesForRetry();
    setAttempt((current) => current + 1);
  };

  return (
    <DatabaseConnectionAttempt key={attempt} onRetry={retry}>
      {children}
    </DatabaseConnectionAttempt>
  );
}

function DatabaseConnectionAttempt({
  children,
  onRetry,
}: PropsWithChildren<{ onRetry: () => void }>) {
  const [resourcesResult] = useState(() => {
    try {
      return { resources: getCaneGuardDatabaseResources(), error: null };
    } catch (error: unknown) {
      return {
        resources: null,
        error: toStorageError(
          error,
          'DATABASE_OPEN_FAILED',
          'CaneGuard SQLite initialization failed.',
        ),
      };
    }
  });

  useEffect(() => {
    if (__DEV__ && resourcesResult.error) {
      console.error(`[storage:${resourcesResult.error.code}] Local database open failed.`);
    }
  }, [resourcesResult.error]);

  if (!resourcesResult.resources) {
    return (
      <DatabaseContext.Provider
        value={{
          database: null,
          error: resourcesResult.error,
          migrating: false,
          ready: false,
          retry: onRetry,
          status: 'error',
        }}>
        <DatabaseInitializationView error={resourcesResult.error} onRetry={onRetry} />
      </DatabaseContext.Provider>
    );
  }

  return (
    <DatabaseMigrationGate
      resources={resourcesResult.resources}
      onRetry={onRetry}>
      {children}
    </DatabaseMigrationGate>
  );
}

function DatabaseMigrationGate({
  children,
  onRetry,
  resources,
}: PropsWithChildren<{
  onRetry: () => void;
  resources: CaneGuardDatabaseResources;
}>) {
  const migration = useMigrations(resources.database, migrations);
  const error = useMemo(
    () =>
      migration.error
        ? new StorageError('MIGRATION_FAILED', 'Bundled database migration failed.', {
            cause: migration.error,
          })
        : null,
    [migration.error],
  );

  useEffect(() => {
    if (__DEV__ && error) {
      console.error(`[storage:${error.code}] Local database migration failed.`);
    }
  }, [error]);

  const value = useMemo<DatabaseContextValue>(
    () => ({
      database: migration.success ? resources.database : null,
      error,
      migrating: !migration.success && !error,
      ready: migration.success,
      retry: onRetry,
      status: error ? 'error' : migration.success ? 'ready' : 'migrating',
    }),
    [error, migration.success, onRetry, resources.database],
  );

  return (
    <DatabaseContext.Provider value={value}>
      {error ? (
        <DatabaseInitializationView error={error} onRetry={onRetry} />
      ) : migration.success ? (
        children
      ) : (
        <DatabaseInitializationView error={null} onRetry={onRetry} />
      )}
    </DatabaseContext.Provider>
  );
}

function DatabaseInitializationView({
  error,
  onRetry,
}: {
  error: StorageError | null;
  onRetry: () => void;
}) {
  const theme = useTheme();

  return (
    <View
      accessibilityLiveRegion={error ? 'assertive' : 'polite'}
      style={[styles.screen, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.surfaceElevated,
            borderColor: error ? theme.danger : theme.border,
          },
        ]}>
        {error ? null : (
          <ActivityIndicator
            accessibilityLabel="Preparing local storage"
            color={theme.primary}
            size="large"
          />
        )}
        <Text
          accessibilityRole="header"
          style={[styles.title, { color: error ? theme.danger : theme.primaryDark }]}>
          {error ? 'Local storage needs attention' : 'Preparing local storage'}
        </Text>
        <Text style={[styles.message, { color: theme.textSecondary }]}>
          {error
            ? getStorageErrorMessage(error)
            : 'CaneGuard is applying safe database updates before opening your records.'}
        </Text>
        {error ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retry local storage initialization"
            onPress={onRetry}
            style={({ pressed }) => [
              styles.retry,
              { backgroundColor: theme.primary },
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.retryText, { color: theme.background }]}>Try Again</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function useDatabaseState(): DatabaseContextValue {
  const context = useContext(DatabaseContext);

  if (!context) {
    throw new Error('useDatabaseState must be used within CaneGuardDatabaseProvider.');
  }

  return context;
}

export function useCaneGuardDatabase(): CaneGuardDatabase {
  const { database, ready } = useDatabaseState();

  if (!ready || !database) {
    throw new StorageError('DATABASE_NOT_READY', 'The local database is not ready.');
  }

  return database;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing['2xl'],
  },
  title: {
    ...Typography.heading,
    textAlign: 'center',
  },
  message: {
    ...Typography.body,
    textAlign: 'center',
  },
  retry: {
    minHeight: 48,
    minWidth: 160,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
  },
  retryText: {
    ...Typography.body,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.78,
  },
});
