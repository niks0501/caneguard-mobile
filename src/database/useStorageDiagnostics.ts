import { count, eq } from 'drizzle-orm';
import { useEffect, useState } from 'react';

import { CANEGUARD_DATABASE_FILENAME } from '@/database/database';
import { useDatabaseState } from '@/database/DatabaseProvider';
import {
  scanClassScores,
  scanQualityWarnings,
  scanRecords,
  scanSymptoms,
} from '@/database/schema';
import { useAuth } from '@/features/auth/hooks/useAuth';
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
  const { user } = useAuth();
  const [diagnostics, setDiagnostics] = useState<StorageDiagnostics | null>(null);
  const [diagnosticsOwnerIdentity, setDiagnosticsOwnerIdentity] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorOwnerIdentity, setErrorOwnerIdentity] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!state.ready || !state.database || !user) {
      return;
    }

    let mounted = true;

    void Promise.all([
      state.database
        .select({ value: count() })
        .from(scanRecords)
        .where(eq(scanRecords.ownerIdentity, user.uuid)),
      state.database
        .select({ value: count() })
        .from(scanClassScores)
        .innerJoin(scanRecords, eq(scanClassScores.scanRecordId, scanRecords.id))
        .where(eq(scanRecords.ownerIdentity, user.uuid)),
      state.database
        .select({ value: count() })
        .from(scanSymptoms)
        .innerJoin(scanRecords, eq(scanSymptoms.scanRecordId, scanRecords.id))
        .where(eq(scanRecords.ownerIdentity, user.uuid)),
      state.database
        .select({ value: count() })
        .from(scanQualityWarnings)
        .innerJoin(scanRecords, eq(scanQualityWarnings.scanRecordId, scanRecords.id))
        .where(eq(scanRecords.ownerIdentity, user.uuid)),
      state.database
        .select({
          managedImageUri: scanRecords.managedImageUri,
          submissionImageUri: scanRecords.submissionImageUri,
        })
        .from(scanRecords)
        .where(eq(scanRecords.ownerIdentity, user.uuid)),
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
            orphanImages: findOrphanedManagedImages(referencedImages, user.uuid).length,
            rowCounts: {
              records: records[0]?.value ?? 0,
              classScores: classScores[0]?.value ?? 0,
              symptoms: symptoms[0]?.value ?? 0,
              qualityWarnings: qualityWarnings[0]?.value ?? 0,
            },
          });
          setDiagnosticsOwnerIdentity(user.uuid);
          setError(null);
          setErrorOwnerIdentity(null);
        },
      )
      .catch(() => {
        if (mounted) {
          setError('QUERY_FAILED');
          setErrorOwnerIdentity(user.uuid);
        }
      });

    return () => {
      mounted = false;
    };
  }, [refreshKey, state.database, state.ready, user]);

  return {
    diagnostics: diagnosticsOwnerIdentity === user?.uuid ? diagnostics : null,
    error: errorOwnerIdentity === user?.uuid ? error : null,
    refresh: () => setRefreshKey((current) => current + 1),
    status: state.status,
  };
}
