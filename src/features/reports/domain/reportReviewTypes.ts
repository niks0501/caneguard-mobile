export const AUTHORITY_REVIEW_STATUSES = [
  'submitted_unverified',
  'for_field_validation',
  'verified_by_staff',
  'unable_to_verify',
  'resolved',
] as const;

export type KnownAuthorityReviewStatus =
  (typeof AUTHORITY_REVIEW_STATUSES)[number];

/** The six server `workflow_status` words, in the order the office shows them. */
export const WORKFLOW_STATUSES = [
  'needs_review',
  'under_review',
  'field_validation',
  'referred',
  'follow_up',
  'resolved',
] as const;

export type KnownWorkflowStatus = (typeof WORKFLOW_STATUSES)[number];

/** One chip vocabulary shared with the web; the visit card and the report status both read it. */
export const WORKFLOW_STATUS_LABELS: Readonly<Record<KnownWorkflowStatus, string>> = {
  needs_review: 'Waiting for your decision',
  under_review: 'Being reviewed',
  field_validation: 'Field visit assigned',
  referred: 'Referred to expert',
  follow_up: 'Follow-up planned',
  resolved: 'Resolved',
};

export type AuthorityReviewStatusKind =
  | KnownAuthorityReviewStatus
  | KnownWorkflowStatus
  | 'unknown';

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

export interface MobileReportAdvisory {
  code: string;
  content: string;
  selectedAt: string;
  status: 'validated' | 'retired';
  title: string;
  uuid: string;
}

export interface AuthorityReviewStatusUpdate {
  /** v3 office advisory; null when none has been selected. */
  advisory?: MobileReportAdvisory | null;
  clientUuid: string;
  feedback: string | null;
  referenceCode: string | null;
  reviewedAt: string | null;
  remoteUuid: string;
  rawStatus: string;
  statusUpdatedAt: string;
  /** v3 office workflow word; null when the feed row does not carry one. */
  workflowStatus?: string | null;
}

const AUTHORITY_REVIEW_LABELS: Record<
  KnownAuthorityReviewStatus,
  string
> = {
  submitted_unverified: 'Awaiting authority review',
  for_field_validation: 'Visit needed',
  verified_by_staff: 'Verified by staff',
  unable_to_verify: 'Unable to verify',
  resolved: 'Resolved',
};

/** Words the phone does not know are named, never projected onto a known status. */
export function humanizeStatusWord(value: string): string {
  const text = value.replace(/_/g, ' ').trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : value;
}

export function isKnownWorkflowStatus(value: string): value is KnownWorkflowStatus {
  return (WORKFLOW_STATUSES as readonly string[]).includes(value);
}

/**
 * The office workflow word wins; the legacy five-value review status is read
 * only when the feed row carries no workflow word.
 */
export function getAuthorityReviewPresentation(
  rawStatus: string,
  workflowStatus?: string | null,
): {
  kind: AuthorityReviewStatusKind;
  label: string;
} {
  const workflow = workflowStatus?.trim();
  if (workflow) {
    return isKnownWorkflowStatus(workflow)
      ? { kind: workflow, label: WORKFLOW_STATUS_LABELS[workflow] }
      : { kind: 'unknown', label: humanizeStatusWord(workflow) };
  }
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
    | 'workflowStatus'
  >,
  fetchedAt: string | null,
): AuthorityReviewSnapshot {
  const presentation = getAuthorityReviewPresentation(
    update.rawStatus,
    update.workflowStatus,
  );
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
