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

  it('honours a server Retry-After as a lower bound for every draw', () => {
    const fiveMinutesMs = 5 * 60_000;
    for (const draw of DRAWS) {
      expect(nextAutoRetryDelayMs(0, fiveMinutesMs, () => draw)).toBeGreaterThan(fiveMinutesMs);
    }
    expect(new Set(DRAWS.map((draw) => nextAutoRetryDelayMs(0, fiveMinutesMs, () => draw))).size).toBe(DRAWS.length);
  });

  it('keeps a two-hour Retry-After as a lower bound', () => {
    const twoHoursMs = 2 * 60 * 60_000;
    for (const draw of DRAWS) {
      expect(nextAutoRetryDelayMs(0, twoHoursMs, () => draw)).toBeGreaterThan(twoHoursMs);
    }
  });

  it('ignores a shorter or invalid Retry-After', () => {
    const withoutHint = nextAutoRetryDelayMs(0, null, () => 0.5);
    expect(nextAutoRetryDelayMs(0, 1_000, () => 0.5)).toBe(withoutHint);
    expect(nextAutoRetryDelayMs(0, Number.NaN, () => 0.5)).toBe(withoutHint);
  });
});
