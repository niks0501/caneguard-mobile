import { diseaseCatalog } from '@/features/detection/constants/diseaseCatalog';
import {
  ACTIVE_MODEL,
  MODEL_LABELS,
  type ModelContract,
  type ModelLabel,
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

function isScanLabel(label: string): label is ModelLabel {
  return (MODEL_LABELS as readonly string[]).includes(label);
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
 * Scan-flow inference. The scan flow, records and sync carry four labels, so a
 * scan whose top class goes beyond them (V2's RSSI) is refused until the
 * display/storage follow-up supports it. `contract` pins diagnostic callers to
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

  // The scan flow, records and sync carry four labels. A model output beyond
  // them (V2's RSSI) is an error when it is the top class; otherwise it is
  // dropped from the scores without renormalizing the remaining ones.
  const topLabel = output.scores[0]?.label;
  if (topLabel === undefined || !isScanLabel(topLabel)) {
    throw new InferenceError(
      'LABEL_MAPPING_FAILED',
      `Model ${contract.id.toUpperCase()} output "${topLabel}" is not supported by the scan flow yet.`,
    );
  }

  for (const { label, score } of output.scores) {
    if (isScanLabel(label)) {
      scores.push({ label, score });
    }
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
