import type { ScanSessionState } from '@/features/detection/types';

/**
 * The one named answer to "where is the photo check?". Agents, tests and the
 * screen read this instead of guessing from copy and four separate flags.
 */
export type ScanCheckState =
  | 'no-photo'
  | 'checking-photo'
  | 'photo-rejected'
  | 'checking-sugarcane'
  | 'not-sugarcane'
  | 'photo-unusable'
  | 'waiting-model'
  | 'analysing'
  | 'result'
  | 'result-doubtful'
  | 'model-failed'
  | 'check-failed';

export interface ScanCheckInputs {
  /** Source 1: session status and the data it carries. */
  session: Pick<
    ScanSessionState,
    | 'sourceUri'
    | 'status'
    | 'result'
    | 'qualityAssessment'
    | 'photoPreparationFailed'
    | 'guardFailure'
    | 'guardPassed'
  >;
  /** Source 2: the model hook's own state. */
  modelState: 'idle' | 'loading' | 'loaded' | 'error' | (string & {});
  /** Source 3: the photo failed preparation or carries quality warnings. */
  photoFailedCheck: boolean;
  /** Source 4: a replacement photo is being picked. */
  replacing: boolean;
}

/** A photo whose preparation finished: `qualityAssessment` is set only then. */
export function isPhotoChecked(
  session: Pick<ScanSessionState, 'status' | 'qualityAssessment'>,
): boolean {
  return session.status !== 'preprocessing' && session.qualityAssessment !== null;
}

/**
 * The photo itself is unusable: the guard rejected it, the guard could not read
 * it, or its preparation failed. A picker or permission failure is not this.
 * The Scan tab and `deriveScanCheckState` both read this one derivation.
 */
export function isPhotoNotUsable(
  session: Pick<ScanSessionState, 'status' | 'guardFailure' | 'photoPreparationFailed'>,
): boolean {
  return (
    session.status === 'error' &&
    (session.guardFailure === 'rejected' || session.photoPreparationFailed === true)
  );
}

export function deriveScanCheckState({
  session,
  modelState,
  photoFailedCheck,
  replacing,
}: ScanCheckInputs): ScanCheckState {
  if (!session.sourceUri) return 'no-photo';
  if (replacing) return 'checking-photo';
  if (session.status === 'error') {
    if (isPhotoNotUsable(session)) {
      // The guard judged the photo: it is not sugarcane. Distinct from a fault.
      if (session.guardFailure === 'rejected') return 'not-sugarcane';
      // The guard could not read the file (too large, transparent, unreadable).
      if (session.guardFailure === 'error') return 'photo-unusable';
      return 'check-failed';
    }
    if (photoFailedCheck && isPhotoChecked(session)) return 'photo-rejected';
    return 'model-failed';
  }
  if (session.status === 'completed' && session.result) {
    return photoFailedCheck ? 'result-doubtful' : 'result';
  }
  if (photoFailedCheck && isPhotoChecked(session)) return 'photo-rejected';
  if (modelState === 'error') return 'model-failed';
  if (session.status === 'running' && !session.guardPassed) return 'checking-sugarcane';
  if (session.status === 'running' || session.status === 'finalizing') return 'analysing';
  if (isPhotoChecked(session)) return 'waiting-model';
  return 'checking-photo';
}

/**
 * Where an error clears back to. A failed photo check (`check-failed`) or model
 * run (`model-failed`) both retry from the selected photo; a kept result stays.
 */
export function clearedStatus(session: ScanSessionState): ScanSessionState['status'] {
  if (!session.sourceUri) return 'idle';
  if (session.result) return 'completed';
  return 'image-selected';
}
