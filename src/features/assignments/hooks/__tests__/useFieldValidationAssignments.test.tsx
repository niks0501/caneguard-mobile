import { act, renderHook, waitFor } from '@testing-library/react-native';

import { listCachedFieldValidationAssignments } from '@/features/assignments/data/assignmentCacheRepository';
import { useFieldValidationAssignments } from '@/features/assignments/hooks/useFieldValidationAssignments';
import { refreshFieldValidationAssignments } from '@/features/assignments/services/refreshFieldValidationAssignments';
import { useAuth } from '@/features/auth/hooks/useAuth';

const DATABASE = {};
const OWNER_ID = 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17';
const ASSIGNMENT_ID = '01a04de2-280e-7140-bf56-3c98f98259d5';
const CACHED_AT = new Date().toISOString();

jest.mock('expo-router', () => {
  const mockReact = jest.requireActual('react') as typeof import('react');
  return {
    useFocusEffect: (callback: () => void) => {
      mockReact.useEffect(callback, [callback]);
    },
  };
});
jest.mock('@/database/DatabaseProvider', () => ({
  EMPTY_DATABASE: {},
  useCaneGuardDatabase: () => DATABASE,
}));
jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));
jest.mock('@/features/assignments/data/assignmentCacheRepository', () => ({
  listCachedFieldValidationAssignments: jest.fn(),
}));
jest.mock(
  '@/features/assignments/services/refreshFieldValidationAssignments',
  () => ({ refreshFieldValidationAssignments: jest.fn() }),
);

const mockUseAuth = jest.mocked(useAuth);
const mockListCached = jest.mocked(listCachedFieldValidationAssignments);
const mockRefreshAssignments = jest.mocked(refreshFieldValidationAssignments);
const markSessionExpired = jest.fn(async () => undefined);

const READ_SESSION = {
  token: 'token-1',
  user: {
    capabilities: ['assignment:read'],
    role: 'field_reporter',
    uuid: OWNER_ID,
  },
};

describe('useFieldValidationAssignments capabilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListCached.mockResolvedValue([
      { id: ASSIGNMENT_ID, cachedAt: CACHED_AT } as never,
    ]);
    mockRefreshAssignments.mockResolvedValue({
      assignments: [],
      fetchedAt: Date.now(),
    } as never);
  });

  it('keeps cached assignments visible on the read grant and withdraws them without it', async () => {
    mockUseAuth.mockReturnValue({
      markSessionExpired,
      session: READ_SESSION,
      status: 'authenticated',
    } as never);

    const { result, rerender } = await renderHook(() =>
      useFieldValidationAssignments(),
    );
    await waitFor(() => expect(result.current.assignments).toHaveLength(1));

    mockUseAuth.mockReturnValue({
      markSessionExpired,
      session: {
        ...READ_SESSION,
        user: { ...READ_SESSION.user, capabilities: [] },
      },
      status: 'authenticated',
    } as never);
    await rerender(undefined);

    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.assignments).toEqual([]);
    expect(mockRefreshAssignments).not.toHaveBeenCalled();
  });

  it('never reads the assignment cache without assignment:read', async () => {
    mockUseAuth.mockReturnValue({
      markSessionExpired,
      session: {
        ...READ_SESSION,
        user: {
          ...READ_SESSION.user,
          capabilities: ['report:submit', 'assignment:complete'],
        },
      },
      status: 'authenticated',
    } as never);

    const { result } = await renderHook(() =>
      useFieldValidationAssignments(),
    );
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.assignments).toEqual([]);
    expect(mockListCached).not.toHaveBeenCalled();
    expect(mockRefreshAssignments).not.toHaveBeenCalled();
  });
});
