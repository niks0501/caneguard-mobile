import { GUARD_V1 } from '@/features/detection/constants/guardContract';
import {
  decideGuard,
  GuardError,
  readGuardOutput,
  runGuard,
  type GuardRunner,
} from '@/features/detection/model/guardInference';

const input = () => new ArrayBuffer(GUARD_V1.inputByteLength);
const out = (...values: number[]) => [Float32Array.from(values).buffer as ArrayBuffer];
const runnerReturning = (outputs: unknown): GuardRunner & { run: jest.Mock } => ({
  run: jest.fn().mockResolvedValue(outputs),
});

describe('runGuard decision edges', () => {
  // Proves: accept at p >= 0.75 (0.75 and 1 accept), reject below (0 and 0.749999 reject).
  it.each([
    [0.75, true],
    [1, true],
    [0.9, true],
    [0, false],
    [0.749999, false],
    [0.5, false],
  ])('p_sugarcane %p -> accepted %p', async (p, accepted) => {
    const runner = runnerReturning(out(p));
    const result = await runGuard(runner, input());
    expect(result.accepted).toBe(accepted);
    expect(runner.run).toHaveBeenCalledTimes(1);
  });

  // Proves: the tensor reaches the runtime unchanged (no outside normalization or copy edits).
  it('passes the exact input buffer through to the runtime', async () => {
    const buffer = input();
    new Float32Array(buffer).fill(200);
    const runner = runnerReturning(out(0.9));
    await runGuard(runner, buffer);
    expect(runner.run.mock.calls[0][0][0]).toBe(buffer);
    expect(new Float32Array(runner.run.mock.calls[0][0][0])[0]).toBe(200);
  });
});

describe('runGuard fails closed', () => {
  // Proves: NaN, infinities and out-of-range outputs are model faults, not accept or reject.
  it.each([
    ['NaN', NaN],
    ['+Infinity', Infinity],
    ['-Infinity', -Infinity],
    ['above 1', 1.0001],
    ['below 0', -0.0001],
  ])('throws GUARD_OUTPUT_INVALID for %s', async (_name, value) => {
    await expect(runGuard(runnerReturning(out(value)), input())).rejects.toMatchObject({
      code: 'GUARD_OUTPUT_INVALID',
    });
  });

  // Proves: wrong output shape or count fails closed.
  it.each([
    ['empty', []],
    ['two tensors', [...out(0.9), ...out(0.9)]],
    ['two values', out(0.9, 0.1)],
    ['zero-length', [new ArrayBuffer(0)]],
    ['not an array', undefined],
    ['not a buffer', [new Float32Array([0.9])]],
  ])('throws GUARD_OUTPUT_INVALID for %s', async (_name, outputs) => {
    await expect(runGuard(runnerReturning(outputs), input())).rejects.toMatchObject({
      code: 'GUARD_OUTPUT_INVALID',
    });
  });

  // Proves: a runtime error is a GuardError (fault), never an accepted or rejected photo.
  it('wraps runtime errors as GUARD_RUN_FAILED', async () => {
    const runner: GuardRunner = { run: jest.fn().mockRejectedValue(new Error('delegate crashed')) };
    await expect(runGuard(runner, input())).rejects.toMatchObject({ code: 'GUARD_RUN_FAILED' });
  });

  // Proves: only the 602112-byte tensor is ever sent to the guard.
  it('refuses a wrong-size input and never calls the runtime', async () => {
    const runner = runnerReturning(out(0.9));
    await expect(runGuard(runner, new ArrayBuffer(601_088))).rejects.toMatchObject({
      code: 'GUARD_INPUT_INVALID',
    });
    expect(runner.run).not.toHaveBeenCalled();
  });

  // Proves: decideGuard rejects non-numbers rather than coercing them.
  it('treats non-numeric scores as invalid', () => {
    expect(() => decideGuard('0.9')).toThrow(GuardError);
    expect(() => decideGuard(undefined)).toThrow(GuardError);
    expect(() => readGuardOutput(null)).toThrow(GuardError);
  });
});
