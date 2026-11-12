import NetInfo from '@react-native-community/netinfo';
import { AppState } from 'react-native';

import {
  checkAccountStep,
  ReconnectCoordinator,
  type NetPhase,
  type StepOutcome,
} from '@/features/net/reconnectCoordinator';

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn(() => () => undefined),
    fetch: jest.fn(async () => ({ isConnected: true, isInternetReachable: true })),
  },
}));

type NetListener = (state: { isConnected: boolean; isInternetReachable: boolean | null }) => void;

const ONLINE = { isConnected: true, isInternetReachable: true };
const OFFLINE = { isConnected: false, isInternetReachable: false };

async function flush() {
  for (let i = 0; i < 10; i += 1) await Promise.resolve();
}

describe('ReconnectCoordinator (NET-1)', () => {
  let netListener: NetListener;
  let appListener: (state: string) => void;
  let coordinator: ReconnectCoordinator;
  let phases: NetPhase[];

  beforeEach(() => {
    jest.mocked(NetInfo.addEventListener).mockImplementation(((listener: NetListener) => {
      netListener = listener;
      return () => undefined;
    }) as never);
    jest.mocked(NetInfo.fetch).mockResolvedValue(ONLINE as never);
    jest.spyOn(AppState, 'addEventListener').mockImplementation(((_event: string, listener: (state: string) => void) => {
      appListener = listener;
      return { remove: jest.fn() };
    }) as never);
    coordinator = new ReconnectCoordinator();
    phases = [coordinator.phase];
    coordinator.subscribe((snapshot) => {
      if (phases[phases.length - 1] !== snapshot.phase) phases.push(snapshot.phase);
    });
  });

  afterEach(() => {
    coordinator.reset();
    jest.restoreAllMocks();
  });

  // Proves: "one fixed, testable order" with the net.phase marker readable by a test.
  it('walks Offline -> Back online -> Check account -> Send saved -> Download -> Up to date', async () => {
    const order: string[] = [];
    coordinator.registerCheckAccount(async () => { order.push('check'); return 'ok'; });
    coordinator.registerSendSaved(async (source) => { order.push(`send:${source}`); });
    coordinator.registerDownload(() => { order.push('download'); });
    coordinator.acquire();

    netListener(OFFLINE);
    expect(coordinator.phase).toBe('offline');
    netListener(ONLINE);
    await flush();

    expect(order).toEqual(['check', 'send:network-restored', 'download']);
    expect(phases).toEqual([
      'unknown', 'offline', 'back-online', 'check-account', 'send-saved', 'download', 'up-to-date',
    ]);
    expect(coordinator.phase).toBe('up-to-date');
  });

  // Proves: the named exit "Sign in again" stops the order before anything is sent.
  it('exits at Sign in again without sending or downloading', async () => {
    const send = jest.fn(async () => undefined);
    const download = jest.fn();
    coordinator.registerCheckAccount(async () => 'sign-in-again');
    coordinator.registerSendSaved(send);
    coordinator.registerDownload(download);
    coordinator.acquire();

    netListener(ONLINE);
    await flush();

    expect(coordinator.phase).toBe('sign-in-again');
    expect(send).not.toHaveBeenCalled();
    expect(download).not.toHaveBeenCalled();
  });

  // Proves: the named exit "Office unreachable"; saved work is still attempted, download is skipped.
  it('exits at Office unreachable after Send saved when the office is not answering', async () => {
    const send = jest.fn(async () => undefined);
    const download = jest.fn();
    coordinator.registerCheckAccount(async () => 'office-unreachable');
    coordinator.registerSendSaved(send);
    coordinator.registerDownload(download);
    coordinator.acquire();

    netListener(ONLINE);
    await flush();

    expect(send).toHaveBeenCalledTimes(1);
    expect(download).not.toHaveBeenCalled();
    expect(coordinator.phase).toBe('office-unreachable');
  });

  // Proves: an upload result can end the order at either named exit.
  it.each<[StepOutcome, NetPhase]>([
    ['sign-in-again', 'sign-in-again'],
    ['office-unreachable', 'office-unreachable'],
  ])('ends at %s when Send saved reports it', async (outcome, expected) => {
    const download = jest.fn();
    coordinator.registerSendSaved(async () => outcome);
    coordinator.registerDownload(download);
    coordinator.acquire();

    netListener(ONLINE);
    await flush();

    expect(coordinator.phase).toBe(expected);
    expect(download).not.toHaveBeenCalled();
  });

  // Proves: the 60 s retry timer and verification-effect resume paths run through the coordinator.
  it('retry-timer runs Check account (override) then Send saved', async () => {
    const order: string[] = [];
    coordinator.registerSendSaved(async (source) => { order.push(`send:${source}`); });
    coordinator.acquire();
    netListener(ONLINE);
    await flush();
    order.length = 0;

    await coordinator.run('retry-timer', { check: async () => { order.push('check'); return 'recovered'; } });

    expect(order).toEqual(['check', 'send:retry-timer']);
    expect(coordinator.phase).toBe('up-to-date');
  });

  it('a verification resume skips Check account and sends as retry-timer', async () => {
    const check = jest.fn(async (): Promise<StepOutcome> => 'ok');
    const send = jest.fn(async () => undefined);
    coordinator.registerCheckAccount(check);
    coordinator.registerSendSaved(send);
    coordinator.acquire();
    netListener(ONLINE);
    await flush();
    check.mockClear();
    send.mockClear();

    await coordinator.run('retry-timer', { startAt: 'send-saved' });

    expect(check).not.toHaveBeenCalled();
    expect(send).toHaveBeenCalledWith('retry-timer');
  });

  // Proves: going offline mid-run publishes Offline and later steps do not paint over it.
  it('does not let an in-flight run overwrite Offline', async () => {
    let finishSend: () => void = () => undefined;
    coordinator.registerSendSaved(() => new Promise<void>((resolve) => { finishSend = resolve; }));
    const download = jest.fn();
    coordinator.registerDownload(download);
    coordinator.acquire();
    netListener(ONLINE);
    await flush();
    expect(coordinator.phase).toBe('send-saved');

    netListener(OFFLINE);
    finishSend();
    await flush();

    expect(coordinator.phase).toBe('offline');
    expect(download).not.toHaveBeenCalled();
  });

  // Proves: foreground resume re-reads the network and walks the same order.
  it('resume re-checks the network, then runs the order', async () => {
    const send = jest.fn(async () => undefined);
    coordinator.registerSendSaved(send);
    coordinator.acquire();
    netListener(ONLINE);
    await flush();
    send.mockClear();

    appListener('active');
    await flush();

    expect(send).toHaveBeenCalledWith('resume');
    expect(coordinator.phase).toBe('up-to-date');
  });

  // Proves: apiReachability stays out of the coordinator; isOnline is the phone network only.
  it('tracks only phone-network online state', () => {
    coordinator.acquire();
    expect(coordinator.isOnline).toBeNull();
    netListener({ isConnected: true, isInternetReachable: false });
    expect(coordinator.isOnline).toBe(false);
    netListener(ONLINE);
    expect(coordinator.isOnline).toBe(true);
  });

  // Proves: settled callbacks (readiness) fire at every terminal phase, offline included.
  it('notifies settled callbacks offline and up to date', async () => {
    const settled = jest.fn();
    coordinator.onSettled(settled);
    coordinator.acquire();

    netListener(OFFLINE);
    expect(settled).toHaveBeenCalledTimes(1);
    netListener(ONLINE);
    await flush();
    expect(settled).toHaveBeenCalledTimes(2);
  });

  // Proves: one NetInfo and one AppState subscription are shared by every holder.
  it('shares one subscription across holders and tears down at zero', () => {
    const first = coordinator.acquire();
    const second = coordinator.acquire();
    expect(NetInfo.addEventListener).toHaveBeenCalledTimes(1);
    first();
    second();
    expect(coordinator.phase).toBe('unknown');
  });
});

describe('checkAccountStep', () => {
  // Proves: Check account maps /me results onto the named outcomes and never re-checks a verified account.
  it('maps verification results to outcomes', async () => {
    const retry = (status: 'verified' | 'idle' | 'unavailable') => jest.fn(async () => status);
    await expect(checkAccountStep('verified', retry('verified'))).resolves.toBe('ok');
    await expect(checkAccountStep('unavailable', retry('verified'))).resolves.toBe('recovered');
    await expect(checkAccountStep('unavailable', retry('idle'))).resolves.toBe('sign-in-again');
    await expect(checkAccountStep('unavailable', retry('unavailable'))).resolves.toBe('office-unreachable');
    const unused = retry('verified');
    await checkAccountStep('verified', unused);
    expect(unused).not.toHaveBeenCalled();
  });
});
