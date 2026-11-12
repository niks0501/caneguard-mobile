import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { AppState, type AppStateStatus } from 'react-native';

import type { SessionVerificationStatus } from '@/features/auth/types';

/**
 * NET-1: one fixed reconnect order and one marker to read it from.
 *
 *   Offline -> Back online -> Check account -> Send saved -> Download -> Up to date
 *
 * with two named exits: Sign in again (the office rejected the account) and
 * Office unreachable (the phone is online but the office is not answering).
 * `net.phase` is the only place that says where a reconnect is; an agent or a
 * test reads it instead of inferring it from six listeners' side effects.
 *
 * Out of scope on purpose: the three upload queues' own states (NET-2) and the
 * download internals (SEAM-2). The coordinator only calls into them.
 *
 * `apiReachability` in SyncProvider stays a separate signal derived from upload
 * results. The coordinator's `online` is the phone network only.
 */
export type NetPhase =
  | 'unknown'
  | 'offline'
  | 'back-online'
  | 'check-account'
  | 'send-saved'
  | 'download'
  | 'up-to-date'
  | 'sign-in-again'
  | 'office-unreachable';

export type ReconnectTrigger =
  | 'startup'
  | 'network-restored'
  | 'resume'
  | 'retry-timer';

export type StepOutcome =
  | 'ok'
  | 'recovered'
  | 'sign-in-again'
  | 'office-unreachable';

export interface NetSnapshot {
  appState: AppStateStatus;
  online: boolean | null;
  phase: NetPhase;
}

export interface RunOptions {
  /** One-run replacement for the registered Check account step. */
  check?: () => Promise<StepOutcome>;
  /** `send-saved` skips Check account (the account was just verified). */
  startAt?: 'check-account' | 'send-saved';
}

type SendSaved = (source: ReconnectTrigger) => Promise<StepOutcome | void>;

interface Queued {
  check?: () => Promise<StepOutcome>;
  startAt: 'check-account' | 'send-saved';
  trigger: ReconnectTrigger;
}

export function isNetworkOnline(state: NetInfoState): boolean {
  return state.isConnected === true && state.isInternetReachable !== false;
}

/**
 * Maps one account re-check onto a step outcome. `retry` only runs while the
 * account is still unverified, exactly as before the coordinator existed.
 */
export async function checkAccountStep(
  verification: SessionVerificationStatus,
  retry: (() => Promise<SessionVerificationStatus>) | undefined,
): Promise<StepOutcome> {
  if (verification !== 'unavailable' || !retry) {
    return 'ok';
  }
  const after = await retry();
  if (after === 'verified') return 'recovered';
  if (after === 'idle') return 'sign-in-again';
  if (after === 'unavailable') return 'office-unreachable';
  return 'ok';
}

export class ReconnectCoordinator {
  private appState: AppStateStatus = 'active';
  private holders = 0;
  private online: boolean | null = null;
  private previousOnline: boolean | null = null;
  private currentPhase: NetPhase = 'unknown';
  private generation = 0;
  private running: Promise<void> | null = null;
  private queued: Queued | null = null;
  private teardown: (() => void) | null = null;
  private checkAccount: (() => Promise<StepOutcome>) | null = null;
  private sendSaved: SendSaved | null = null;
  private readonly downloads = new Set<() => Promise<unknown> | unknown>();
  private readonly settled = new Set<() => void>();
  private readonly listeners = new Set<(snapshot: NetSnapshot) => void>();

  /** The marker: where the reconnect order currently is. */
  get phase(): NetPhase {
    return this.currentPhase;
  }

  get isOnline(): boolean | null {
    return this.online;
  }

  getSnapshot(): NetSnapshot {
    return {
      appState: this.appState,
      online: this.online,
      phase: this.currentPhase,
    };
  }

  subscribe(listener: (snapshot: NetSnapshot) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  registerCheckAccount(step: () => Promise<StepOutcome>): () => void {
    this.checkAccount = step;
    return () => {
      if (this.checkAccount === step) this.checkAccount = null;
    };
  }

  registerSendSaved(step: SendSaved): () => void {
    this.sendSaved = step;
    return () => {
      if (this.sendSaved === step) this.sendSaved = null;
    };
  }

  /** Feeds register their own refresh; the coordinator only calls into it. */
  registerDownload(step: () => Promise<unknown> | unknown): () => void {
    this.downloads.add(step);
    return () => {
      this.downloads.delete(step);
    };
  }

  /** Called whenever a reconnect run reaches a terminal phase. */
  onSettled(callback: () => void): () => void {
    this.settled.add(callback);
    return () => {
      this.settled.delete(callback);
    };
  }

  /**
   * Starts listening to the phone network and the app foreground state. Counted:
   * the providers share one NetInfo and one AppState subscription.
   */
  acquire(): () => void {
    this.holders += 1;
    if (this.holders === 1) {
      this.start();
    }
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.holders -= 1;
      if (this.holders === 0) {
        this.stop();
      }
    };
  }

  /**
   * The signed-in account changed: the next online reading counts as a startup.
   * When the phone is already known to be online that reading will not arrive
   * from NetInfo again, so start now.
   */
  rearm(): void {
    this.previousOnline = null;
    if (this.holders > 0 && this.online === true) {
      this.previousOnline = true;
      void this.run('startup');
    }
  }

  /**
   * Runs the reconnect order once. Overlapping requests coalesce: a request
   * arriving mid-run reruns once afterwards, except a Send saved resume that
   * arrives before Send saved has begun, which the running order already covers.
   */
  run(trigger: ReconnectTrigger, options: RunOptions = {}): Promise<void> {
    const startAt = options.startAt ?? 'check-account';
    if (this.running) {
      const early =
        this.currentPhase === 'back-online' ||
        this.currentPhase === 'check-account';
      if (!(startAt === 'send-saved' && early)) {
        const queued = this.queued;
        this.queued = {
          check: queued?.check ?? options.check,
          startAt:
            queued?.startAt === 'check-account' ? 'check-account' : startAt,
          trigger,
        };
      }
      return this.running;
    }
    const generation = this.generation;
    const operation = (async () => {
      try {
        await this.execute(trigger, startAt, options.check, generation);
        while (this.queued && generation === this.generation) {
          const next = this.queued;
          this.queued = null;
          await this.execute(next.trigger, next.startAt, next.check, generation);
        }
      } finally {
        this.running = null;
      }
    })();
    this.running = operation;
    return operation;
  }

  /** Test seam: returns the coordinator to its just-created state. */
  reset(): void {
    this.stop();
    this.holders = 0;
    this.checkAccount = null;
    this.sendSaved = null;
    this.downloads.clear();
    this.settled.clear();
    this.listeners.clear();
  }

  private start(): void {
    this.appState = (AppState.currentState as AppStateStatus | undefined) ?? 'active';
    const unsubscribeNetwork = NetInfo.addEventListener((state) => {
      this.handleNetwork(isNetworkOnline(state));
    });
    const appStateSubscription = AppState.addEventListener(
      'change',
      (nextState) => {
        this.handleAppState(nextState);
      },
    );
    this.teardown = () => {
      unsubscribeNetwork();
      appStateSubscription.remove();
    };
  }

  private stop(): void {
    this.teardown?.();
    this.teardown = null;
    this.generation += 1;
    this.queued = null;
    this.online = null;
    this.previousOnline = null;
    this.currentPhase = 'unknown';
    this.appState = 'active';
  }

  private emit(): void {
    const snapshot = this.getSnapshot();
    for (const listener of [...this.listeners]) {
      listener(snapshot);
    }
  }

  private setOnline(online: boolean): void {
    this.online = online;
    if (!online) {
      this.currentPhase = 'offline';
    } else if (this.currentPhase === 'offline' || this.currentPhase === 'unknown') {
      this.currentPhase = 'back-online';
    }
    this.emit();
  }

  private setPhase(phase: NetPhase): void {
    // A run that was already in flight must not paint over a fresh Offline.
    if (this.online === false && phase !== 'offline') return;
    if (this.currentPhase === phase) return;
    this.currentPhase = phase;
    this.emit();
  }

  private handleNetwork(online: boolean): void {
    const previous = this.previousOnline;
    this.setOnline(online);
    this.previousOnline = online;
    if (!online) {
      this.finish();
      return;
    }
    if (previous === false) {
      void this.run('network-restored');
    } else if (previous === null) {
      void this.run('startup');
    }
  }

  private handleAppState(nextState: AppStateStatus): void {
    this.appState = nextState;
    this.emit();
    if (nextState !== 'active') return;
    void NetInfo.fetch().then(
      (state) => {
        if (this.holders === 0) return;
        const online = isNetworkOnline(state);
        this.setOnline(online);
        this.previousOnline = online;
        if (online) {
          void this.run('resume');
        } else {
          this.finish();
        }
      },
      () => undefined,
    );
  }

  private finish(): void {
    for (const callback of [...this.settled]) {
      try {
        callback();
      } catch {
        // A readiness refresh failing must not break the reconnect order.
      }
    }
  }

  private async execute(
    trigger: ReconnectTrigger,
    startAt: 'check-account' | 'send-saved',
    checkOverride: (() => Promise<StepOutcome>) | undefined,
    generation: number,
  ): Promise<void> {
    const live = () => generation === this.generation && this.online !== false;
    if (this.online === false) {
      this.setPhase('offline');
      this.finish();
      return;
    }
    this.setPhase('back-online');

    let sendSource: ReconnectTrigger = trigger;
    let unreachable = false;

    if (startAt === 'check-account') {
      this.setPhase('check-account');
      const outcome = await this.safe(checkOverride ?? this.checkAccount);
      if (!live()) return this.abandon(generation);
      if (outcome === 'sign-in-again') {
        return this.end('sign-in-again');
      }
      if (outcome === 'recovered') {
        // The account just came back: held reports and boundaries wait on it.
        sendSource = 'retry-timer';
      }
      unreachable = outcome === 'office-unreachable';
    }

    this.setPhase('send-saved');
    const sendStep = this.sendSaved;
    const sent = sendStep
      ? await this.safe(() => sendStep(sendSource).then((value) => value ?? 'ok'))
      : 'ok';
    if (!live()) return this.abandon(generation);
    if (sent === 'sign-in-again') {
      return this.end('sign-in-again');
    }
    unreachable = unreachable || sent === 'office-unreachable';
    if (unreachable) {
      return this.end('office-unreachable');
    }

    this.setPhase('download');
    await Promise.allSettled(
      [...this.downloads].map(async (download) => download()),
    );
    if (!live()) return this.abandon(generation);
    this.end('up-to-date');
  }

  private async safe(
    step: (() => Promise<StepOutcome>) | null | undefined,
  ): Promise<StepOutcome> {
    if (!step) return 'ok';
    try {
      return await step();
    } catch {
      return 'ok';
    }
  }

  private end(phase: NetPhase): void {
    this.setPhase(phase);
    this.finish();
  }

  private abandon(generation: number): void {
    // Offline already published its own phase; only a stopped coordinator is silent.
    if (generation === this.generation) this.finish();
  }
}

/** The one coordinator. Read `net.phase`. */
export const net = new ReconnectCoordinator();
