import { nextAutoRetryDelayMs } from '@/features/sync/domain/retryBackoff';
import { SYNC_RETRY_COOLDOWN_MS } from '@/features/sync/domain/outboxState';

const FIRST_FLOOR_MS = SYNC_RETRY_COOLDOWN_MS + 1;
const DRAWS = [0, 0.5, 0.999];

describe('nextAutoRetryDelayMs', () => {
  it('never waits less than the per-record cooldown', () => {
    for (const draw of DRAWS) {
      expect(nextAutoRetryDelayMs(0, null, () => draw)).toBeGreaterThanOrEqual(FIRST_FLOOR_MS);
    }
  });

  it('never waits less than an earlier failure for the same draw', () => {
    for (const draw of DRAWS) {
      const waits = Array.from({ length: 25 }, (_, failures) => nextAutoRetryDelayMs(failures, null, () => draw));
      waits.slice(1).forEach((wait, index) => expect(wait).toBeGreaterThanOrEqual(waits[index]));
    }
  });

  it('spreads distinct draws so phones do not retry together', () => {
    for (const failures of [0, 25]) {
      const waits = DRAWS.map((draw) => nextAutoRetryDelayMs(failures, null, () => draw));
      expect(new Set(waits).size).toBe(DRAWS.length);
    }
  });

  it('never waits less than a server Retry-After, including a two-hour one', () => {
    for (const hintMs of [5 * 60_000, 2 * 60 * 60_000]) {
      for (const draw of DRAWS) {
        expect(nextAutoRetryDelayMs(0, hintMs, () => draw)).toBeGreaterThanOrEqual(hintMs);
      }
    }
  });

  it('ignores a shorter or invalid Retry-After', () => {
    for (const hint of [1_000, Number.NaN]) {
      const wait = nextAutoRetryDelayMs(0, hint, () => 0.5);
      expect(wait).toBeGreaterThanOrEqual(FIRST_FLOOR_MS);
      expect(wait).toBeLessThan(FIRST_FLOOR_MS * 1.5);
    }
  });
});
