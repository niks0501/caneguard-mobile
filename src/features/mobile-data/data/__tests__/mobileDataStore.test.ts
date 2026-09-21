import {
  beginOwnerRefresh,
  clearOwnerMobileDataStore,
  getOwnerMobileDataStore,
  isFresh,
  setOwnerAssignments,
  setOwnerNotifications,
  setOwnerTimeline,
} from '@/features/mobile-data/data/mobileDataStore';

const database = {} as never;

describe('owner mobile data store refreshes', () => {
  it('clears in-memory owner views and advances the invalidation generation', () => {
    const store = getOwnerMobileDataStore(database, 'owner-1');
    setOwnerAssignments(store, [{ id: 'assignment-1' } as never]);
    setOwnerNotifications(store, [{ id: 'notification-1' } as never]);
    setOwnerTimeline(store, 'timeline', [{ id: 'record-1' } as never], false);
    const previousGeneration = store.generation;

    clearOwnerMobileDataStore(database, 'owner-1');

    expect(store.generation).toBe(previousGeneration + 1);
    expect(store.assignments?.value).toEqual([]);
    expect(store.notifications?.value).toEqual([]);
    expect(store.timeline.size).toBe(0);
    expect(isFresh(store.assignments)).toBe(true);

    clearOwnerMobileDataStore(database, 'owner-1', { cacheFetchedAt: 0 });
    expect(isFresh(store.assignments)).toBe(false);
  });

  it('does not share an in-flight refresh across session tokens', async () => {
    const store = getOwnerMobileDataStore(database, 'owner-1');
    let resolveFirst!: () => void;
    const first = beginOwnerRefresh(
      store,
      'notifications',
      'owner-1:first-token',
      () => new Promise<void>((resolve) => { resolveFirst = resolve; }),
    );
    const second = beginOwnerRefresh(
      store,
      'notifications',
      'owner-1:second-token',
      async () => undefined,
    );

    expect(second).not.toBe(first);
    await expect(second).resolves.toBeUndefined();
    resolveFirst();
    await expect(first).resolves.toBeUndefined();
  });
});
