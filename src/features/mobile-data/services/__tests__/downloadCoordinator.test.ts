import NetInfo from '@react-native-community/netinfo';

import {
  downloadVisitsOnce,
  registerDownloadStep,
  requestDownloadRun,
} from '@/features/mobile-data/services/downloadCoordinator';

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn(), fetch: jest.fn() },
}));

type Listener = (state: { isConnected: boolean; isInternetReachable: boolean | null }) => void;

const flush = async () => {
  for (let i = 0; i < 10; i += 1) await Promise.resolve();
};

describe('downloadCoordinator', () => {
  let listener: Listener;
  let calls: string[];
  let cleanups: (() => void)[];

  beforeEach(() => {
    calls = [];
    cleanups = [];
    jest.mocked(NetInfo.addEventListener).mockImplementation(((next: Listener) => {
      listener = next;
      return jest.fn();
    }) as never);
    const step = (name: 'visits' | 'officeStatus' | 'updates') =>
      cleanups.push(
        registerDownloadStep(name, async () => {
          calls.push(name);
        }),
      );
    // Registered out of order on purpose: the run order is fixed, not registration order.
    step('updates');
    step('officeStatus');
    step('visits');
  });

  afterEach(() => cleanups.forEach((cleanup) => cleanup()));

  // Intent: one ordered run - visits, then office status, then updates.
  it('runs visits, then office status, then updates', async () => {
    requestDownloadRun();
    await flush();
    expect(calls).toEqual(['visits', 'officeStatus', 'updates']);
  });

  // Intent: requests made together (mount, focus, resume) collapse into one run.
  it('collapses simultaneous requests into one run', async () => {
    requestDownloadRun();
    requestDownloadRun();
    requestDownloadRun();
    await flush();
    expect(calls).toEqual(['visits', 'officeStatus', 'updates']);
  });

  // Intent: reconnect starts the same run, but only after the phone was actually offline.
  it('starts the run when the phone reconnects, not on the first online report', async () => {
    listener({ isConnected: true, isInternetReachable: true });
    await flush();
    expect(calls).toEqual([]);

    listener({ isConnected: false, isInternetReachable: false });
    listener({ isConnected: true, isInternetReachable: true });
    await flush();
    expect(calls).toEqual(['visits', 'officeStatus', 'updates']);
  });

  // Intent: a failed visits step does not stop the later steps.
  it('keeps going when one feed fails', async () => {
    cleanups.push(
      registerDownloadStep('visits', async () => {
        throw new Error('offline');
      }),
    );
    requestDownloadRun();
    await flush();
    expect(calls).toEqual(['visits', 'officeStatus', 'updates']);
  });

  // Intent: an update for an unknown case can fetch visits alone, once.
  it('downloads only visits on demand', async () => {
    await downloadVisitsOnce();
    expect(calls).toEqual(['visits']);
  });
});
