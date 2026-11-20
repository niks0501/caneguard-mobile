import {
  MAX_AUTO_RETRY_BACKOFF_MS,
  nextAutoRetryDelayMs,
} from '@/features/sync/domain/retryBackoff';
import { SYNC_RETRY_COOLDOWN_MS } from '@/features/sync/domain/outboxState';

const FIRST_FLOOR_MS = SYNC_RETRY_COOLDOWN_MS + 1;

describe('nextAutoRetryDelayMs', () => {
  it('never waits less than the per-record cooldown', () => {
    expect(nextAutoRetryDelayMs(0, null, () => 0)).toBe(FIRST_FLOOR_MS);
    expect(nextAutoRetryDelayMs(0, null, () => 0.999)).toBeGreaterThanOrEqual(FIRST_FLOOR_MS);
  });

  it('spreads distinct draws above the floor instead of landing on it', () => {
    const waits = [0, 0.5, 0.999].map((draw) => nextAutoRetryDelayMs(0, null, () => draw));
    expect(new Set(waits).size).toBe(3);
    waits.forEach((wait) => {
      expect(wait).toBeGreaterThanOrEqual(FIRST_FLOOR_MS);
      expect(wait).toBeLessThan(FIRST_FLOOR_MS * 1.5);
    });
  });

  it('doubles with consecutive failures', () => {
    expect(nextAutoRetryDelayMs(1, null, () => 0)).toBe(SYNC_RETRY_COOLDOWN_MS * 2);
    expect(nextAutoRetryDelayMs(2, null, () => 0)).toBe(SYNC_RETRY_COOLDOWN_MS * 4);
  });

  it('caps its own growth', () => {
    const longest = nextAutoRetryDelayMs(50, null, () => 0.999);
    expect(longest).toBeGreaterThanOrEqual(MAX_AUTO_RETRY_BACKOFF_MS / 2);
    expect(longest).toBeLessThan(MAX_AUTO_RETRY_BACKOFF_MS);
  });

  it('honours a longer Retry-After and ignores a shorter or invalid one', () => {
    expect(nextAutoRetryDelayMs(0, 5 * 60_000, () => 0)).toBe(5 * 60_000 + 1);
    expect(nextAutoRetryDelayMs(0, 1_000, () => 0)).toBe(FIRST_FLOOR_MS);
    expect(nextAutoRetryDelayMs(0, Number.NaN, () => 0)).toBe(FIRST_FLOOR_MS);
  });

  it('keeps a two-hour Retry-After as a lower bound', () => {
    const twoHoursMs = 2 * 60 * 60_000;
    expect(nextAutoRetryDelayMs(0, twoHoursMs, () => 0)).toBe(twoHoursMs + 1);
    expect(nextAutoRetryDelayMs(0, twoHoursMs, () => 0.5)).toBeGreaterThan(twoHoursMs);
  });

  it('spreads phones that share one Retry-After above that hint', () => {
    const fiveMinutesMs = 5 * 60_000;
    const waits = [0, 0.5, 0.999].map((draw) => nextAutoRetryDelayMs(0, fiveMinutesMs, () => draw));
    expect(new Set(waits).size).toBe(3);
    waits.forEach((wait) => expect(wait).toBeGreaterThanOrEqual(fiveMinutesMs + 1));
  });
});
