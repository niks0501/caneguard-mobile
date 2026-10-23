import { randomUUID } from 'expo-crypto';
import { useRef, useState } from 'react';

import { useCaneGuardDatabase } from '@/database/DatabaseProvider';
import {
  getStorageErrorMessage,
  StorageError,
  toStorageError,
} from '@/database/errors';
import type { ScanSessionState } from '@/features/detection/types';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { saveCompletedScan } from '@/features/records/services/saveCompletedScan';

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
  const { user } = useAuth();
  const [saveState, setSaveState] = useState<SaveRecordState>(INITIAL_STATE);
  const recordId = useRef<string | null>(null);
  const inFlight = useRef<Promise<{ id: string }> | null>(null);
  // A result-based caller needs the failure message that belongs to the write
  // it just awaited, not an older render's state value.
  const lastError = useRef<string | null>(null);

  async function save(): Promise<{ id: string } | null> {
    if (inFlight.current) {
      return inFlight.current;
    }

    lastError.current = null;
    recordId.current ??= randomUUID();
    setSaveState({
      error: null,
      errorMessage: null,
      recordId: recordId.current,
      status: 'saving',
    });

    if (!user) {
      const error = new StorageError(
        'INVALID_SCAN_RECORD',
        'Sign in before saving a scan record.',
      );
      lastError.current = getStorageErrorMessage(error);
      setSaveState({
        error,
        errorMessage: getStorageErrorMessage(error),
        recordId: recordId.current,
        status: 'failed',
      });
      return null;
    }

    const operation = saveCompletedScan({
      database,
      ownerIdentity: user.uuid,
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
      return saved;
    } catch (error: unknown) {
      const storageError = toStorageError(
        error,
        'SAVE_TRANSACTION_FAILED',
        'Saving the completed scan failed.',
      );
      lastError.current = getStorageErrorMessage(storageError);
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
    getLastError: () => lastError.current,
    save,
  };
}
