import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import qaExpectedOutputs from '../../../../../qa/expected-v1-outputs.json';

import {
  MODEL_INPUT,
  MODEL_LABELS,
  MODEL_OUTPUT,
  MODEL_SHA256,
  MODEL_VERSION,
} from '@/features/detection/constants/modelContract';
import { postprocessOutput } from '@/features/detection/model/postprocessOutput';
import { runInference, type InferenceRunner } from '@/features/detection/model/runInference';
import {
  compareV1QaOutput,
  type V1QaFixtureId,
} from '@/features/detection/model/v1Qa';

const INPUT_BYTE_LENGTH =
  MODEL_INPUT.shape.reduce<number>((total, dimension) => total * dimension, 1) *
  Float32Array.BYTES_PER_ELEMENT;

function float32Buffer(values: readonly number[]): ArrayBuffer {
  return Float32Array.from(values).buffer as ArrayBuffer;
}

describe('Model V1 QA oracle', () => {
  it('checks packaged tensor shapes through the host Python fixture', () => {
    execFileSync(
      'python3',
      [join(process.cwd(), 'scripts/tests/test_tflite_model_shapes.py')],
      { cwd: process.cwd() },
    );
  });

  it('keeps the QA oracle bound to the packaged model, tensor shapes, and fixed labels', () => {
    expect(qaExpectedOutputs.model_sha256).toBe(MODEL_SHA256);
    expect(qaExpectedOutputs.class_order).toEqual([...MODEL_LABELS]);
    expect(qaExpectedOutputs.fixtures).toHaveLength(4);
    expect(qaExpectedOutputs.preprocessing_contract).toMatchObject({
      input_shape: [...MODEL_INPUT.shape],
      dtype: MODEL_INPUT.dataType,
      channel_order: MODEL_INPUT.colorOrder,
    });
    expect(MODEL_OUTPUT.shape).toEqual([1, MODEL_LABELS.length]);

    const modelPath = join(
      process.cwd(),
      'assets/models/caneguard_v1_mobilenetv2_float32.tflite',
    );
    expect(createHash('sha256').update(readFileSync(modelPath)).digest('hex')).toBe(
      MODEL_SHA256,
    );

    for (const fixture of qaExpectedOutputs.fixtures) {
      const fixturePath = join(
        process.cwd(),
        'dev-assets/model-fixtures',
        `v1-${fixture.fixture_id}.jpg`,
      );
      expect(createHash('sha256').update(readFileSync(fixturePath)).digest('hex')).toBe(
        fixture.source_sha256,
      );
    }
  });

  it.each(qaExpectedOutputs.fixtures)(
    'maps the $fixture_id four-class output through the Mobile pipeline',
    async (fixture) => {
      const probabilities = MODEL_LABELS.map(
        (label) => fixture.probabilities[label],
      );
      const runner: InferenceRunner = {
        run: jest.fn().mockResolvedValue([float32Buffer(probabilities)]),
      };

      const result = await runInference(
        runner,
        new ArrayBuffer(INPUT_BYTE_LENGTH),
        1,
      );
      const parity = compareV1QaOutput(
        fixture.fixture_id as V1QaFixtureId,
        probabilities,
      );

      expect(result.modelVersion).toBe(MODEL_VERSION);
      expect(result.predictedLabel).toBe(fixture.expected_top1_class);
      expect(result.scores).toHaveLength(4);
      expect(parity.top1Matches).toBe(true);
      expect(parity.scoreDeltas).toEqual(
        expect.arrayContaining(
          MODEL_LABELS.map((label) =>
            expect.objectContaining({
              label,
              expected: fixture.probabilities[label],
              actual: fixture.probabilities[label],
              absoluteDelta: 0,
            }),
          ),
        ),
      );

      expect(postprocessOutput(float32Buffer(probabilities)).predictedLabel).toBe(
        fixture.expected_top1_class,
      );
    },
  );
});
