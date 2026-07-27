import { randomUUID } from 'expo-crypto';
import { useRef, useState } from 'react';

import { useCaneGuardDatabase } from '@/database/DatabaseProvider';
import {
  getStorageErrorMessage,
  toStorageError,
  type StorageError,
} from '@/database/errors';
import type { ScanSessionState } from '@/features/detection/types';
import { saveCompletedScan } from '@/features/records/services/saveCompletedScan';
import { useSync } from '@/features/sync/hooks/useSync';

export type SaveRecordStatus = 'ready' | 'saving' | 'saved' | 'failed';

export interface SaveRecordState {
  error: StorageError | null;
  errorMessage: string | null;
  recordId: string | null;
  status: SaveRecordStatus;
}

const INITIAL_STATE: SaveRecordState = {
  error: null,
  errorMessage: null,
  recordId: null,
  status: 'ready',
};

export function useSaveCompletedScan(state: ScanSessionState) {
  const database = useCaneGuardDatabase();
  const sync = useSync();
  const [saveState, setSaveState] = useState<SaveRecordState>(INITIAL_STATE);
  const recordId = useRef<string | null>(null);
  const inFlight = useRef<Promise<{ id: string }> | null>(null);

  async function save(): Promise<{ id: string } | null> {
    if (inFlight.current) {
      return inFlight.current;
    }

    recordId.current ??= randomUUID();
    setSaveState({
      error: null,
      errorMessage: null,
      recordId: recordId.current,
      status: 'saving',
    });

    const operation = saveCompletedScan({
      database,
      state,
      recordId: recordId.current,
    });
    inFlight.current = operation;

    try {
      const saved = await operation;
      setSaveState({
        error: null,
        errorMessage: null,
        recordId: saved.id,
        status: 'saved',
      });
      void sync.syncNow('after-save');
      return saved;
    } catch (error: unknown) {
      const storageError = toStorageError(
        error,
        'SAVE_TRANSACTION_FAILED',
        'Saving the completed scan failed.',
      );
      setSaveState({
        error: storageError,
        errorMessage: getStorageErrorMessage(storageError),
        recordId: recordId.current,
        status: 'failed',
      });
      return null;
    } finally {
      inFlight.current = null;
    }
  }

  return {
    ...saveState,
    save,
  };
}
