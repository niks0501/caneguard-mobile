import { diseaseCatalog } from '@/features/detection/constants/diseaseCatalog';
import {
  ACTIVE_MODEL,
  isModelLabel,
  type ModelContract,
} from '@/features/detection/constants/modelContract';
import {
  asInferenceError,
  InferenceError,
} from '@/features/detection/model/inferenceErrors';
import {
  postprocessOutput,
  type PostprocessedOutput,
} from '@/features/detection/model/postprocessOutput';
import type { ClassScore, DetectionResult } from '@/features/detection/types';

const FLOAT32_BYTES = Float32Array.BYTES_PER_ELEMENT;

export interface InferenceRunner {
  run(input: ArrayBuffer[]): Promise<ArrayBuffer[]>;
}

function now(): number {
  return globalThis.performance?.now() ?? Date.now();
}

export type ModelInferenceOutput = PostprocessedOutput & {
  rawOutput: number[];
  timings: DetectionResult['timings'];
};

/**
 * Model-layer inference for any model contract: returns every declared output
 * (V2: Healthy, Mosaic, Rust, Smut, RSSI) without scan-flow label assumptions.
 */
export async function runModelInference(
  model: InferenceRunner,
  inputBuffer: ArrayBuffer,
  preprocessMs: number,
  contract: ModelContract = ACTIVE_MODEL,
  clock: () => number = now,
): Promise<ModelInferenceOutput> {
  const expectedInputByteLength =
    contract.input.shape.reduce<number>((total, dimension) => total * dimension, 1) *
    FLOAT32_BYTES;

  if (inputBuffer.byteLength !== expectedInputByteLength) {
    throw new InferenceError(
      'INPUT_BUFFER_MISMATCH',
      `Expected ${expectedInputByteLength} input bytes, received ${inputBuffer.byteLength}.`,
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

  const mappedOutput = postprocessOutput(outputBuffers[0], contract);

  return {
    ...mappedOutput,
    rawOutput: Array.from(new Float32Array(outputBuffers[0])),
    timings: {
      preprocessMs,
      inferenceMs,
      totalMs: preprocessMs + inferenceMs,
    },
  };
}

/**
 * Scan-flow inference. Every declared output of the contract (V2's RSSI
 * included) is a scan result with its own score. `contract` pins diagnostic callers to
 * an explicit model; the scan flow itself keeps the active one.
 */
export async function runInference(
  model: InferenceRunner,
  inputBuffer: ArrayBuffer,
  preprocessMs: number,
  clock: () => number = now,
  onRawOutput?: (rawOutput: readonly number[]) => void,
  contract: ModelContract = ACTIVE_MODEL,
): Promise<DetectionResult> {
  const output = await runModelInference(
    model,
    inputBuffer,
    preprocessMs,
    contract,
    clock,
  );
  const scores: ClassScore[] = [];

  // A label the results layer does not know is a contract mismatch, never a
  // score to drop silently.
  for (const { label, score } of output.scores) {
    if (!isModelLabel(label)) {
      throw new InferenceError(
        'LABEL_MAPPING_FAILED',
        `Model ${contract.id.toUpperCase()} output "${label}" is not a supported result label.`,
      );
    }
    scores.push({ label, score });
  }
  if (scores.length === 0) {
    throw new InferenceError(
      'LABEL_MAPPING_FAILED',
      `Model ${contract.id.toUpperCase()} returned no class scores.`,
    );
  }

  const predictedLabel = scores[0].label;
  onRawOutput?.(output.rawOutput);

  return {
    predictedLabel,
    confidence: output.confidence,
    scores,
    timings: output.timings,
    modelVersion: contract.version,
    decisionSupportWording: diseaseCatalog[predictedLabel].decisionSupportWording,
  };
}
