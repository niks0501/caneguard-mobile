import { canAuthorInspectorWork, canCompleteFieldValidation } from '../capabilities';

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
