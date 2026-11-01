import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { openDatabaseAsync } from 'expo-sqlite';
import type { PropsWithChildren } from 'react';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import migrations from '../../drizzle/migrations';
import {
  CANEGUARD_DATABASE_FILENAME,
  clearCaneGuardDatabaseResourcesForRetry,
  getCaneGuardDatabaseResources,
  type CaneGuardDatabase,
  type CaneGuardDatabaseResources,
} from '@/database/database';
import {
  describeStorageErrorCause,
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

const WEB_STORAGE_WARM_TIMEOUT_MS = 10_000;

type WebWarmState =
  | { status: 'warming' }
  | { status: 'ready' }
  | { status: 'failed'; error: StorageError };

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
  // On web the first synchronous SQLite call busy-waits on a `SharedArrayBuffer`
  // while the SQLite web worker is still starting, and a blocked main thread
  // starves that startup, so the open times out on a cold page load. One async
  // open first gives the worker a turn to finish starting; every later sync call
  // then behaves as it does on native. The warm-up connection is left open on
  // purpose: closing it would race the sync open that follows.
  const [webWarm, setWebWarm] = useState<WebWarmState>(() =>
    Platform.OS === 'web' ? { status: 'warming' } : { status: 'ready' },
  );

  useEffect(() => {
    if (Platform.OS !== 'web' || webWarm.status !== 'warming') {
      return;
    }

    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const settle = (next: WebWarmState) => {
      if (!active) {
        return;
      }
      active = false;
      clearTimeout(timer);
      setWebWarm(next);
    };
    const fail = (cause: unknown) => {
      settle({
        status: 'failed',
        error: toStorageError(
          cause,
          'DATABASE_OPEN_FAILED',
          'CaneGuard SQLite initialization failed.',
        ),
      });
    };

    timer = setTimeout(
      () => fail(new Error('The web SQLite warm-up timed out.')),
      WEB_STORAGE_WARM_TIMEOUT_MS,
    );
    void openDatabaseAsync(CANEGUARD_DATABASE_FILENAME).then(
      (database) => {
        if (!active) {
          void database.closeAsync().catch(() => undefined);
          return;
        }
        settle({ status: 'ready' });
      },
      fail,
    );

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [webWarm.status]);

  useEffect(() => {
    if (!__DEV__ || webWarm.status !== 'failed') {
      return;
    }
    const cause = describeStorageErrorCause(webWarm.error.cause);
    console.error(
      `[storage:${webWarm.error.code}] Local database open failed.${
        cause ? ` Cause: ${cause}` : ''
      }`,
    );
  }, [webWarm]);

  if (webWarm.status === 'failed') {
    return <DatabaseInitializationView error={webWarm.error} onRetry={onRetry} />;
  }

  if (webWarm.status === 'warming') {
    return <DatabaseInitializationView error={null} onRetry={onRetry} />;
  }

  return (
    <DatabaseResourcesAttempt onRetry={onRetry}>{children}</DatabaseResourcesAttempt>
  );
}

function DatabaseResourcesAttempt({
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
    if (!__DEV__ || !resourcesResult.error) {
      return;
    }
    // The cause is what makes the next failure diagnose itself: four different
    // web failures render the same generic screen. Only the cause's name and
    // message are logged, never a request body, credential or record value.
    const cause = describeStorageErrorCause(resourcesResult.error.cause);
    console.error(
      `[storage:${resourcesResult.error.code}] Local database open failed.${
        cause ? ` Cause: ${cause}` : ''
      }`,
    );
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
    if (!__DEV__ || !error) {
      return;
    }
    const cause = describeStorageErrorCause(error.cause);
    console.error(
      `[storage:${error.code}] Local database migration failed.${
        cause ? ` Cause: ${cause}` : ''
      }`,
    );
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

const DEFAULT_DATABASE_CONTEXT: DatabaseContextValue = {
  database: null,
  error: null,
  migrating: false,
  ready: false,
  retry: () => undefined,
  status: 'migrating',
};

export function useDatabaseState(): DatabaseContextValue {
  const context = useContext(DatabaseContext);
  return context ?? DEFAULT_DATABASE_CONTEXT;
}

export const EMPTY_DATABASE = {} as CaneGuardDatabase;

export function useCaneGuardDatabase(): CaneGuardDatabase {
  const { database, ready } = useDatabaseState();

  if (!ready || !database) {
    return EMPTY_DATABASE;
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
    borderRadius: Radius.lg,
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
