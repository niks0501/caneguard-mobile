import { count } from 'drizzle-orm';
import { useEffect, useState } from 'react';

import { CANEGUARD_DATABASE_FILENAME } from '@/database/database';
import { useDatabaseState } from '@/database/DatabaseProvider';
import {
  scanClassScores,
  scanQualityWarnings,
  scanRecords,
  scanSymptoms,
} from '@/database/schema';

export interface StorageDiagnostics {
  databaseFilename: string;
  foreignKeysEnabled: boolean;
  rowCounts: {
    classScores: number;
    qualityWarnings: number;
    records: number;
    symptoms: number;
  };
}

export function useStorageDiagnostics() {
  const state = useDatabaseState();
  const [diagnostics, setDiagnostics] = useState<StorageDiagnostics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!state.ready || !state.database) {
      return;
    }

    let mounted = true;

    void Promise.all([
      state.database.select({ value: count() }).from(scanRecords),
      state.database.select({ value: count() }).from(scanClassScores),
      state.database.select({ value: count() }).from(scanSymptoms),
      state.database.select({ value: count() }).from(scanQualityWarnings),
      state.database.$client.getFirstAsync<{ foreign_keys: number }>('PRAGMA foreign_keys'),
    ])
      .then(([records, classScores, symptoms, qualityWarnings, foreignKeys]) => {
        if (!mounted) {
          return;
        }

        setDiagnostics({
          databaseFilename: CANEGUARD_DATABASE_FILENAME,
          foreignKeysEnabled: foreignKeys?.foreign_keys === 1,
          rowCounts: {
            records: records[0]?.value ?? 0,
            classScores: classScores[0]?.value ?? 0,
            symptoms: symptoms[0]?.value ?? 0,
            qualityWarnings: qualityWarnings[0]?.value ?? 0,
          },
        });
        setError(null);
      })
      .catch(() => {
        if (mounted) {
          setError('QUERY_FAILED');
        }
      });

    return () => {
      mounted = false;
    };
  }, [refreshKey, state.database, state.ready]);

  return {
    diagnostics,
    error,
    refresh: () => setRefreshKey((current) => current + 1),
    status: state.status,
  };
}
