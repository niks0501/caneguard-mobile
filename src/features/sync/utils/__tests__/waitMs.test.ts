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

  it('keeps a delay longer than one timer can hold instead of firing early', async () => {
    const requestedMs = 3_000_000_000;
    let done = false;
    void waitMs(requestedMs).then(() => { done = true; });
    await jest.advanceTimersByTimeAsync(1_000);
    expect(done).toBe(false);
    await jest.advanceTimersByTimeAsync(requestedMs - 1_000 - 1);
    expect(done).toBe(false);
    await jest.advanceTimersByTimeAsync(1);
    expect(done).toBe(true);
  });
});
