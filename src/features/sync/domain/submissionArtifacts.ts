export const SUBMISSION_ARTIFACT_KINDS = ['field_report', 'field_survey'] as const;

export type SubmissionArtifactKind = (typeof SUBMISSION_ARTIFACT_KINDS)[number];

export function isUploadableSubmissionArtifact(
  kind: SubmissionArtifactKind | 'scan_record',
  state: { authoringState?: string; syncStatus?: string; status?: string },
): boolean {
  if (kind === 'field_report') {
    return state.authoringState === 'finalized' &&
      (state.syncStatus === 'pending' || state.syncStatus === 'failed');
  }
  if (kind === 'field_survey') {
    return state.status === 'pending' || state.status === 'failed';
  }
  return false;
}
