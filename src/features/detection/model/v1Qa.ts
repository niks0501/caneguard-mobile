import qaExpectedOutputs from '../../../../qa/expected-v1-outputs.json';

import {
  MODEL_LABELS,
  MODEL_SHA256,
} from '@/features/detection/constants/modelContract';

export const V1_QA_FIXTURE_IDS = ['healthy', 'mosaic', 'rust', 'smut'] as const;
export type V1QaFixtureId = (typeof V1_QA_FIXTURE_IDS)[number];

export type V1QaExpectedOutput = {
  fixtureId: V1QaFixtureId;
  expectedTop1Class: V1QaFixtureId;
  probabilities: Record<V1QaFixtureId, number>;
};

const expectedOutputByFixture = Object.fromEntries(
  qaExpectedOutputs.fixtures.map((fixture) => [
    fixture.fixture_id,
    {
      fixtureId: fixture.fixture_id,
      expectedTop1Class: fixture.expected_top1_class,
      probabilities: fixture.probabilities,
    },
  ]),
) as Record<V1QaFixtureId, V1QaExpectedOutput>;

export const V1_QA_EXPECTED_OUTPUTS = expectedOutputByFixture;

export function getV1QaExpectedOutput(
  fixtureId: V1QaFixtureId,
): V1QaExpectedOutput {
  return V1_QA_EXPECTED_OUTPUTS[fixtureId];
}

export type V1QaScoreDelta = {
  label: V1QaFixtureId;
  expected: number;
  actual: number;
  absoluteDelta: number;
};

export function compareV1QaOutput(
  fixtureId: V1QaFixtureId,
  actualOutput: readonly number[],
): {
  expectedTop1Class: V1QaFixtureId;
  actualTop1Class: V1QaFixtureId | null;
  top1Matches: boolean;
  scoreDeltas: V1QaScoreDelta[];
} {
  const expected = getV1QaExpectedOutput(fixtureId);
  const actualTopIndex = actualOutput.length
    ? actualOutput.reduce(
        (bestIndex, value, index, values) =>
          value > values[bestIndex] ? index : bestIndex,
        0,
      )
    : -1;
  const actualTop1Class = MODEL_LABELS[actualTopIndex] ?? null;

  return {
    expectedTop1Class: expected.expectedTop1Class,
    actualTop1Class,
    top1Matches: actualTop1Class === expected.expectedTop1Class,
    scoreDeltas: MODEL_LABELS.map((label, index) => {
      const actual = actualOutput[index] ?? Number.NaN;
      const expectedScore = expected.probabilities[label];
      return {
        label,
        expected: expectedScore,
        actual,
        absoluteDelta: Math.abs(actual - expectedScore),
      };
    }),
  };
}

export const V1_QA_MODEL_SHA256 = qaExpectedOutputs.model_sha256;

if (V1_QA_MODEL_SHA256 !== MODEL_SHA256) {
  throw new Error('The V1 QA oracle does not match the bundled model identity.');
}
