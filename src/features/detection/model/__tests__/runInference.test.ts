import { MODEL_INPUT } from '@/features/detection/constants/modelContract';
import { InferenceError } from '@/features/detection/model/inferenceErrors';
import {
  runInference,
  type InferenceRunner,
} from '@/features/detection/model/runInference';
import type { DetectionResult } from '@/features/detection/types';

const INPUT_BYTE_LENGTH =
  MODEL_INPUT.shape.reduce<number>(
    (total, dimension) => total * dimension,
    1,
  ) *
  Float32Array.BYTES_PER_ELEMENT;

function float32Buffer(values: readonly number[]): ArrayBuffer {
  return Float32Array.from(values).buffer as ArrayBuffer;
}

function createRunner(output = float32Buffer([0.1, 0.2, 0.7])) {
  return {
    run: jest.fn().mockResolvedValue([output]),
  } satisfies InferenceRunner;
}

describe('runInference', () => {
  it('runs one input tensor and returns a timed DetectionResult', async () => {
    const runner = createRunner();
    const input = new ArrayBuffer(INPUT_BYTE_LENGTH);
    const clock = jest.fn().mockReturnValueOnce(10).mockReturnValueOnce(35);

    await expect(runInference(runner, input, 40, clock)).resolves.toEqual({
      predictedLabel: 'rust',
      confidence: expect.closeTo(0.7),
      scores: [
        { label: 'rust', score: expect.closeTo(0.7) },
        { label: 'mosaic', score: expect.closeTo(0.2) },
        { label: 'healthy', score: expect.closeTo(0.1) },
      ],
      timings: {
        preprocessMs: 40,
        inferenceMs: 25,
        totalMs: 65,
      },
      modelVersion: 'v0.1-baseline',
    });
    expect(runner.run).toHaveBeenCalledWith([input]);
  });

  it('blocks a mismatched input before calling the native model', async () => {
    const runner = createRunner();

    await expect(runInference(runner, new ArrayBuffer(4), 1)).rejects.toEqual(
      expect.objectContaining({ code: 'INPUT_BUFFER_MISMATCH' }),
    );
    expect(runner.run).not.toHaveBeenCalled();
  });

  it('preserves a typed not-ready error from the model controller', async () => {
    const runner: InferenceRunner = {
      run: jest.fn().mockRejectedValue(
        new InferenceError('MODEL_NOT_READY', 'still loading'),
      ),
    };

    await expect(
      runInference(runner, new ArrayBuffer(INPUT_BYTE_LENGTH), 1),
    ).rejects.toEqual(expect.objectContaining({ code: 'MODEL_NOT_READY' }));
  });

  it('wraps a native execution failure', async () => {
    const runner: InferenceRunner = {
      run: jest.fn().mockRejectedValue(new Error('native failure')),
    };

    await expect(
      runInference(runner, new ArrayBuffer(INPUT_BYTE_LENGTH), 1),
    ).rejects.toEqual(expect.objectContaining({ code: 'MODEL_RUN_FAILED' }));
  });

  it.each([
    ['missing output', [], 'OUTPUT_TENSOR_MISSING'],
    [
      'unexpected output count',
      [float32Buffer([0.1, 0.2, 0.7]), float32Buffer([1])],
      'OUTPUT_SIZE_MISMATCH',
    ],
  ])('rejects %s', async (_caseName, outputs, code) => {
    const runner: InferenceRunner = {
      run: jest.fn().mockResolvedValue(outputs),
    };

    await expect(
      runInference(runner, new ArrayBuffer(INPUT_BYTE_LENGTH), 1),
    ).rejects.toEqual(expect.objectContaining({ code }));
  });

  it('returns stable results over ten consecutive runs', async () => {
    const runner = createRunner(float32Buffer([0.05, 0.15, 0.8]));
    const results: DetectionResult[] = [];

    for (let index = 0; index < 10; index += 1) {
      results.push(
        await runInference(
          runner,
          new ArrayBuffer(INPUT_BYTE_LENGTH),
          1,
          () => 1,
        ),
      );
    }

    expect(runner.run).toHaveBeenCalledTimes(10);
    expect(
      results.every(
        (result) =>
          result.predictedLabel === 'rust' &&
          Math.abs(result.confidence - results[0].confidence) < Number.EPSILON,
      ),
    ).toBe(true);
  });
});
