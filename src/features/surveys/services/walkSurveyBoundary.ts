import type { ForegroundLocationClient } from '@/features/reports/services/captureGpsLocation';
import type { WalkFix } from '@/features/surveys/domain/walkMode';

export interface WalkLocationClient extends Pick<ForegroundLocationClient, 'hasServicesEnabled' | 'requestForegroundPermission'> {
  /** Streams position readings until the returned subscription is removed. */
  watchPosition(onFix: (fix: WalkFix) => void, onError: () => void): Promise<{ remove(): void }>;
}

export type WalkStartResult =
  | { status: 'started'; stop: () => void }
  | { status: 'permission_denied' | 'services_disabled' | 'unavailable' };

export async function startWalk(
  client: WalkLocationClient,
  onFix: (fix: WalkFix) => void,
  onError: () => void,
): Promise<WalkStartResult> {
  try {
    const permission = await client.requestForegroundPermission();
    if (permission.status !== 'granted') return { status: 'permission_denied' };
    if (!(await client.hasServicesEnabled())) return { status: 'services_disabled' };
    let stopped = false;
    const subscription = await client.watchPosition(
      (fix) => { if (!stopped) onFix(fix); },
      () => { if (!stopped) onError(); },
    );
    return {
      status: 'started',
      stop: () => {
        if (stopped) return;
        stopped = true;
        subscription.remove();
      },
    };
  } catch {
    return { status: 'unavailable' };
  }
}
