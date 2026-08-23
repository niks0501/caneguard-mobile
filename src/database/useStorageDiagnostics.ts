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
import { findOrphanedManagedImages } from '@/features/records/services/scanImageStorage';

export interface StorageDiagnostics {
  databaseFilename: string;
  foreignKeysEnabled: boolean;
  orphanImages: number;
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
      state.database
        .select({
          managedImageUri: scanRecords.managedImageUri,
          submissionImageUri: scanRecords.submissionImageUri,
        })
        .from(scanRecords),
      state.database.$client.getFirstAsync<{ foreign_keys: number }>('PRAGMA foreign_keys'),
    ])
      .then(
        ([
          records,
          classScores,
          symptoms,
          qualityWarnings,
          managedImages,
          foreignKeys,
        ]) => {
        if (!mounted) {
          return;
        }

        const referencedImages = managedImages.flatMap((image) =>
          [image.managedImageUri, image.submissionImageUri].filter(
            (uri): uri is string => Boolean(uri),
          ),
        );
        setDiagnostics({
          databaseFilename: CANEGUARD_DATABASE_FILENAME,
          foreignKeysEnabled: foreignKeys?.foreign_keys === 1,
          orphanImages: findOrphanedManagedImages(referencedImages).length,
          rowCounts: {
            records: records[0]?.value ?? 0,
            classScores: classScores[0]?.value ?? 0,
            symptoms: symptoms[0]?.value ?? 0,
            qualityWarnings: qualityWarnings[0]?.value ?? 0,
          },
        });
        setError(null);
        },
      )
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
