import { SYNC_RETRY_COOLDOWN_MS } from '@/features/sync/domain/outboxState';

/** The longest an automatic retry waits on its own growth; a server Retry-After may exceed it. */
export const MAX_AUTO_RETRY_BACKOFF_MS = 10 * 60_000;
/** A Retry-After longer than this is treated as this long, so a bad header cannot park sync for good. */
export const MAX_RETRY_AFTER_MS = 60 * 60_000;

/**
 * Pure: how long the automatic retry timer waits after the Nth consecutive
 * transient failure (0 = first). The wait doubles from the per-record cooldown,
 * is jittered into its upper half so many phones do not retry together, never
 * falls below the cooldown (records inside it are not candidates), and never
 * undercuts a server Retry-After.
 */
export function nextAutoRetryDelayMs(
  consecutiveFailures: number,
  retryAfterMs: number | null,
  random: () => number = Math.random,
): number {
  const attempt = Math.min(Math.max(Math.trunc(consecutiveFailures), 0), 10);
  const ceiling = Math.min(SYNC_RETRY_COOLDOWN_MS * 2 ** attempt, MAX_AUTO_RETRY_BACKOFF_MS);
  const jittered = Math.floor(ceiling / 2 + random() * (ceiling / 2));
  // Retry predicates exclude records exactly at the cutoff, hence the +1.
  const delay = Math.max(jittered, SYNC_RETRY_COOLDOWN_MS + 1);
  if (retryAfterMs === null || !Number.isFinite(retryAfterMs) || retryAfterMs <= 0) {
    return delay;
  }
  return Math.max(delay, Math.min(Math.ceil(retryAfterMs), MAX_RETRY_AFTER_MS) + 1);
}
