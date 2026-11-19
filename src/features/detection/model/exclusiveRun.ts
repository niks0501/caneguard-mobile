type Run = (input: ArrayBuffer[]) => Promise<ArrayBuffer[]>;

let tail: Promise<unknown> = Promise.resolve();

/**
 * The native TFLite runtime writes inputs into interpreter-owned tensors and reuses
 * its output buffers, so two overlapping calls can mix scans. Every guard and V2 call
 * goes through this one queue: a call starts only after the previous one settled, and
 * its outputs are copied before the next call can run. A call abandoned by a stale
 * photo still finishes first; its result is simply dropped by the caller.
 */
export function exclusiveRun(run: Run): Run {
  return (input) => {
    const next = tail
      .then(() => run(input))
      .then((outputs) => (Array.isArray(outputs) ? outputs.map((buffer) => buffer.slice(0)) : outputs));
    tail = next.catch(() => undefined);
    return next;
  };
}
