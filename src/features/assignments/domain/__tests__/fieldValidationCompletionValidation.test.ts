import { isUuid } from '@/features/assignments/domain/fieldValidationCompletionValidation';

describe('field validation completion identity validation', () => {
  it.each([
    '3fbd7f77-7d6b-4eb0-a1c7-b673f5a2f39f',
    '01a04de2-280e-7140-bf56-3c98f98259d5',
  ])('accepts an RFC UUID used by the Mobile or API lifecycle: %s', (value) => {
    expect(isUuid(value)).toBe(true);
  });

  it.each([
    '01a04de2-280e-0140-bf56-3c98f98259d5',
    '01a04de2-280e-7140-7f56-3c98f98259d5',
    'not-a-uuid',
  ])('rejects an invalid UUID identity: %s', (value) => {
    expect(isUuid(value)).toBe(false);
  });
});
