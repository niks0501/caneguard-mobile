import { derivePageCount } from '@/features/sync/data/syncCheckpointRepository';

/**
 * The stamps one feed page reports. Every field is optional on the wire: a
 * server that predates versioning sends none of them and the feed falls back to
 * its legacy timestamp download.
 */
export interface SyncEnvelope {
  version: string | null;
  total: number | null;
  truncated: boolean;
  unchanged: boolean;
}

/** What a download of one feed measured, in the shape the checkpoint persists. */
export interface SyncFeedSummary {
  /** The server's opaque feed stamp; null from servers that do not version the feed. */
  version: string | null;
  /**
   * Rows the feed holds, or the wire records this answer delivered when the server
   * does not say; an unchanged answer that omits it measured no rows of its own.
   */
  total: number;
  /** True when the server cut the feed to the requested cap. */
  truncated: boolean;
  /** True when the server confirmed the sent `since` version and returned no rows. */
  unchanged: boolean;
}

/** Names the envelope field that failed validation so each feed reports it in its own error type. */
export class SyncEnvelopeFieldError extends Error {
  readonly field: string;

  constructor(field: string) {
    super(`The sync envelope field ${field} is invalid.`);
    this.name = 'SyncEnvelopeFieldError';
    this.field = field;
  }
}

export function parseSyncEnvelope(sync: Record<string, unknown> | null): SyncEnvelope {
  const version = sync?.version;
  const total = sync?.total;
  if (version !== undefined && (typeof version !== 'string' || !version.trim())) {
    throw new SyncEnvelopeFieldError('version');
  }
  if (
    total !== undefined &&
    (typeof total !== 'number' || !Number.isInteger(total) || total < 0)
  ) {
    throw new SyncEnvelopeFieldError('total');
  }
  const truncated = sync?.truncated;
  const unchanged = sync?.unchanged;
  if (truncated !== undefined && typeof truncated !== 'boolean') {
    throw new SyncEnvelopeFieldError('truncated');
  }
  if (unchanged !== undefined && typeof unchanged !== 'boolean') {
    throw new SyncEnvelopeFieldError('unchanged');
  }
  return {
    version: version ?? null,
    total: total ?? null,
    truncated: truncated ?? false,
    unchanged: unchanged ?? false,
  };
}

/** Rows a download delivers: the whole feed, or the cap when the server cut it short. */
export function envelopeExpectedRows(
  sync: SyncEnvelope,
  cap = Number.POSITIVE_INFINITY,
): number {
  const total = sync.total ?? 0;
  return sync.truncated ? Math.min(total, cap) : total;
}

/**
 * Pages the download may request: the reported total replaces the caller's
 * fixed ceiling, so the phone never guesses how long a feed is.
 */
export function envelopePageLimit(
  sync: SyncEnvelope,
  pageSize: number,
  ceiling: number,
  cap = Number.POSITIVE_INFINITY,
): number {
  if (sync.total === null) return ceiling;
  return Math.max(1, derivePageCount(envelopeExpectedRows(sync, cap), pageSize));
}
