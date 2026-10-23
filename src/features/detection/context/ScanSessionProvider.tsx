import { randomUUID } from 'expo-crypto';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type PropsWithChildren,
} from 'react';

import { useCaneGuardDatabase } from '@/database/DatabaseProvider';
import {
  initialScanSessionState,
  scanSessionReducer,
} from '@/features/detection/context/scanSessionReducer';
import {
  buildScanDraftCheckpoint,
  deleteScanDraftCheckpoint,
  readScanDraftCheckpoint,
  writeScanDraftCheckpoint,
} from '@/features/detection/drafts/scanDraftCheckpoint';
import type { ScanSessionAction, ScanSessionState } from '@/features/detection/types';
import { AuthContext } from '@/features/auth/providers/AuthProvider';
import {
  copyScanImageToManagedStorage,
  deleteManagedScanImage,
  managedImageExists,
  type ManagedImage,
} from '@/features/records/services/scanImageStorage';

export type ScanSessionContextValue = {
  state: ScanSessionState;
  dispatch: Dispatch<ScanSessionAction>;
};

export const ScanSessionContext = createContext<ScanSessionContextValue | null>(null);

/** Honest recovery state for the in-progress scan draft. */
export type ScanDraftStatus = 'idle' | 'saving' | 'saved' | 'failed';

export interface ScanDraftContextValue {
  /** Clears the checkpoint and managed draft image without touching visible state. */
  clearSavedDraft: () => Promise<void>;
  /** Discards the saved draft and clears visible session state. */
  discardSavedDraft: () => Promise<boolean>;
  draftSavedAt: string | null;
  draftStatus: ScanDraftStatus;
  /** Persists the latest state now and reports whether it is on the device. */
  flushSavedDraft: () => Promise<boolean>;
  /** True while `owner` is still the signed-in owner for this process. */
  isOwnerCurrent: (owner: string | null) => boolean;
  ownerIdentity: string | null;
}

export const ScanDraftContext = createContext<ScanDraftContextValue | null>(null);

interface StoredDraftImage {
  draftId: string;
  imageMimeType: string | null;
  imageSizeBytes: number | null;
  managedImageUri: string;
}

export function ScanSessionProvider({ children }: PropsWithChildren) {
  const database = useCaneGuardDatabase();
  // Optional so a screen/provider can render in isolation; the app always
  // mounts this provider under AuthProvider.
  const auth = useContext(AuthContext);
  const ownerIdentity =
    auth?.status === 'authenticated' ? auth.user?.uuid ?? null : null;
  const [state, rawDispatch] = useReducer(scanSessionReducer, initialScanSessionState);
  const [draftStatus, setDraftStatus] = useState<ScanDraftStatus>('idle');
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);

  const ownerRef = useRef<string | null>(ownerIdentity);
  const stateRef = useRef(state);
  const draftImageRef = useRef<StoredDraftImage | null>(null);
  const imageOperation = useRef(0);
  const saveChain = useRef<Promise<void>>(Promise.resolve());
  const lastSignature = useRef<string | null>(null);
  const lastWriteOk = useRef(true);
  const mounted = useRef(true);

  stateRef.current = state;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const persistCheckpoint = useCallback(
    (owner: string) => {
      const draft = draftImageRef.current;
      const currentState = stateRef.current;
      if (!draft) {
        return Promise.resolve();
      }
      const checkpoint = buildScanDraftCheckpoint({
        draftId: draft.draftId,
        imageMimeType: draft.imageMimeType,
        imageSizeBytes: draft.imageSizeBytes,
        managedImageUri: draft.managedImageUri,
        savedAt: new Date().toISOString(),
        state: currentState,
      });
      if (!checkpoint) {
        return Promise.resolve();
      }
      const signature = checkpointSignature(checkpoint);
      if (lastSignature.current === signature) {
        return Promise.resolve();
      }
      if (mounted.current && ownerRef.current === owner) {
        setDraftStatus('saving');
      }
      saveChain.current = saveChain.current.then(async () => {
        try {
          await writeScanDraftCheckpoint(database, owner, checkpoint);
          lastSignature.current = signature;
          lastWriteOk.current = true;
          if (mounted.current && ownerRef.current === owner) {
            setDraftStatus('saved');
            setDraftSavedAt(checkpoint.savedAt);
          }
        } catch {
          lastWriteOk.current = false;
          if (mounted.current && ownerRef.current === owner) {
            setDraftStatus('failed');
          }
        }
      });
      return saveChain.current;
    },
    [database],
  );

  const persistSelectedImage = useCallback(
    async (
      owner: string,
      payload: {
        sourceHeight: number | null;
        sourceType: 'camera' | 'gallery';
        sourceUri: string;
        sourceWidth: number | null;
      },
    ) => {
      const operation = ++imageOperation.current;
      if (mounted.current && ownerRef.current === owner) {
        setDraftStatus('saving');
      }
      let managed: ManagedImage;
      try {
        managed = await copyScanImageToManagedStorage({
          ownerIdentity: owner,
          recordId: randomUUID(),
          sourceHeight: payload.sourceHeight,
          sourceType: payload.sourceType,
          sourceUri: payload.sourceUri,
          sourceWidth: payload.sourceWidth,
        });
      } catch {
        if (mounted.current && ownerRef.current === owner) {
          setDraftStatus('failed');
        }
        return;
      }

      // A newer selection, another owner, or unmount makes this copy stale.
      if (
        !mounted.current ||
        ownerRef.current !== owner ||
        imageOperation.current !== operation
      ) {
        try {
          deleteManagedScanImage(managed.managedUri, owner);
        } catch {
          // An orphaned owner-partitioned file is better than deleting nothing.
        }
        return;
      }

      const previous = draftImageRef.current;
      draftImageRef.current = {
        draftId: randomUUID(),
        imageMimeType: managed.mimeType,
        imageSizeBytes: managed.sizeBytes,
        managedImageUri: managed.managedUri,
      };
      if (previous && previous.managedImageUri !== managed.managedUri) {
        try {
          deleteManagedScanImage(previous.managedImageUri, owner);
        } catch {
          // Best effort: the checkpoint now points at the replacement image.
        }
      }
      await persistCheckpoint(owner);
    },
    [persistCheckpoint],
  );

  const dispatch = useCallback(
    (action: ScanSessionAction) => {
      const actionOwner = ownerRef.current;
      if (action.type === 'SELECT_IMAGE') {
        rawDispatch(action);
        if (actionOwner) {
          void persistSelectedImage(actionOwner, action.payload);
        }
        return;
      }
      if (action.type === 'RESET_SCAN') {
        rawDispatch(action);
        const previous = draftImageRef.current;
        draftImageRef.current = null;
        imageOperation.current += 1;
        if (mounted.current) {
          setDraftStatus('idle');
          setDraftSavedAt(null);
        }
        if (actionOwner) {
          saveChain.current = saveChain.current.then(async () => {
            try {
              deleteScanDraftCheckpoint(database, actionOwner);
            } catch {
              if (previous) {
                try {
                  deleteManagedScanImage(previous.managedImageUri, actionOwner);
                } catch {
                  // Best effort cleanup after an explicit discard.
                }
              }
            }
          });
        }
        return;
      }
      rawDispatch(action);
    },
    [database, persistSelectedImage],
  );

  // Owner change: never carry one inspector's visible scan into another
  // account, and never delete the previous owner's saved draft.
  useEffect(() => {
    ownerRef.current = ownerIdentity;
    imageOperation.current += 1;
    draftImageRef.current = null;
    lastSignature.current = null;
    rawDispatch({ type: 'RESET_SCAN' });
    setDraftStatus('idle');
    setDraftSavedAt(null);

    if (!ownerIdentity) {
      return;
    }

    let active = true;
    try {
      const record = readScanDraftCheckpoint(database, ownerIdentity);
      if (!active || !record) {
        return;
      }
      const checkpoint = record.checkpoint;
      if (!managedImageExists(checkpoint.managedImageUri)) {
        return;
      }
      draftImageRef.current = {
        draftId: checkpoint.draftId,
        imageMimeType: checkpoint.imageMimeType,
        imageSizeBytes: checkpoint.imageSizeBytes,
        managedImageUri: checkpoint.managedImageUri,
      };
      lastSignature.current = checkpointSignature(checkpoint);
      rawDispatch({
        type: 'RESTORE_SCAN',
        payload: {
          preprocessMs: checkpoint.preprocessMs,
          processedUri: null,
          qualityAssessment: checkpoint.qualityAssessment,
          reportedSeverity: checkpoint.reportedSeverity,
          result: checkpoint.result,
          selectedSymptoms: checkpoint.selectedSymptoms,
          sourceHeight: checkpoint.sourceHeight,
          sourceType: checkpoint.sourceType,
          sourceUri: checkpoint.managedImageUri,
          sourceWidth: checkpoint.sourceWidth,
          status: checkpoint.status,
        },
      });
      setDraftStatus('saved');
      setDraftSavedAt(checkpoint.savedAt);
    } catch {
      if (active) {
        setDraftStatus('failed');
      }
    }
    return () => {
      active = false;
    };
  }, [database, ownerIdentity]);

  // Checkpoint each settled state change (selection, analysis result, guided
  // answers). In-flight pipeline statuses are intentionally skipped.
  useEffect(() => {
    if (!ownerIdentity || !draftImageRef.current) {
      return;
    }
    if (
      state.status === 'preprocessing' ||
      state.status === 'running' ||
      state.status === 'finalizing'
    ) {
      return;
    }
    void persistCheckpoint(ownerIdentity);
  }, [
    ownerIdentity,
    persistCheckpoint,
    state.reportedSeverity,
    state.result,
    state.selectedSymptoms,
    state.status,
  ]);

  const clearSavedDraft = useCallback(async () => {
    const owner = ownerRef.current;
    draftImageRef.current = null;
    if (mounted.current) {
      setDraftStatus('idle');
      setDraftSavedAt(null);
    }
    if (!owner) {
      return;
    }
    try {
      deleteScanDraftCheckpoint(database, owner);
    } catch {
      if (mounted.current) {
        setDraftStatus('failed');
      }
    }
  }, [database]);

  const discardSavedDraft = useCallback(async () => {
    const owner = ownerRef.current;
    if (!owner) {
      return false;
    }
    try {
      deleteScanDraftCheckpoint(database, owner);
    } catch {
      return false;
    }
    draftImageRef.current = null;
    imageOperation.current += 1;
    rawDispatch({ type: 'RESET_SCAN' });
    setDraftStatus('idle');
    setDraftSavedAt(null);
    return true;
  }, [database]);

  const flushSavedDraft = useCallback(async () => {
    const owner = ownerRef.current;
    if (!owner || !draftImageRef.current) {
      return true;
    }
    await persistCheckpoint(owner);
    return lastWriteOk.current;
  }, [persistCheckpoint]);

  const isOwnerCurrent = useCallback(
    (owner: string | null) => owner !== null && ownerRef.current === owner,
    [],
  );

  const sessionValue = useMemo(() => ({ dispatch, state }), [dispatch, state]);
  const draftValue = useMemo<ScanDraftContextValue>(
    () => ({
      clearSavedDraft,
      discardSavedDraft,
      draftSavedAt,
      draftStatus,
      flushSavedDraft,
      isOwnerCurrent,
      ownerIdentity,
    }),
    [
      clearSavedDraft,
      discardSavedDraft,
      draftSavedAt,
      draftStatus,
      flushSavedDraft,
      isOwnerCurrent,
      ownerIdentity,
    ],
  );

  return (
    <ScanSessionContext.Provider value={sessionValue}>
      <ScanDraftContext.Provider value={draftValue}>
        {children}
      </ScanDraftContext.Provider>
    </ScanSessionContext.Provider>
  );
}

function checkpointSignature(checkpoint: {
  draftId: string;
  qualityAssessment: unknown;
  reportedSeverity: string | null;
  result: { confidence: number; predictedLabel: string } | null;
  selectedSymptoms: readonly string[];
  status: string;
}): string {
  return JSON.stringify([
    checkpoint.draftId,
    checkpoint.status,
    checkpoint.result?.predictedLabel ?? null,
    checkpoint.result?.confidence ?? null,
    checkpoint.selectedSymptoms,
    checkpoint.reportedSeverity,
    checkpoint.qualityAssessment,
  ]);
}

/**
 * Draft recovery helpers are optional for screens rendered in isolation (and
 * for older suites that only provide the session context).
 */
export function useScanDraft(): ScanDraftContextValue {
  const value = useContext(ScanDraftContext);
  if (value) {
    return value;
  }
  return NO_DRAFT;
}

const NO_DRAFT: ScanDraftContextValue = {
  clearSavedDraft: async () => undefined,
  discardSavedDraft: async () => false,
  draftSavedAt: null,
  draftStatus: 'idle',
  flushSavedDraft: async () => true,
  isOwnerCurrent: () => true,
  ownerIdentity: null,
};
