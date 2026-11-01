import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { openDatabaseAsync } from 'expo-sqlite';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Platform, Text } from 'react-native';

import { CaneGuardDatabaseProvider } from '@/database/DatabaseProvider';
import { getCaneGuardDatabaseResources } from '@/database/database';

jest.mock('drizzle-orm/expo-sqlite/migrator', () => ({
  useMigrations: jest.fn(),
}));

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

jest.mock('@/database/database', () => ({
  CANEGUARD_DATABASE_FILENAME: 'caneguard.db',
  clearCaneGuardDatabaseResourcesForRetry: jest.fn(),
  getCaneGuardDatabaseResources: jest.fn(),
}));

const mockUseMigrations = jest.mocked(useMigrations);
const mockOpenDatabaseAsync = jest.mocked(openDatabaseAsync);
const mockGetResources = jest.mocked(getCaneGuardDatabaseResources);

const resources = {
  database: {} as ReturnType<typeof getCaneGuardDatabaseResources>['database'],
  sqlite: {} as ReturnType<typeof getCaneGuardDatabaseResources>['sqlite'],
};

let currentPlatform: string;
const originalPlatformOS = Object.getOwnPropertyDescriptor(Platform, 'OS');

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((resolved, rejected) => {
    resolve = resolved;
    reject = rejected;
  });
  return { promise, reject, resolve };
}

describe('CaneGuardDatabaseProvider on web', () => {
  beforeAll(() => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => currentPlatform,
    });
  });

  afterAll(() => {
    if (originalPlatformOS) {
      Object.defineProperty(Platform, 'OS', originalPlatformOS);
    }
  });

  beforeEach(() => {
    currentPlatform = 'web';
    mockGetResources.mockReturnValue(resources);
    mockOpenDatabaseAsync.mockResolvedValue({} as never);
    mockUseMigrations.mockReturnValue({ success: true });
  });

  it('warms the web SQLite worker before the first synchronous open', async () => {
    const closeAsync = jest.fn().mockResolvedValue(undefined);
    const warmUp = createDeferred<{ closeAsync: typeof closeAsync }>();
    mockOpenDatabaseAsync.mockReturnValue(warmUp.promise as never);

    await render(
      <CaneGuardDatabaseProvider>
        <Text>Application content</Text>
      </CaneGuardDatabaseProvider>,
    );

    expect(screen.getByText('Preparing local storage')).toBeOnTheScreen();
    expect(mockOpenDatabaseAsync).toHaveBeenCalledWith('caneguard.db');
    expect(mockGetResources).not.toHaveBeenCalled();

    await act(async () => {
      warmUp.resolve({ closeAsync });
      await warmUp.promise;
    });

    await waitFor(() => {
      expect(screen.getByText('Application content')).toBeOnTheScreen();
    });
    expect(closeAsync).not.toHaveBeenCalled();
    expect(mockGetResources).toHaveBeenCalledTimes(1);
  });

  it('shows the retryable storage error when the warm-up fails', async () => {
    const warmUp = createDeferred<unknown>();
    mockOpenDatabaseAsync.mockReturnValue(warmUp.promise as never);

    await render(
      <CaneGuardDatabaseProvider>
        <Text>Application content</Text>
      </CaneGuardDatabaseProvider>,
    );

    await act(async () => {
      warmUp.reject(new Error('Worker startup failed'));
      await warmUp.promise.catch(() => undefined);
    });

    await waitFor(() => {
      expect(screen.getByText('Local storage needs attention')).toBeOnTheScreen();
    });
    expect(
      screen.getByLabelText('Retry local storage initialization'),
    ).toBeOnTheScreen();
    expect(mockGetResources).not.toHaveBeenCalled();
  });

  it('shows the retryable storage error when the warm-up never settles', async () => {
    jest.useFakeTimers();
    try {
      mockOpenDatabaseAsync.mockReturnValue(new Promise(() => undefined) as never);

      await render(
        <CaneGuardDatabaseProvider>
          <Text>Application content</Text>
        </CaneGuardDatabaseProvider>,
      );

      expect(screen.getByText('Preparing local storage')).toBeOnTheScreen();
      expect(mockGetResources).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(60_000);
      });

      expect(screen.getByText('Local storage needs attention')).toBeOnTheScreen();
      expect(
        screen.getByLabelText('Retry local storage initialization'),
      ).toBeOnTheScreen();
      expect(mockGetResources).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  it('logs the warm-up failure cause without leaking it to the screen', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    const warmUp = createDeferred<unknown>();
    mockOpenDatabaseAsync.mockReturnValue(warmUp.promise as never);

    await render(
      <CaneGuardDatabaseProvider>
        <Text>Application content</Text>
      </CaneGuardDatabaseProvider>,
    );

    await act(async () => {
      warmUp.reject(new Error('Worker startup failed'));
      await warmUp.promise.catch(() => undefined);
    });

    await waitFor(() => {
      expect(screen.getByText('Local storage needs attention')).toBeOnTheScreen();
    });
    expect(screen.queryByText(/Worker startup failed/)).not.toBeOnTheScreen();
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('Cause: Error: Worker startup failed'),
    );

    consoleError.mockRestore();
  });

  it('closes a warm-up connection that resolves after the timeout', async () => {
    jest.useFakeTimers();
    try {
      const closeAsync = jest.fn().mockResolvedValue(undefined);
      const warmUp = createDeferred<{ closeAsync: typeof closeAsync }>();
      mockOpenDatabaseAsync.mockReturnValue(warmUp.promise as never);

      await render(
        <CaneGuardDatabaseProvider>
          <Text>Application content</Text>
        </CaneGuardDatabaseProvider>,
      );

      act(() => {
        jest.advanceTimersByTime(60_000);
      });
      expect(screen.getByText('Local storage needs attention')).toBeOnTheScreen();

      await act(async () => {
        warmUp.resolve({ closeAsync });
        await warmUp.promise;
      });

      expect(closeAsync).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Local storage needs attention')).toBeOnTheScreen();
      expect(mockGetResources).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  it('closes a warm-up connection that resolves after the attempt unmounts', async () => {
    const closeAsync = jest.fn().mockResolvedValue(undefined);
    const warmUp = createDeferred<{ closeAsync: typeof closeAsync }>();
    mockOpenDatabaseAsync.mockReturnValue(warmUp.promise as never);

    const view = await render(
      <CaneGuardDatabaseProvider>
        <Text>Application content</Text>
      </CaneGuardDatabaseProvider>,
    );

    view.unmount();

    await act(async () => {
      warmUp.resolve({ closeAsync });
      await warmUp.promise;
    });

    expect(closeAsync).toHaveBeenCalledTimes(1);
    expect(mockGetResources).not.toHaveBeenCalled();
  });

  it('restarts the web warm-up when the user retries', async () => {
    const warmUp = createDeferred<unknown>();
    mockOpenDatabaseAsync
      .mockReturnValueOnce(warmUp.promise as never)
      .mockResolvedValueOnce({} as never);

    await render(
      <CaneGuardDatabaseProvider>
        <Text>Application content</Text>
      </CaneGuardDatabaseProvider>,
    );

    await act(async () => {
      warmUp.reject(new Error('Worker startup failed'));
      await warmUp.promise.catch(() => undefined);
    });

    await waitFor(() => {
      expect(screen.getByText('Local storage needs attention')).toBeOnTheScreen();
    });

    fireEvent.press(screen.getByLabelText('Retry local storage initialization'));

    await waitFor(() => {
      expect(screen.getByText('Application content')).toBeOnTheScreen();
    });
    expect(mockOpenDatabaseAsync).toHaveBeenCalledTimes(2);
    expect(mockGetResources).toHaveBeenCalledTimes(1);
  });

  it('logs the underlying open failure cause without leaking it to the screen', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    const cause = new Error('Sync operation timeout');
    mockGetResources.mockImplementation(() => {
      throw cause;
    });

    await render(
      <CaneGuardDatabaseProvider>
        <Text>Application content</Text>
      </CaneGuardDatabaseProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Local storage needs attention')).toBeOnTheScreen();
    });
    expect(screen.queryByText(/Sync operation timeout/)).not.toBeOnTheScreen();
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('Cause: Error: Sync operation timeout'),
    );
    consoleError.mockRestore();
  });

  it('logs the underlying migration failure cause without leaking it to the screen', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    const cause = new Error('Unterminated string in JSON');
    mockUseMigrations.mockReturnValue({ error: cause, success: false });

    await render(
      <CaneGuardDatabaseProvider>
        <Text>Application content</Text>
      </CaneGuardDatabaseProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Local storage needs attention')).toBeOnTheScreen();
    });
    expect(screen.queryByText(/Unterminated string/)).not.toBeOnTheScreen();
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining(
        '[storage:MIGRATION_FAILED] Local database migration failed. Cause: Error: Unterminated string in JSON',
      ),
    );

    consoleError.mockRestore();
  });

  it('leaves the native path untouched', async () => {
    currentPlatform = 'ios';

    await render(
      <CaneGuardDatabaseProvider>
        <Text>Application content</Text>
      </CaneGuardDatabaseProvider>,
    );

    expect(screen.getByText('Application content')).toBeOnTheScreen();
    expect(mockOpenDatabaseAsync).not.toHaveBeenCalled();
  });
});
