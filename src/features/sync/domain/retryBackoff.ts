import { SYNC_RETRY_COOLDOWN_MS } from '@/features/sync/domain/outboxState';

/** The longest an automatic retry waits on its own growth; a server Retry-After may exceed it. */
export const MAX_AUTO_RETRY_BACKOFF_MS = 10 * 60_000;

/**
 * Pure: how long the automatic retry timer waits after the Nth consecutive
 * transient failure (0 = first). The wait doubles from the per-record cooldown,
 * never falls below the cooldown (records inside it are not candidates) or a
 * server Retry-After, and is spread over the half-interval above that floor so
 * many phones do not retry together.
 */
export function nextAutoRetryDelayMs(
  consecutiveFailures: number,
  retryAfterMs: number | null,
  random: () => number = Math.random,
): number {
  const attempt = Math.min(Math.max(Math.trunc(consecutiveFailures), 0), 10);
  // Retry predicates exclude records exactly at the cutoff, hence the +1.
  const cooldownFloor = SYNC_RETRY_COOLDOWN_MS + 1;
  const backoff = Math.min(
    Math.max(SYNC_RETRY_COOLDOWN_MS * 2 ** attempt, cooldownFloor),
    MAX_AUTO_RETRY_BACKOFF_MS / 2,
  );
  const serverFloor =
    retryAfterMs === null || !Number.isFinite(retryAfterMs) || retryAfterMs <= 0
      ? 0
      : Math.ceil(retryAfterMs) + 1;
  const lowerBound = Math.max(backoff, serverFloor);
  return lowerBound + Math.floor((random() * lowerBound) / 2);
}
