import { boundaryRetriesItself, boundaryState } from '@/features/surveys/domain/boundaryState';

export const SUBMISSION_ARTIFACT_KINDS = ['field_report', 'field_survey'] as const;

export type SubmissionArtifactKind = (typeof SUBMISSION_ARTIFACT_KINDS)[number];

export function isUploadableSubmissionArtifact(
  kind: SubmissionArtifactKind | 'scan_record',
  state: {
    authoringState?: string;
    syncStatus?: string;
    status?: string;
    lastSyncErrorCode?: string | null;
  },
): boolean {
  if (kind === 'field_report') {
    return state.authoringState === 'finalized' &&
      (state.syncStatus === 'pending' || state.syncStatus === 'failed');
  }
  if (kind === 'field_survey') {
    // Same definition as the sync query: waiting rows and rows that retry on their own.
    return (
      (state.status === 'pending' || state.status === 'failed') &&
      boundaryRetriesItself(
        boundaryState({
          status: state.status,
          lastSyncErrorCode: state.lastSyncErrorCode ?? null,
          remoteId: null,
        }),
      )
    );
  }
  return false;
}
