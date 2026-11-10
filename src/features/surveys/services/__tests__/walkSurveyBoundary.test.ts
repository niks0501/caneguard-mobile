import { startWalk, type WalkLocationClient } from '@/features/surveys/services/walkSurveyBoundary';

function client(overrides: Partial<WalkLocationClient> = {}): WalkLocationClient & { remove: jest.Mock } {
  const remove = jest.fn();
  return {
    remove,
    hasServicesEnabled: jest.fn(async () => true),
    requestForegroundPermission: jest.fn(async () => ({ canAskAgain: true, status: 'granted' as const })),
    watchPosition: jest.fn(async () => ({ remove })),
    ...overrides,
  };
}

describe('startWalk', () => {
  // Intent: walking reports why it cannot start instead of silently doing nothing.
  it('reports denied permission and disabled services without watching', async () => {
    const denied = client({ requestForegroundPermission: jest.fn(async () => ({ canAskAgain: false, status: 'denied' as const })) });
    expect(await startWalk(denied, jest.fn(), jest.fn())).toEqual({ status: 'permission_denied' });
    expect(denied.watchPosition).not.toHaveBeenCalled();
    const off = client({ hasServicesEnabled: jest.fn(async () => false) });
    expect(await startWalk(off, jest.fn(), jest.fn())).toEqual({ status: 'services_disabled' });
  });

  // Intent: stopping the walk releases the GPS subscription (battery) and silences late fixes.
  it('stops the subscription once and ignores fixes after stop', async () => {
    const c = client();
    const onFix = jest.fn();
    const result = await startWalk(c, onFix, jest.fn());
    if (result.status !== 'started') throw new Error('expected started');
    const emit = (c.watchPosition as jest.Mock).mock.calls[0][0];
    emit({ latitude: 1, longitude: 2, accuracy: 3, timestamp: 4 });
    result.stop();
    result.stop();
    emit({ latitude: 1, longitude: 2, accuracy: 3, timestamp: 5 });
    expect(onFix).toHaveBeenCalledTimes(1);
    expect(c.remove).toHaveBeenCalledTimes(1);
  });

  it('reports unavailable when the watch cannot start', async () => {
    const c = client({ watchPosition: jest.fn(async () => { throw new Error('boom'); }) });
    expect(await startWalk(c, jest.fn(), jest.fn())).toEqual({ status: 'unavailable' });
  });
});
