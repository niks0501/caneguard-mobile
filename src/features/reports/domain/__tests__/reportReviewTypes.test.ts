import {
  getAuthorityReviewPresentation,
  toAuthorityReviewSnapshot,
} from '@/features/reports/domain/reportReviewTypes';

describe('authority review presentation', () => {
  it.each([
    ['submitted_unverified', 'Awaiting authority review'],
    ['for_field_validation', 'Visit needed'],
    ['verified_by_staff', 'Verified by staff'],
    ['unable_to_verify', 'Unable to verify'],
    ['resolved', 'Resolved'],
  ] as const)('maps %s to the accepted neutral label', (rawStatus, label) => {
    expect(getAuthorityReviewPresentation(rawStatus)).toEqual({
      kind: rawStatus,
      label,
    });
  });

  it('preserves unknown raw values and uses a safe fallback', () => {
    const snapshot = toAuthorityReviewSnapshot(
      {
        feedback: '  ',
        rawStatus: 'future_operational_state',
        referenceCode: null,
        reviewedAt: null,
        statusUpdatedAt: '2026-08-13T12:00:00.000Z',
      },
      '2026-08-13T12:01:00.000Z',
    );

    expect(snapshot).toMatchObject({
      rawStatus: 'future_operational_state',
      statusKind: 'unknown',
      statusLabel: 'Status update unavailable',
      feedback: null,
    });
  });
});

describe('workflow status presentation', () => {
  // Proposal, proves SEAM-3: a referred case shows the web word, not the legacy Awaiting authority review.
  it('shows the web chip word when the feed carries workflow_status', () => {
    expect(getAuthorityReviewPresentation('submitted_unverified', 'referred')).toEqual({
      kind: 'referred',
      label: 'Referred to expert',
    });
    expect(getAuthorityReviewPresentation('submitted_unverified', 'follow_up').label).toBe(
      'Follow-up planned',
    );
  });

  // Proposal, proves SEAM-3: legacy review_status is the fallback only when the new field is missing.
  it('falls back to the legacy review status when workflow_status is missing or blank', () => {
    expect(getAuthorityReviewPresentation('submitted_unverified').label).toBe(
      'Awaiting authority review',
    );
    expect(getAuthorityReviewPresentation('resolved', null).label).toBe('Resolved');
    expect(getAuthorityReviewPresentation('verified_by_staff', '  ').label).toBe('Verified by staff');
  });

  // Proposal, proves SEAM-3: an unknown workflow word is named, never projected onto submitted_unverified.
  it('names an unknown workflow word explicitly', () => {
    expect(getAuthorityReviewPresentation('submitted_unverified', 'escalated_to_board')).toEqual({
      kind: 'unknown',
      label: 'Escalated to board',
    });
  });
});
