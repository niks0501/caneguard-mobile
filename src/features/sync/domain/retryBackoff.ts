import { SYNC_RETRY_COOLDOWN_MS } from '@/features/sync/domain/outboxState';

/**
 * Pure: how long the automatic retry timer waits. Never falls below the
 * per-record cooldown (records inside it are not candidates) or a server
 * Retry-After, and is spread over the half-interval above that floor so many
 * phones do not retry together.
 */
export function nextAutoRetryDelayMs(
  retryAfterMs: number | null,
  random: () => number = Math.random,
): number {
  // Retry predicates exclude records exactly at the cutoff, hence the +1.
  const cooldownFloor = SYNC_RETRY_COOLDOWN_MS + 1;
  const serverFloor =
    retryAfterMs === null || !Number.isFinite(retryAfterMs) || retryAfterMs <= 0
      ? 0
      : Math.min(Math.ceil(retryAfterMs) + 1, Number.MAX_SAFE_INTEGER);
  const lowerBound = Math.max(cooldownFloor, serverFloor);
  return lowerBound + Math.floor((random() * lowerBound) / 2);
}
