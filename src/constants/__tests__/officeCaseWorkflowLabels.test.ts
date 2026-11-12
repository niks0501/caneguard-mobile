import { OFFICE_CASE_WORKFLOW_LABELS } from '@/constants/copy';

describe('OFFICE_CASE_WORKFLOW_LABELS', () => {
  // Proposal, proves MF-1: the six server workflow values show the web plain words, values and order unchanged.
  it('maps the six workflow_status values to the web chip words in order', () => {
    expect(Object.entries(OFFICE_CASE_WORKFLOW_LABELS)).toEqual([
      ['needs_review', 'Waiting for your decision'],
      ['under_review', 'Being reviewed'],
      ['field_validation', 'Field visit assigned'],
      ['referred', 'Referred to expert'],
      ['follow_up', 'Follow-up planned'],
      ['resolved', 'Resolved'],
    ]);
  });
});
