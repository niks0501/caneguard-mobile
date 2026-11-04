import {
  canAuthorInspectorWork,
  canCompleteFieldValidation,
  canReadFieldValidationAssignments,
  normalizeCapabilities,
} from '../capabilities';

// Proposals (unpromoted). Each proves: authoring is gated on server capabilities, not role alone.
describe('canAuthorInspectorWork', () => {
  const base = { email: 'a@b.test', name: 'A', uuid: 'u1' };

  it('allows a field reporter holding report:submit', () => {
    expect(canAuthorInspectorWork({ ...base, role: 'field_reporter', capabilities: ['report:submit'] })).toBe(true);
  });

  it('denies a field reporter without pilot-district membership (empty capabilities)', () => {
    expect(canAuthorInspectorWork({ ...base, role: 'field_reporter', capabilities: [] })).toBe(false);
  });

  it('denies a legacy stored session with no capabilities field and a missing user', () => {
    expect(canAuthorInspectorWork({ ...base, role: 'field_reporter' })).toBe(false);
    expect(canAuthorInspectorWork(null)).toBe(false);
  });

  it('denies a farmer even if capabilities were somehow present', () => {
    expect(canAuthorInspectorWork({ ...base, role: 'farmer', capabilities: ['report:submit'] })).toBe(false);
  });
});

describe('canCompleteFieldValidation', () => {
  const base = { email: 'a@b.test', name: 'A', uuid: 'u1' };

  it('allows a field reporter holding assignment:complete', () => {
    expect(canCompleteFieldValidation({ ...base, role: 'field_reporter', capabilities: ['assignment:complete'] })).toBe(true);
  });

  it('denies report authoring ability that does not include assignment:complete', () => {
    expect(canCompleteFieldValidation({ ...base, role: 'field_reporter', capabilities: ['report:submit'] })).toBe(false);
  });

  it('denies a missing profile or a non-inspector role', () => {
    expect(canCompleteFieldValidation(null)).toBe(false);
    expect(canCompleteFieldValidation({ ...base, role: 'farmer', capabilities: ['assignment:complete'] })).toBe(false);
  });
});

describe('canReadFieldValidationAssignments', () => {
  const base = { email: 'a@b.test', name: 'A', uuid: 'u1' };

  it('allows a read-only inspector holding assignment:read without assignment:complete', () => {
    expect(canReadFieldValidationAssignments({ ...base, role: 'field_reporter', capabilities: ['assignment:read'] })).toBe(true);
  });

  it('requires the explicit read grant and an inspector role', () => {
    expect(canReadFieldValidationAssignments({ ...base, role: 'field_reporter', capabilities: ['report:submit', 'assignment:complete'] })).toBe(false);
    expect(canReadFieldValidationAssignments({ ...base, role: 'farmer', capabilities: ['assignment:read'] })).toBe(false);
  });
});

describe('normalizeCapabilities', () => {
  it('keeps a fully well-formed capability list', () => {
    expect(normalizeCapabilities(['report:submit', 'assignment:read'])).toEqual(['report:submit', 'assignment:read']);
  });

  it('grants nothing from a malformed or non-array capability list', () => {
    expect(normalizeCapabilities(['report:submit', 7])).toEqual([]);
    expect(normalizeCapabilities(['report:submit', null])).toEqual([]);
    expect(normalizeCapabilities([''])).toEqual([]);
    expect(normalizeCapabilities('report:submit')).toEqual([]);
    expect(normalizeCapabilities(undefined)).toEqual([]);
  });
});
