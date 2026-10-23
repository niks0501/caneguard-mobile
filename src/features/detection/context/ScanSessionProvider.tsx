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
import type { CaneGuardDatabase } from '@/database/database';
import { AuthContext } from '@/features/auth/providers/AuthProvider';
import {
  initialScanSessionState,
  scanSessionReducer,
} from '@/features/detection/context/scanSessionReducer';
import {
  buildScanDraftCheckpoint,
  deleteScanDraftCheckpoint,
  readScanDraftCheckpoint,
  writeScanDraftCheckpoint,
  type ScanDraftCheckpoint,
} from '@/features/detection/drafts/scanDraftCheckpoint';
import type {
  ScanSessionAction,
  ScanSessionState,
  ScanSourceType,
} from '@/features/detection/types';
import {
  copyScanImageToManagedStorage,
  deleteManagedScanImage,
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
  /** Discards the saved draft and clears visible session state. */
  discardSavedDraft: () => Promise<boolean>;
  draftSavedAt: string | null;
  draftStatus: ScanDraftStatus;
  /**
   * Removes the resumable checkpoint of a session whose scan record is already
   * saved, keeping the live session and its image on screen.
   */
  finalizeSavedDraft: () => void;
  /** Persists the latest state now and reports whether it is on the device. */
  flushSavedDraft: () => Promise<boolean>;
  /** True while `owner` is still the signed-in owner for this process. */
  isOwnerCurrent: (owner: string | null) => boolean;
  ownerIdentity: string | null;
}

export const ScanDraftContext = createContext<ScanDraftContextValue | null>(null);

interface ScanImageSelection {
  sourceHeight: number | null;
  sourceType: ScanSourceType;
  sourceUri: string;
  sourceWidth: number | null;
}

interface StoredDraftImage {
  draftId: string;
  imageMimeType: string | null;
  imageSizeBytes: number | null;
  managedImageUri: string;
  sourceUri: string;
}

export function ScanSessionProvider({ children }: PropsWithChildren) {
  const database = useCaneGuardDatabase();
  // Optional so a screen or provider suite can render in isolation; the app
  // always mounts this provider under AuthProvider.
  const auth = useContext(AuthContext);
  const ownerIdentity =
    auth?.status === 'authenticated' ? auth.user?.uuid ?? null : null;

  // Keying by owner makes an owner change a fresh session: no state from the
  // previous inspector can survive, and the previous owner's saved draft is
  // never deleted or reassigned.
  return (
    <ScanSessionOwner
      key={ownerIdentity ?? 'signed-out'}
      database={database}
      ownerIdentity={ownerIdentity}>
      {children}
    </ScanSessionOwner>
  );
}

function restoredSessionState(checkpoint: ScanDraftCheckpoint): ScanSessionState {
  return {
    ...initialScanSessionState,
    preprocessMs: checkpoint.preprocessMs,
    qualityAssessment: checkpoint.qualityAssessment,
    reportedSeverity: checkpoint.reportedSeverity,
    result: checkpoint.result,
    selectedSymptoms: checkpoint.selectedSymptoms,
    sourceHeight: checkpoint.sourceHeight,
    sourceType: checkpoint.sourceType,
    sourceUri: checkpoint.managedImageUri,
    sourceWidth: checkpoint.sourceWidth,
    status: checkpoint.status,
  };
}

function storedImageFrom(checkpoint: ScanDraftCheckpoint): StoredDraftImage {
  return {
    draftId: checkpoint.draftId,
    imageMimeType: checkpoint.imageMimeType,
    imageSizeBytes: checkpoint.imageSizeBytes,
    managedImageUri: checkpoint.managedImageUri,
    sourceUri: checkpoint.managedImageUri,
  };
}

function ScanSessionOwner({
  children,
  database,
  ownerIdentity,
}: PropsWithChildren<{
  database: CaneGuardDatabase;
  ownerIdentity: string | null;
}>) {
  const [initialDraft] = useState(() =>
    ownerIdentity ? readScanDraftCheckpoint(database, ownerIdentity) : null,
  );
  const [state, rawDispatch] = useReducer(
    scanSessionReducer,
    initialDraft?.checkpoint ?? null,
    (checkpoint) =>
      checkpoint ? restoredSessionState(checkpoint) : initialScanSessionState,
  );
  const [draftStatus, setDraftStatus] = useState<ScanDraftStatus>(
    initialDraft ? 'saved' : 'idle',
  );
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(
    initialDraft?.checkpoint.savedAt ?? null,
  );

  const stateRef = useRef(state);
  const draftImageRef = useRef<StoredDraftImage | null>(
    initialDraft ? storedImageFrom(initialDraft.checkpoint) : null,
  );
  const imageOperation = useRef(0);
  const lastSelectionAttempt = useRef<{
    promise: Promise<boolean>;
    selection: ScanImageSelection;
  } | null>(null);
  const saveChain = useRef<Promise<void>>(Promise.resolve());
  const lastSignature = useRef<string | null>(
    initialDraft ? checkpointSignature(initialDraft.checkpoint) : null,
  );
  const mounted = useRef(true);
  const finalized = useRef(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const persistCheckpoint = useCallback(
    (owner: string): Promise<boolean> => {
      const draft = draftImageRef.current;
      const currentState = stateRef.current;
      if (finalized.current || !draft || !owner) {
        return Promise.resolve(false);
      }
      if (draft.sourceUri !== currentState.sourceUri) {
        return Promise.resolve(false);
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
        return Promise.resolve(false);
      }
      const signature = checkpointSignature(checkpoint);
      if (lastSignature.current === signature) {
        return Promise.resolve(true);
      }
      if (mounted.current) {
        setDraftStatus('saving');
      }
      const write = saveChain.current.then(async (): Promise<boolean> => {
        try {
          await writeScanDraftCheckpoint(database, owner, checkpoint);
          lastSignature.current = signature;
          if (mounted.current) {
            setDraftStatus('saved');
            setDraftSavedAt(checkpoint.savedAt);
          }
          return true;
        } catch {
          if (mounted.current) {
            setDraftStatus('failed');
          }
          return false;
        }
      });
      saveChain.current = write.then(() => undefined);
      return write;
    },
    [database],
  );

  const copySelectedImage = useCallback(
    async (payload: ScanImageSelection): Promise<boolean> => {
      if (!ownerIdentity) {
        return false;
      }
      const operation = ++imageOperation.current;
      if (mounted.current) {
        setDraftStatus('saving');
      }
      let managed: ManagedImage;
      try {
        managed = await copyScanImageToManagedStorage({
          ownerIdentity,
          recordId: randomUUID(),
          sourceHeight: payload.sourceHeight,
          sourceType: payload.sourceType,
          sourceUri: payload.sourceUri,
          sourceWidth: payload.sourceWidth,
        });
      } catch {
        if (mounted.current) {
          setDraftStatus('failed');
        }
        return false;
      }

      // A newer selection or unmount makes this copy stale.
      if (!mounted.current || imageOperation.current !== operation) {
        try {
          deleteManagedScanImage(managed.managedUri, ownerIdentity);
        } catch {
          // An orphaned owner-partitioned file is better than deleting nothing.
        }
        return false;
      }

      const previous = draftImageRef.current;
      draftImageRef.current = {
        draftId: randomUUID(),
        imageMimeType: managed.mimeType,
        imageSizeBytes: managed.sizeBytes,
        managedImageUri: managed.managedUri,
        sourceUri: payload.sourceUri,
      };
      const written = await persistCheckpoint(ownerIdentity);
      if (written && previous && previous.managedImageUri !== managed.managedUri) {
        try {
          deleteManagedScanImage(previous.managedImageUri, ownerIdentity);
        } catch {
          // Best effort: the checkpoint now points at the replacement image.
        }
      }
      return written;
    },
    [ownerIdentity, persistCheckpoint],
  );

  const persistSelectedImage = useCallback(
    (payload: ScanImageSelection): Promise<boolean> => {
      const attempt = copySelectedImage(payload);
      lastSelectionAttempt.current = {
        promise: attempt,
        selection: payload,
      };
      return attempt;
    },
    [copySelectedImage],
  );

  const dispatch = useCallback(
    (action: ScanSessionAction) => {
      if (action.type === 'SELECT_IMAGE') {
        finalized.current = false;
        rawDispatch(action);
        void persistSelectedImage(action.payload);
        return;
      }
      if (action.type === 'RESET_SCAN') {
        finalized.current = false;
        rawDispatch(action);
        const trackedImage = draftImageRef.current;
        draftImageRef.current = null;
        imageOperation.current += 1;
        if (mounted.current) {
          setDraftStatus('idle');
          setDraftSavedAt(null);
        }
        if (ownerIdentity) {
          saveChain.current = saveChain.current.then(async () => {
            try {
              deleteScanDraftCheckpoint(database, ownerIdentity);
              if (trackedImage) {
                deleteManagedScanImage(trackedImage.managedImageUri, ownerIdentity);
              }
            } catch {
              // Best effort cleanup after an explicit reset.
            }
          });
        }
        return;
      }
      rawDispatch(action);
    },
    [database, ownerIdentity, persistSelectedImage],
  );

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
    state.sourceUri,
    state.status,
  ]);

  const discardSavedDraft = useCallback(async () => {
    if (!ownerIdentity) {
      return false;
    }
    const trackedImage = draftImageRef.current;
    try {
      deleteScanDraftCheckpoint(database, ownerIdentity);
    } catch {
      return false;
    }
    if (trackedImage) {
      try {
        deleteManagedScanImage(trackedImage.managedImageUri, ownerIdentity);
      } catch {
        // Best effort: the checkpoint that named this image is already gone.
      }
    }
    draftImageRef.current = null;
    imageOperation.current += 1;
    finalized.current = false;
    rawDispatch({ type: 'RESET_SCAN' });
    setDraftStatus('idle');
    setDraftSavedAt(null);
    return true;
  }, [database, ownerIdentity]);

  const finalizeSavedDraft = useCallback(() => {
    if (!ownerIdentity) {
      return;
    }
    try {
      deleteScanDraftCheckpoint(database, ownerIdentity, {
        keepManagedImage: true,
      });
    } catch {
      // Best effort: the explicit reset on leave retries this cleanup.
    }
    finalized.current = true;
  }, [database, ownerIdentity]);

  const flushSavedDraft = useCallback(async () => {
    if (!ownerIdentity) {
      return true;
    }
    const selection = stateRef.current.sourceUri;
    if (selection === null) {
      return true;
    }
    if (draftImageRef.current?.sourceUri !== selection) {
      const attempt = lastSelectionAttempt.current;
      if (attempt?.selection.sourceUri === selection) {
        await attempt.promise;
      }
    }
    if (draftImageRef.current?.sourceUri === selection) {
      return persistCheckpoint(ownerIdentity);
    }
    const sourceType = stateRef.current.sourceType;
    if (!sourceType) {
      return false;
    }
    return persistSelectedImage({
      sourceHeight: stateRef.current.sourceHeight,
      sourceType,
      sourceUri: selection,
      sourceWidth: stateRef.current.sourceWidth,
    });
  }, [ownerIdentity, persistCheckpoint, persistSelectedImage]);

  const isOwnerCurrent = useCallback(
    (owner: string | null) => owner !== null && owner === ownerIdentity,
    [ownerIdentity],
  );

  const sessionValue = useMemo(() => ({ dispatch, state }), [dispatch, state]);
  const draftValue = useMemo<ScanDraftContextValue>(
    () => ({
      discardSavedDraft,
      draftSavedAt,
      draftStatus,
      finalizeSavedDraft,
      flushSavedDraft,
      isOwnerCurrent,
      ownerIdentity,
    }),
    [
      discardSavedDraft,
      draftSavedAt,
      draftStatus,
      finalizeSavedDraft,
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
  discardSavedDraft: async () => false,
  draftSavedAt: null,
  draftStatus: 'idle',
  finalizeSavedDraft: () => undefined,
  flushSavedDraft: async () => true,
  isOwnerCurrent: () => true,
  ownerIdentity: null,
};
