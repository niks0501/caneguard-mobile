import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

/**
 * One ordered download run for the three office feeds.
 *
 * Visits come first so an office update can be opened as soon as it appears;
 * office status and updates follow. Mount, focus, app resume and reconnect all
 * ask for the same run instead of each feed refreshing on its own. The feeds
 * keep their own checkpoints and resumable pages: a step only calls the feed's
 * existing refresh.
 */
export type DownloadStep = 'visits' | 'officeStatus' | 'updates';

export const DOWNLOAD_ORDER: readonly DownloadStep[] = [
  'visits',
  'officeStatus',
  'updates',
];

type StepRunner = () => Promise<unknown>;

const runners: Record<DownloadStep, Set<StepRunner>> = {
  visits: new Set(),
  officeStatus: new Set(),
  updates: new Set(),
};

let queue: Promise<void> = Promise.resolve();
let runRequested = false;
let runScheduled = false;
let unsubscribeNetwork: (() => void) | null = null;
let previousOnline: boolean | null = null;

function isNetworkOnline(state: NetInfoState): boolean {
  return state.isConnected === true && state.isInternetReachable !== false;
}

async function runSteps(steps: readonly DownloadStep[]): Promise<void> {
  for (const step of steps) {
    // Read the registrants when the step starts, so a feed that mounted after
    // the run was requested still takes part, in its fixed place.
    for (const runner of [...runners[step]]) {
      try {
        await runner();
      } catch {
        // A failed feed must not stop the feeds after it; each feed reports its own error.
      }
    }
  }
}

function enqueue(job: () => Promise<void>): Promise<void> {
  const next = queue.then(job, job);
  queue = next.catch(() => undefined);
  return next;
}

/**
 * Ask for the full run. Requests made before the run starts, and requests made
 * while it is running, collapse into at most one run that follows.
 */
export function requestDownloadRun(): void {
  runRequested = true;
  if (runScheduled) return;
  runScheduled = true;
  void enqueue(async () => {
    // Let every feed that mounted in the same commit register first.
    await Promise.resolve();
    runScheduled = false;
    if (!runRequested) return;
    runRequested = false;
    await runSteps(DOWNLOAD_ORDER);
  });
}

/** Fetch the visits step once, after any run already in progress. */
export function downloadVisitsOnce(): Promise<void> {
  return enqueue(() => runSteps(['visits']));
}

function ensureNetworkWatch(): void {
  if (unsubscribeNetwork) return;
  unsubscribeNetwork = NetInfo.addEventListener((state) => {
    const online = isNetworkOnline(state);
    const reconnected = previousOnline === false && online;
    previousOnline = online;
    if (reconnected) requestDownloadRun();
  });
}

function releaseNetworkWatchIfIdle(): void {
  if (DOWNLOAD_ORDER.some((step) => runners[step].size > 0)) return;
  unsubscribeNetwork?.();
  unsubscribeNetwork = null;
  previousOnline = null;
}

/** Register a feed's refresh for its step. Returns the unregister function. */
export function registerDownloadStep(
  step: DownloadStep,
  runner: StepRunner,
): () => void {
  runners[step].add(runner);
  ensureNetworkWatch();
  return () => {
    runners[step].delete(runner);
    releaseNetworkWatchIfIdle();
  };
}
