export interface RefreshAllTarget {
  /** Subsystem label used to report a partial failure. */
  key: string;
  /**
   * Resolve a RefreshOutcome to distinguish a refresh that did not run
   * ('skipped') from one that failed. Legacy results still work: false means
   * failed; true or undefined means ok.
   */
  run: () => Promise<unknown>;
}

/** 'skipped' means the refresh had nothing to do (precondition unmet or superseded); it is not a failure. */
export type RefreshOutcome = 'ok' | 'skipped' | 'failed';

export interface RefreshAllResult {
  failed: string[];
  skipped: string[];
  succeeded: string[];
}

function toRefreshOutcome(value: unknown): RefreshOutcome {
  if (value === 'skipped') return 'skipped';
  if (value === false || value === 'failed') return 'failed';
  return 'ok';
}

/**
 * Run every eligible subsystem refresh once, independently.
 *
 * One rejected subsystem must not cancel the others or discard their cached
 * content, so this settles every target and reports which ones failed instead of
 * throwing the first rejection.
 */
export async function runRefreshAll(
  targets: RefreshAllTarget[],
): Promise<RefreshAllResult> {
  const settled = await Promise.allSettled(
    targets.map(async (target) => ({
      key: target.key,
      outcome: toRefreshOutcome(await target.run()),
    })),
  );

  const result: RefreshAllResult = { failed: [], skipped: [], succeeded: [] };
  settled.forEach((settledTarget, index) => {
    const key = targets[index]?.key ?? 'unknown';
    const outcome =
      settledTarget.status === 'fulfilled' ? settledTarget.value.outcome : 'failed';
    if (outcome === 'ok') result.succeeded.push(key);
    else if (outcome === 'skipped') result.skipped.push(key);
    else result.failed.push(key);
  });
  return result;
}

export const REFRESH_ALL_TARGET_LABELS: Record<string, string> = {
  assignments: 'field assignments',
  notifications: 'office updates',
  officeReview: 'office review status',
  records: 'saved reports and scans',
  sync: 'report uploads',
};

export function describeRefreshAllResult(
  result: RefreshAllResult | null,
): string | null {
  if (!result) return null;
  if (result.failed.length === 0) {
    // A skipped refresh did not run, so it must not read as "up to date" on its own.
    return result.succeeded.length > 0 ? 'Everything is up to date.' : null;
  }
  const failedLabels = result.failed
    .map((key) => REFRESH_ALL_TARGET_LABELS[key] ?? key)
    .join(', ');
  return `Couldn't refresh ${failedLabels}. Saved content is still available.`;
}
