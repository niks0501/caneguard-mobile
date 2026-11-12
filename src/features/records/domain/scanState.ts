import { isBelowConfidenceCautionThreshold } from '@/features/detection/constants/confidenceCaution';

/**
 * Farmer-facing state of a saved scan. It is always computed from the saved
 * checks and never stored.
 */
export type FarmerScanState = 'needs_checking' | 'followed_up' | 'saved';

export const FARMER_SCAN_STATES: readonly FarmerScanState[] = [
  'needs_checking',
  'followed_up',
  'saved',
];

/** The slice of a saved scan the state needs, including its Check Again link. */
export interface ScanThreadRow {
  confidence: number;
  createdAt: string;
  modelVersion: string;
  followsUpScanId: string | null;
  id: string;
  predictedLabel: string;
}

/** Which plant a saved check belongs to: its first check, and how many checks it has. */
export interface FarmerScanThread {
  checkCount: number;
  originalId: string;
}

/**
 * Groups every check by plant. A first check and its Check Again follow-ups
 * share one thread, so My Scans can show one card per plant.
 */
export function buildFarmerScanThreads(
  rows: readonly ScanThreadRow[],
): Map<string, FarmerScanThread> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const originalId = row.followsUpScanId ?? row.id;
    counts.set(originalId, (counts.get(originalId) ?? 0) + 1);
  }
  const threads = new Map<string, FarmerScanThread>();
  for (const row of rows) {
    const originalId = row.followsUpScanId ?? row.id;
    threads.set(row.id, { checkCount: counts.get(originalId) ?? 1, originalId });
  }
  return threads;
}

/**
 * Computes the state of every scan from all of an owner's checks. A first check
 * and its Check Again follow-ups share one state:
 * - Needs checking: the latest check is uncertain, or it is a possible disease
 *   that has not been checked again.
 * - Followed up: checked again at least once.
 * - Saved: everything else.
 */
export function buildFarmerScanStates(
  rows: readonly ScanThreadRow[],
): Map<string, FarmerScanState> {
  const threads = new Map<string, ScanThreadRow[]>();
  for (const row of rows) {
    const originalId = row.followsUpScanId ?? row.id;
    const thread = threads.get(originalId);
    if (thread) thread.push(row);
    else threads.set(originalId, [row]);
  }

  const states = new Map<string, FarmerScanState>();
  for (const [originalId, thread] of threads) {
    const latest = thread.reduce((newest, row) =>
      row.createdAt > newest.createdAt ||
      (row.createdAt === newest.createdAt && row.id > newest.id)
        ? row
        : newest,
    );
    const hasFollowUp = thread.some((row) => row.followsUpScanId != null);
    let state: FarmerScanState;
    if (isBelowConfidenceCautionThreshold(latest.confidence, latest.modelVersion)) {
      state = 'needs_checking';
    } else if (hasFollowUp) {
      state = 'followed_up';
    } else if (latest.predictedLabel !== 'healthy') {
      state = 'needs_checking';
    } else {
      state = 'saved';
    }
    for (const row of thread) states.set(row.id, state);
    states.set(originalId, state);
  }
  return states;
}
