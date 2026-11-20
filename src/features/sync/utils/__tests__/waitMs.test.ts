import { waitMs } from '@/features/sync/utils/waitMs';

describe('waitMs', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('resolves only after the requested delay', async () => {
    let done = false;
    void waitMs(500).then(() => { done = true; });
    await jest.advanceTimersByTimeAsync(499);
    expect(done).toBe(false);
    await jest.advanceTimersByTimeAsync(1);
    expect(done).toBe(true);
  });
});
