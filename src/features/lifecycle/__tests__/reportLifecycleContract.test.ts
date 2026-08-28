import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { FIELD_VALIDATION_ASSIGNMENT_STATES } from '@/database/schema';
import {
  AUTHORITY_REVIEW_STATUSES,
  getAuthorityReviewPresentation,
} from '@/features/reports/domain/reportReviewTypes';

interface LifecycleContract {
  contract: string;
  version: number;
  dimensions: Record<string, { values: string[] }>;
  legacy_projection: Record<string, Record<string, string>>;
  rules: Record<string, unknown>;
  payload_contracts: string[];
}

const contract = JSON.parse(
  readFileSync(join(process.cwd(), 'references/report-lifecycle-v1.json'), 'utf8'),
) as LifecycleContract;

describe('report-lifecycle-v1 producer contract', () => {
  it('keeps mobile projections aligned without making AI or field work authoritative', () => {
    expect(contract.contract).toBe('report-lifecycle-v1');
    expect(contract.version).toBe(1);
    expect(contract.dimensions.case_state.values).toEqual(['open', 'closed']);
    expect(contract.dimensions.verification_outcome.values).toEqual([
      'not_determined',
      'verified',
      'unable_to_verify',
    ]);
    expect(contract.dimensions.field_validation_state.values).toEqual([
      ...FIELD_VALIDATION_ASSIGNMENT_STATES,
    ]);
    expect(contract.dimensions.referral_state.values).toEqual([
      'not_referred',
      'referred',
      'expert_response_received',
    ]);
    expect(AUTHORITY_REVIEW_STATUSES).toEqual([
      'submitted_unverified',
      'for_field_validation',
      'verified_by_staff',
      'unable_to_verify',
      'resolved',
    ]);
    expect(getAuthorityReviewPresentation('verified_by_staff')).toEqual({
      kind: 'verified_by_staff',
      label: 'Verified by staff',
    });
    expect(getAuthorityReviewPresentation('unknown_future_status')).toEqual({
      kind: 'unknown',
      label: 'Status update unavailable',
    });
    expect(contract.legacy_projection.for_field_validation).toMatchObject({
      case_state: 'open',
      verification_outcome: 'not_determined',
    });
    expect(contract.legacy_projection.verified_by_staff).toMatchObject({
      case_state: 'closed',
      verification_outcome: 'verified',
    });
    expect(contract.legacy_projection.resolved).toMatchObject({
      case_state: 'closed',
      verification_outcome: 'not_determined',
    });
    expect(contract.rules.field_validation_completion_does_not_verify_or_close).toBe(true);
    expect(contract.rules.referral_is_not_verification_outcome).toBe(true);
    expect(contract.rules.completed_validation_cannot_be_reassigned_or_removed).toBe(true);
    expect(contract.rules.ai_evidence_role).toBe('decision_support_only');
    expect(contract.payload_contracts).toContain('mobile-notifications-v1');
  });
});
