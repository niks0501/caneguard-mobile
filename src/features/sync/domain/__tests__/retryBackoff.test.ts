import { nextAutoRetryDelayMs } from '@/features/sync/domain/retryBackoff';
import { SYNC_RETRY_COOLDOWN_MS } from '@/features/sync/domain/outboxState';

const FIRST_FLOOR_MS = SYNC_RETRY_COOLDOWN_MS + 1;
const DRAWS = [0, 0.5, 0.999];

describe('nextAutoRetryDelayMs', () => {
  it('never waits less than the per-record cooldown', () => {
    for (const draw of DRAWS) {
      expect(nextAutoRetryDelayMs(null, () => draw)).toBeGreaterThanOrEqual(FIRST_FLOOR_MS);
    }
  });

  it('spreads distinct draws so phones do not retry together', () => {
    const waits = DRAWS.map((draw) => nextAutoRetryDelayMs(null, () => draw));
    expect(new Set(waits).size).toBe(DRAWS.length);
  });

  it('never waits less than a server Retry-After, including a two-hour one', () => {
    for (const hintMs of [5 * 60_000, 2 * 60 * 60_000]) {
      for (const draw of DRAWS) {
        expect(nextAutoRetryDelayMs(hintMs, () => draw)).toBeGreaterThanOrEqual(hintMs);
      }
    }
  });

  it('spreads phones that share one Retry-After above that hint', () => {
    const fiveMinutesMs = 5 * 60_000;
    const waits = DRAWS.map((draw) => nextAutoRetryDelayMs(fiveMinutesMs, () => draw));
    expect(new Set(waits).size).toBe(DRAWS.length);
  });

  it('ignores a shorter or invalid Retry-After', () => {
    for (const hint of [1_000, Number.NaN]) {
      expect(nextAutoRetryDelayMs(hint, () => 0)).toBe(FIRST_FLOOR_MS);
    }
  });
});
