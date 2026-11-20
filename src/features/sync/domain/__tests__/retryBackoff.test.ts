import {
  MAX_AUTO_RETRY_BACKOFF_MS,
  MAX_RETRY_AFTER_MS,
  nextAutoRetryDelayMs,
} from '@/features/sync/domain/retryBackoff';
import { SYNC_RETRY_COOLDOWN_MS } from '@/features/sync/domain/outboxState';

describe('nextAutoRetryDelayMs', () => {
  it('never waits less than the per-record cooldown', () => {
    expect(nextAutoRetryDelayMs(0, null, () => 0)).toBe(SYNC_RETRY_COOLDOWN_MS + 1);
    expect(nextAutoRetryDelayMs(0, null, () => 1)).toBe(SYNC_RETRY_COOLDOWN_MS + 1);
  });

  it('grows with consecutive failures, jittered in the upper half', () => {
    expect(nextAutoRetryDelayMs(2, null, () => 0)).toBe(SYNC_RETRY_COOLDOWN_MS * 2);
    expect(nextAutoRetryDelayMs(2, null, () => 0.999)).toBeLessThan(SYNC_RETRY_COOLDOWN_MS * 4);
    expect(nextAutoRetryDelayMs(2, null, () => 0.999)).toBeGreaterThan(SYNC_RETRY_COOLDOWN_MS * 3);
  });

  it('caps its own growth', () => {
    expect(nextAutoRetryDelayMs(50, null, () => 1)).toBeLessThanOrEqual(MAX_AUTO_RETRY_BACKOFF_MS);
  });

  it('honours a longer Retry-After and ignores a shorter or invalid one', () => {
    expect(nextAutoRetryDelayMs(0, 5 * 60_000, () => 0)).toBe(5 * 60_000 + 1);
    expect(nextAutoRetryDelayMs(0, 1_000, () => 0)).toBe(SYNC_RETRY_COOLDOWN_MS + 1);
    expect(nextAutoRetryDelayMs(0, Number.NaN, () => 0)).toBe(SYNC_RETRY_COOLDOWN_MS + 1);
  });

  it('bounds an absurd Retry-After', () => {
    expect(nextAutoRetryDelayMs(0, 10 * 24 * 3_600_000, () => 0)).toBe(MAX_RETRY_AFTER_MS + 1);
  });
});
