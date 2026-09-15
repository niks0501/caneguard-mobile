export interface RefreshAllTarget {
  /** Subsystem label used to report a partial failure. */
  key: string;
  /** Resolve true/undefined for success; resolve false when the subsystem kept cached data after a failure. */
  run: () => Promise<unknown>;
}

export interface RefreshAllResult {
  failed: string[];
  succeeded: string[];
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
      ok: (await target.run()) !== false,
    })),
  );

  const result: RefreshAllResult = { failed: [], succeeded: [] };
  settled.forEach((outcome, index) => {
    const key = targets[index]?.key ?? 'unknown';
    if (outcome.status === 'fulfilled' && outcome.value.ok) {
      result.succeeded.push(key);
    } else {
      result.failed.push(
        outcome.status === 'fulfilled' ? outcome.value.key : key,
      );
    }
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
    return result.succeeded.length > 0 ? 'Everything is up to date.' : null;
  }
  const failedLabels = result.failed
    .map((key) => REFRESH_ALL_TARGET_LABELS[key] ?? key)
    .join(', ');
  return `Couldn't refresh ${failedLabels}. Saved content is still available.`;
}
