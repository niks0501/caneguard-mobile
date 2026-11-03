import {
  buildFarmerScanStates,
  type ScanThreadRow,
} from '@/features/records/domain/scanState';

// Proposal tests. Intent: "States are computed, not stored: Needs checking
// (latest result uncertain, or a possible disease with no check yet), Followed
// up (at least one Check Again), Saved (everything else)."

const row = (overrides: Partial<ScanThreadRow> & { id: string }): ScanThreadRow => ({
  confidence: 0.9,
  createdAt: '2026-11-01T00:00:00.000Z',
  followsUpScanId: null,
  predictedLabel: 'healthy',
  ...overrides,
});

describe('buildFarmerScanStates', () => {
  // Proves: "Saved (everything else)" for a confident healthy scan.
  it('marks a confident healthy scan as saved', () => {
    expect(buildFarmerScanStates([row({ id: 'a' })]).get('a')).toBe('saved');
  });

  // Proves: "a possible disease with no check yet" is Needs checking.
  it('marks a confident possible disease with no Check Again as needing checking', () => {
    expect(
      buildFarmerScanStates([row({ id: 'a', predictedLabel: 'rust' })]).get('a'),
    ).toBe('needs_checking');
  });

  // Proves: "latest result uncertain" is Needs checking.
  it('marks an uncertain scan as needing checking even when healthy', () => {
    expect(buildFarmerScanStates([row({ id: 'a', confidence: 0.3 })]).get('a')).toBe(
      'needs_checking',
    );
  });

  // Proves: "Followed up (at least one Check Again)" using the P1-1 link, for both ends of the thread.
  it('marks the first check and its follow-up as followed up', () => {
    const states = buildFarmerScanStates([
      row({ id: 'a', predictedLabel: 'rust' }),
      row({
        id: 'b',
        predictedLabel: 'rust',
        followsUpScanId: 'a',
        createdAt: '2026-11-02T00:00:00.000Z',
      }),
    ]);
    expect(states.get('a')).toBe('followed_up');
    expect(states.get('b')).toBe('followed_up');
  });

  // Proves: "latest result uncertain" decides over an earlier Check Again.
  it('returns to needing checking when the latest follow-up is uncertain', () => {
    const states = buildFarmerScanStates([
      row({ id: 'a', predictedLabel: 'rust' }),
      row({
        id: 'b',
        confidence: 0.2,
        followsUpScanId: 'a',
        createdAt: '2026-11-02T00:00:00.000Z',
      }),
    ]);
    expect(states.get('a')).toBe('needs_checking');
  });

  // Proves: only the latest result counts, so an earlier uncertain check followed by a confident one is Followed up.
  it('ignores an earlier uncertain check once a later check is confident', () => {
    const states = buildFarmerScanStates([
      row({ id: 'a', confidence: 0.2 }),
      row({
        id: 'b',
        followsUpScanId: 'a',
        createdAt: '2026-11-02T00:00:00.000Z',
      }),
    ]);
    expect(states.get('a')).toBe('followed_up');
  });
});
