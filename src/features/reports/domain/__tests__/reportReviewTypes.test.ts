import {
  getAuthorityReviewPresentation,
  toAuthorityReviewSnapshot,
} from '@/features/reports/domain/reportReviewTypes';

describe('authority review presentation', () => {
  it.each([
    ['submitted_unverified', 'Awaiting authority review'],
    ['for_field_validation', 'Field validation needed'],
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
