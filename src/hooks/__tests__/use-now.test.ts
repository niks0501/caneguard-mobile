import { act, renderHook } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';

import { useNow } from '@/hooks/use-now';

describe('useNow', () => {
  it('re-reads the clock at the next hour boundary', async () => {
    jest.useFakeTimers();
    try {
      jest.setSystemTime(new Date(2026, 10, 2, 11, 30));

      const { result } = await renderHook(() => useNow());
      expect(result.current.getHours()).toBe(11);

      await act(async () => {
        jest.advanceTimersByTime(30 * 60 * 1000);
      });

      expect(result.current.getHours()).toBe(12);
      expect(result.current.getDate()).toBe(2);
    } finally {
      jest.useRealTimers();
    }
  });

  it('re-reads the clock when the app returns to the foreground', async () => {
    jest.useFakeTimers();
    let onAppStateChange: ((status: AppStateStatus) => void) | null = null;
    const remove = jest.fn();
    const addEventListener = jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_event, listener) => {
        onAppStateChange = listener;
        return { remove } as never;
      });

    try {
      jest.setSystemTime(new Date(2026, 10, 2, 9, 0));
      const { result, unmount } = await renderHook(() => useNow());
      expect(result.current.getDate()).toBe(2);

      jest.setSystemTime(new Date(2026, 10, 3, 7, 15));
      await act(async () => {
        onAppStateChange?.('background');
        onAppStateChange?.('active');
      });

      expect(result.current.getDate()).toBe(3);
      expect(result.current.getHours()).toBe(7);

      await unmount();
      expect(remove).toHaveBeenCalled();
    } finally {
      addEventListener.mockRestore();
      jest.useRealTimers();
    }
  });
});
