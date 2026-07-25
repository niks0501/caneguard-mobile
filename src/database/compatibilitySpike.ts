import { drizzle } from 'drizzle-orm/expo-sqlite';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { openDatabaseSync } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import migrations from '../../drizzle/migrations';
import { compatibilityProbe } from './compatibilitySpikeSchema';

/**
 * Chosen in Phase 0 and retained by Phase 1 so the compatibility database can
 * be upgraded in place instead of reset.
 */
export const CANEGUARD_DATABASE_FILENAME = 'caneguard.db';

const expoDatabase = openDatabaseSync(CANEGUARD_DATABASE_FILENAME);

export const compatibilityDatabase = drizzle(expoDatabase);

export function useCompatibilityDatabaseProbe() {
  const migration = useMigrations(compatibilityDatabase, migrations);
  const [probePersisted, setProbePersisted] = useState<boolean | null>(null);

  useEffect(() => {
    if (!migration.success) {
      return;
    }

    let isMounted = true;

    void compatibilityDatabase
      .insert(compatibilityProbe)
      .values({ id: 1, createdAt: new Date().toISOString() })
      .onConflictDoNothing()
      .then(() => compatibilityDatabase.select().from(compatibilityProbe).limit(1))
      .then((rows) => {
        if (isMounted) {
          setProbePersisted(rows.length === 1);
        }
      })
      .catch(() => {
        if (isMounted) {
          setProbePersisted(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [migration.success]);

  return { ...migration, probePersisted };
}
