export const AUTHORITY_REVIEW_STATUSES = [
  'submitted_unverified',
  'for_field_validation',
  'verified_by_staff',
  'unable_to_verify',
  'resolved',
] as const;

export type KnownAuthorityReviewStatus =
  (typeof AUTHORITY_REVIEW_STATUSES)[number];

export type AuthorityReviewStatusKind = KnownAuthorityReviewStatus | 'unknown';

export interface AuthorityReviewFeedback {
  authorLabel: 'Authority staff';
  message: string;
  updatedAt: string;
}

export interface AuthorityReviewSnapshot {
  feedback: AuthorityReviewFeedback | null;
  fetchedAt: string | null;
  rawStatus: string;
  referenceCode: string | null;
  reviewedAt: string | null;
  statusKind: AuthorityReviewStatusKind;
  statusLabel: string;
  statusUpdatedAt: string;
}

export interface AuthorityReviewStatusUpdate {
  clientUuid: string;
  feedback: string | null;
  referenceCode: string | null;
  reviewedAt: string | null;
  remoteUuid: string;
  rawStatus: string;
  statusUpdatedAt: string;
}

const AUTHORITY_REVIEW_LABELS: Record<
  KnownAuthorityReviewStatus,
  string
> = {
  submitted_unverified: 'Awaiting authority review',
  for_field_validation: 'Field validation needed',
  verified_by_staff: 'Verified by staff',
  unable_to_verify: 'Unable to verify',
  resolved: 'Resolved',
};

export function getAuthorityReviewPresentation(rawStatus: string): {
  kind: AuthorityReviewStatusKind;
  label: string;
} {
  if (isKnownAuthorityReviewStatus(rawStatus)) {
    return {
      kind: rawStatus,
      label: AUTHORITY_REVIEW_LABELS[rawStatus],
    };
  }
  return { kind: 'unknown', label: 'Status update unavailable' };
}

export function toAuthorityReviewSnapshot(
  update: Pick<
    AuthorityReviewStatusUpdate,
    | 'feedback'
    | 'rawStatus'
    | 'referenceCode'
    | 'reviewedAt'
    | 'statusUpdatedAt'
  >,
  fetchedAt: string | null,
): AuthorityReviewSnapshot {
  const presentation = getAuthorityReviewPresentation(update.rawStatus);
  const feedbackMessage = update.feedback?.trim() ?? '';
  const feedbackUpdatedAt = update.reviewedAt ?? update.statusUpdatedAt;

  return {
    feedback: feedbackMessage
      ? {
          authorLabel: 'Authority staff',
          message: feedbackMessage,
          updatedAt: feedbackUpdatedAt,
        }
      : null,
    fetchedAt,
    rawStatus: update.rawStatus,
    referenceCode: update.referenceCode,
    reviewedAt: update.reviewedAt,
    statusKind: presentation.kind,
    statusLabel: presentation.label,
    statusUpdatedAt: update.statusUpdatedAt,
  };
}

export function isKnownAuthorityReviewStatus(
  value: string,
): value is KnownAuthorityReviewStatus {
  return (AUTHORITY_REVIEW_STATUSES as readonly string[]).includes(value);
}
