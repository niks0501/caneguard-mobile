import {
  getChecklistConsistency,
  getGuidedValidationQuestions,
  type ChecklistConsistency,
  type ChecklistObservationId,
} from '@/features/detection/checklist/checklistConsistency';
import type { ModelLabel } from '@/features/detection/constants/modelContract';

type MatrixCase = [
  ModelLabel,
  ChecklistConsistency,
  ChecklistObservationId[],
];

const MATRIX: MatrixCase[] = [
  ['healthy', 'consistent', ['none']],
  ['healthy', 'inconsistent', ['mosaic']],
  ['healthy', 'not-applicable', ['mosaic', 'rust']],
  ['healthy', 'not-enough-information', []],
  ['mosaic', 'consistent', ['mosaic']],
  ['mosaic', 'inconsistent', ['rust']],
  ['mosaic', 'not-applicable', ['mosaic', 'rust']],
  ['mosaic', 'not-enough-information', []],
  ['rust', 'consistent', ['rust']],
  ['rust', 'inconsistent', ['mosaic']],
  ['rust', 'not-applicable', ['mosaic', 'rust']],
  ['rust', 'not-enough-information', []],
];

describe('getChecklistConsistency', () => {
  it.each(['healthy', 'mosaic', 'rust'] as const)(
    'selects a short guided question set for the %s model context',
    (modelLabel) => {
      const questions = getGuidedValidationQuestions(modelLabel);

      expect(questions.length).toBeGreaterThan(0);
      expect(questions.length).toBeLessThanOrEqual(4);
      expect(questions[0].options.map(({ id }) => id)).toEqual([
        'mosaic',
        'rust',
        'yellow-midrib',
        'none',
        'something-else',
        'unable-to-tell',
      ]);
    },
  );
  it.each(MATRIX)(
    'returns %s / %s for observations %j',
    (predictedLabel, expected, observations) => {
      expect(getChecklistConsistency(predictedLabel, observations)).toBe(expected);
    },
  );

  it('treats unable-to-tell as insufficient even when another item is present', () => {
    expect(
      getChecklistConsistency('mosaic', ['unable-to-tell', 'mosaic']),
    ).toBe('not-enough-information');
  });

  it('marks unsupported reference patterns and Something else as visible disagreement', () => {
    expect(getChecklistConsistency('mosaic', ['yellow-midrib'])).toBe('inconsistent');
    expect(getChecklistConsistency('mosaic', ['something-else'])).toBe('inconsistent');
    expect(getChecklistConsistency('healthy', ['something-else'])).toBe('inconsistent');
  });

  it('does not mutate the supplied observations', () => {
    const observations: ChecklistObservationId[] = ['rust'];

    getChecklistConsistency('rust', observations);

    expect(observations).toEqual(['rust']);
  });
});
