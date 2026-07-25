import {
  MODEL_INPUT,
  MODEL_VERSION,
} from '@/features/detection/constants/modelContract';
import {
  asInferenceError,
  InferenceError,
} from '@/features/detection/model/inferenceErrors';
import { postprocessOutput } from '@/features/detection/model/postprocessOutput';
import type { DetectionResult } from '@/features/detection/types';

const FLOAT32_BYTES = Float32Array.BYTES_PER_ELEMENT;
const EXPECTED_INPUT_BYTE_LENGTH =
  MODEL_INPUT.shape.reduce<number>(
    (total, dimension) => total * dimension,
    1,
  ) *
  FLOAT32_BYTES;

export interface InferenceRunner {
  run(input: ArrayBuffer[]): Promise<ArrayBuffer[]>;
}

function now(): number {
  return globalThis.performance?.now() ?? Date.now();
}

export async function runInference(
  model: InferenceRunner,
  inputBuffer: ArrayBuffer,
  preprocessMs: number,
  clock: () => number = now,
): Promise<DetectionResult> {
  if (inputBuffer.byteLength !== EXPECTED_INPUT_BYTE_LENGTH) {
    throw new InferenceError(
      'INPUT_BUFFER_MISMATCH',
      `Expected ${EXPECTED_INPUT_BYTE_LENGTH} input bytes, received ${inputBuffer.byteLength}.`,
    );
  }

  const inferenceStartedAt = clock();
  let outputBuffers: ArrayBuffer[];

  try {
    outputBuffers = await model.run([inputBuffer]);
  } catch (error) {
    throw asInferenceError(error);
  }

  const inferenceMs = clock() - inferenceStartedAt;

  if (!Array.isArray(outputBuffers) || outputBuffers.length === 0) {
    throw new InferenceError(
      'OUTPUT_TENSOR_MISSING',
      'TensorFlow Lite did not return the expected output tensor.',
    );
  }

  if (outputBuffers.length !== 1) {
    throw new InferenceError(
      'OUTPUT_SIZE_MISMATCH',
      `Expected one output tensor, received ${outputBuffers.length}.`,
    );
  }

  const mappedOutput = postprocessOutput(outputBuffers[0]);

  return {
    ...mappedOutput,
    timings: {
      preprocessMs,
      inferenceMs,
      totalMs: preprocessMs + inferenceMs,
    },
    modelVersion: MODEL_VERSION,
  };
}
