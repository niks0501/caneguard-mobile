import { exclusiveRun } from '@/features/detection/model/exclusiveRun';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('exclusiveRun', () => {
  // Proves: native calls never overlap; the second starts only after the first settles.
  it('serialises overlapping calls', async () => {
    const first = deferred<ArrayBuffer[]>();
    const run = jest.fn().mockReturnValueOnce(first.promise).mockResolvedValue([new ArrayBuffer(4)]);
    const wrapped = exclusiveRun(run);
    const a = wrapped([new ArrayBuffer(1)]);
    const b = wrapped([new ArrayBuffer(2)]);
    await Promise.resolve();
    await new Promise((r) => setTimeout(r, 20));
    expect(run).toHaveBeenCalledTimes(1);
    first.resolve([new ArrayBuffer(4)]);
    await Promise.all([a, b]);
    expect(run).toHaveBeenCalledTimes(2);
  });

  // Proves: outputs are copied inside the exclusive section, so a reused native buffer cannot leak into another scan.
  it('copies output buffers', async () => {
    const shared = Float32Array.of(0.9).buffer as ArrayBuffer;
    const wrapped = exclusiveRun(async () => [shared]);
    const [out] = await wrapped([]);
    new Float32Array(shared)[0] = 0.1;
    expect(new Float32Array(out)[0]).toBeCloseTo(0.9, 5);
  });

  // Proves: one failed call does not block later calls.
  it('keeps going after a failure', async () => {
    const run = jest.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValue([new ArrayBuffer(4)]);
    const wrapped = exclusiveRun(run);
    await expect(wrapped([])).rejects.toThrow('boom');
    await expect(wrapped([])).resolves.toHaveLength(1);
  });
});
