import {
  describeRefreshAllResult,
  runRefreshAll,
  type RefreshAllTarget,
} from '@/features/activity/domain/refreshAll';

describe('runRefreshAll', () => {
  it('invokes every target once and reports full success', async () => {
    const calls: string[] = [];
    const target = (key: string): RefreshAllTarget => ({
      key,
      run: async () => {
        calls.push(key);
      },
    });

    const result = await runRefreshAll([
      target('sync'),
      target('notifications'),
      target('assignments'),
    ]);

    expect(calls).toEqual(['sync', 'notifications', 'assignments']);
    expect(result.succeeded).toEqual(['sync', 'notifications', 'assignments']);
    expect(result.failed).toEqual([]);
  });

  it('keeps other subsystems running when one rejects', async () => {
    let secondaryRan = false;
    const result = await runRefreshAll([
      {
        key: 'sync',
        run: async () => {
          throw new Error('offline');
        },
      },
      {
        key: 'notifications',
        run: async () => {
          secondaryRan = true;
        },
      },
    ]);

    expect(secondaryRan).toBe(true);
    expect(result.failed).toEqual(['sync']);
    expect(result.succeeded).toEqual(['notifications']);
  });
});

describe('describeRefreshAllResult', () => {
  it('says nothing before the first refresh', () => {
    expect(describeRefreshAllResult(null)).toBeNull();
  });

  it('confirms a complete refresh in product language', () => {
    expect(
      describeRefreshAllResult({ failed: [], succeeded: ['sync'] }),
    ).toBe('Everything is up to date.');
  });

  it('names the failed subsystems and reassures about saved content', () => {
    expect(
      describeRefreshAllResult({ failed: ['officeReview'], succeeded: ['sync'] }),
    ).toBe("Couldn't refresh office review status. Saved content is still available.");
  });
});
