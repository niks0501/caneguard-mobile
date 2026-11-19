import { GUARD_V1 } from '@/features/detection/constants/guardContract';
import { GUARD_COPY } from '@/constants/copy';

export type GuardErrorCode =
  | 'GUARD_ARTIFACT_MISMATCH'
  | 'GUARD_MODEL_LOAD_FAILED'
  | 'GUARD_CONTRACT_MISMATCH'
  | 'GUARD_UNSUPPORTED_PLATFORM'
  | 'GUARD_NOT_READY'
  | 'GUARD_INPUT_INVALID'
  | 'GUARD_RUN_FAILED'
  | 'GUARD_OUTPUT_INVALID';

/** A guard fault: the photo was NOT judged. Always fails closed; never a rejection. */
export class GuardError extends Error {
  readonly code: GuardErrorCode;
  readonly originalCause?: unknown;

  constructor(code: GuardErrorCode, message: string, originalCause?: unknown) {
    super(message);
    this.name = 'GuardError';
    this.code = code;
    this.originalCause = originalCause;
  }
}

/** Realm-safe: native and test runtimes can hand back buffers from another realm. */
function isArrayBuffer(value: unknown): value is ArrayBuffer {
  return Object.prototype.toString.call(value) === '[object ArrayBuffer]';
}

export interface GuardRunner {
  run(input: ArrayBuffer[]): Promise<ArrayBuffer[]>;
}

export interface GuardAssessment {
  accepted: boolean;
}

/**
 * Applies the contract decision rule to one sigmoid value. Anything that is not
 * a finite probability in [0, 1] is a model fault, not a rejection.
 */
export function decideGuard(pSugarcane: unknown): GuardAssessment {
  if (typeof pSugarcane !== 'number' || !Number.isFinite(pSugarcane)) {
    throw new GuardError('GUARD_OUTPUT_INVALID', 'The guard output is not a finite number.');
  }
  if (pSugarcane < 0 || pSugarcane > 1) {
    throw new GuardError(
      'GUARD_OUTPUT_INVALID',
      `The guard output ${pSugarcane} is outside the sigmoid range 0..1.`,
    );
  }
  return { accepted: pSugarcane >= GUARD_V1.acceptThreshold };
}

/** Reads the single [1,1] float32 output tensor; any other layout fails closed. */
export function readGuardOutput(outputs: unknown): number {
  if (!Array.isArray(outputs) || outputs.length !== 1) {
    throw new GuardError(
      'GUARD_OUTPUT_INVALID',
      `Expected one guard output tensor, received ${Array.isArray(outputs) ? outputs.length : 'none'}.`,
    );
  }
  const buffer: unknown = outputs[0];
  const expectedBytes = GUARD_V1.output.shape.reduce<number>((a, b) => a * b, 1) * 4;
  if (!isArrayBuffer(buffer) || buffer.byteLength !== expectedBytes) {
    throw new GuardError(
      'GUARD_OUTPUT_INVALID',
      `The guard output must be ${expectedBytes} bytes (shape [1,1] float32).`,
    );
  }
  return new Float32Array(buffer)[0];
}

/**
 * Runs Guard V1 once on a prepared tensor and returns the verdict. The tensor
 * must be exactly the 602112-byte direct-stretch RGB buffer; it is passed to the
 * runtime unchanged (the graph normalizes internally).
 */
export async function runGuard(
  runner: GuardRunner,
  inputBuffer: ArrayBuffer,
): Promise<GuardAssessment> {
  if (!isArrayBuffer(inputBuffer) || inputBuffer.byteLength !== GUARD_V1.inputByteLength) {
    throw new GuardError(
      'GUARD_INPUT_INVALID',
      `Expected ${GUARD_V1.inputByteLength} guard input bytes, received ${
        isArrayBuffer(inputBuffer) ? inputBuffer.byteLength : 'a non-buffer'
      }.`,
    );
  }
  let outputs: ArrayBuffer[];
  try {
    outputs = await runner.run([inputBuffer]);
  } catch (error) {
    if (error instanceof GuardError) throw error;
    throw new GuardError(
      'GUARD_RUN_FAILED',
      `Guard inference failed: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
  }
  return decideGuard(readGuardOutput(outputs));
}

export function asGuardError(error: unknown): GuardError {
  return error instanceof GuardError
    ? error
    : new GuardError(
        'GUARD_RUN_FAILED',
        `Guard step failed: ${error instanceof Error ? error.message : String(error)}`,
        error,
      );
}

/** Actionable copy for a guard fault (distinct from the not-sugarcane rejection). */
export function getGuardErrorMessage(error: unknown): string {
  switch (asGuardError(error).code) {
    case 'GUARD_ARTIFACT_MISMATCH':
    case 'GUARD_CONTRACT_MISMATCH':
    case 'GUARD_UNSUPPORTED_PLATFORM':
      return GUARD_COPY.unavailable;
    default:
      return GUARD_COPY.failed;
  }
}
