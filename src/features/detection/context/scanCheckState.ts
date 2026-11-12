import type { ScanSessionState } from '@/features/detection/types';

/**
 * The one named answer to "where is the photo check?". Agents, tests and the
 * screen read this instead of guessing from copy and four separate flags.
 */
export type ScanCheckState =
  | 'no-photo'
  | 'checking-photo'
  | 'photo-rejected'
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
    'sourceUri' | 'status' | 'result' | 'qualityAssessment' | 'photoPreparationFailed'
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

export function deriveScanCheckState({
  session,
  modelState,
  photoFailedCheck,
  replacing,
}: ScanCheckInputs): ScanCheckState {
  if (!session.sourceUri) return 'no-photo';
  if (replacing) return 'checking-photo';
  if (session.status === 'error') {
    return session.photoPreparationFailed ? 'check-failed' : 'model-failed';
  }
  if (session.status === 'completed' && session.result) {
    return photoFailedCheck ? 'result-doubtful' : 'result';
  }
  if (modelState === 'error') return 'model-failed';
  if (photoFailedCheck && isPhotoChecked(session)) return 'photo-rejected';
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
