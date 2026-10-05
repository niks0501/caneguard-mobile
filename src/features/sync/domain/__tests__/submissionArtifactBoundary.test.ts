import { isUploadableSubmissionArtifact, SUBMISSION_ARTIFACT_KINDS } from '@/features/sync/domain/submissionArtifacts';

describe('submission artifact boundary', () => {
  it('allows only finalized field reports and pending or failed field surveys', () => {
    expect(SUBMISSION_ARTIFACT_KINDS).toEqual(['field_report', 'field_survey']);
    expect(isUploadableSubmissionArtifact('field_report', { authoringState: 'finalized', syncStatus: 'pending' })).toBe(true);
    expect(isUploadableSubmissionArtifact('field_report', { authoringState: 'finalized', syncStatus: 'failed' })).toBe(true);
    expect(isUploadableSubmissionArtifact('field_report', { authoringState: 'draft', syncStatus: 'pending' })).toBe(false);
    expect(isUploadableSubmissionArtifact('field_report', { authoringState: 'finalized', syncStatus: 'synced' })).toBe(false);
    expect(isUploadableSubmissionArtifact('field_survey', { status: 'pending' })).toBe(true);
    expect(isUploadableSubmissionArtifact('field_survey', { status: 'failed' })).toBe(true);
    expect(isUploadableSubmissionArtifact('field_survey', { status: 'draft' })).toBe(false);
    expect(isUploadableSubmissionArtifact('field_survey', { status: 'synced' })).toBe(false);
  });

  it.each(['draft', 'local_only', 'pending', 'syncing', 'synced', 'failed'])(
    'never treats a personal scan in %s state as uploadable',
    (state) => {
      expect(isUploadableSubmissionArtifact('scan_record', { syncStatus: state })).toBe(false);
    },
  );
});
