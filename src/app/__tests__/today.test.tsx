import { fireEvent, render, screen } from '@testing-library/react-native';

import TodayScreen from '@/app/(tabs)/today';
import { ToastProvider } from '@/components/ui/Toast';

const mockRefresh = jest.fn(async () => true);
const mockShowToast = jest.fn();
let mockTodayState: Record<string, unknown>;

jest.mock('@/features/assignments/hooks/useTodayVisits', () => ({
  useTodayVisits: () => mockTodayState,
}));
jest.mock('@/components/ui/Toast', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => children,
  useToast: () => ({ showToast: mockShowToast }),
}));
jest.mock('@/features/activity/components/AssignmentCard', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    AssignmentCard: ({ assignment }: { assignment: { id: string } }) => (
      <Text>{`visit-${assignment.id}`}</Text>
    ),
  };
});

function assignment(id: string) {
  return {
    id,
    targetVisitDate: '2026-10-23',
    updatedAt: '2026-10-23T02:00:00.000Z',
    case: { barangay: 'Wawa', municipality: 'Nasugbu', province: 'Batangas' },
  };
}

function state(overrides: Record<string, unknown> = {}) {
  return {
    assignments: [],
    capabilityUnavailable: false,
    completedTodayCount: 0,
    errorMessage: null,
    lastSuccessfulAt: null,
    refresh: mockRefresh,
    refreshing: false,
    today: '2026-10-23',
    visits: [],
    ...overrides,
  };
}

async function renderToday(overrides: Record<string, unknown> = {}) {
  mockTodayState = state(overrides);
  return render(
    <ToastProvider>
      <TodayScreen />
    </ToastProvider>,
  );
}

describe("TodayScreen empty states", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRefresh.mockResolvedValue(true);
  });

  it('never claims no assignments when the refresh failed', async () => {
    await renderToday({
      errorMessage: "Couldn't refresh - showing saved assignments.",
      lastSuccessfulAt: '2026-10-22T09:00:00.000Z',
    });

    expect(screen.getByTestId('today.state.refresh-failed')).toBeOnTheScreen();
    expect(screen.queryByText('No open visits')).not.toBeOnTheScreen();
    expect(screen.queryByText('No visits assigned yet')).not.toBeOnTheScreen();
    expect(screen.getByTestId('today.refresh-error')).toBeOnTheScreen();
    expect(screen.getByTestId('today.refresh-message')).toHaveTextContent(
      /not proof that the office assigned none/,
    );
    expect(screen.getByTestId('today.last-updated')).toHaveTextContent(
      /Last updated/,
    );
  });

  it('keeps cached visits visible and dated after a failed refresh', async () => {
    await renderToday({
      assignments: [assignment('a1')],
      errorMessage: "Couldn't refresh - showing saved assignments.",
      lastSuccessfulAt: '2026-10-22T09:00:00.000Z',
      visits: [assignment('a1')],
    });

    expect(screen.getByText('visit-a1')).toBeOnTheScreen();
    expect(screen.getByTestId('today.refresh-error')).toHaveTextContent(
      /Showing the visits already downloaded/,
    );
    expect(screen.getByTestId('today.last-updated')).toHaveTextContent(
      /Last updated/,
    );
  });

  it('reports a server without the assignment capability honestly', async () => {
    await renderToday({
      capabilityUnavailable: true,
      errorMessage:
        'Field validation assignments are unavailable on this server. Showing the saved assignment cache.',
    });

    expect(
      screen.getByTestId('today.state.capability-unavailable'),
    ).toBeOnTheScreen();
    expect(screen.getByTestId('today.refresh-error')).toHaveTextContent(
      /Visit assignments unavailable/,
    );
  });

  it('shows completion feedback when zero visits stay open', async () => {
    await renderToday({
      completedTodayCount: 2,
      lastSuccessfulAt: '2026-10-23T02:00:00.000Z',
    });

    expect(screen.getByTestId('today.state.all-completed')).toBeOnTheScreen();
    expect(screen.getByTestId('today.completed-count')).toHaveTextContent(
      '2 visits completed today',
    );
    expect(screen.queryByText('No open visits')).not.toBeOnTheScreen();
  });

  it('allows a successful empty refresh to say no open visits', async () => {
    await renderToday({ lastSuccessfulAt: '2026-10-23T02:00:00.000Z' });

    expect(screen.getByTestId('today.state.no-open-visits')).toBeOnTheScreen();
    expect(screen.queryByTestId('today.refresh-error')).not.toBeOnTheScreen();
    expect(screen.queryByTestId('today.completed-count')).not.toBeOnTheScreen();
  });

  it('keeps the completed count independent of the open list', async () => {
    await renderToday({
      assignments: [assignment('a1')],
      completedTodayCount: 1,
      visits: [assignment('a1')],
    });

    expect(screen.getByText('visit-a1')).toBeOnTheScreen();
    expect(screen.getByTestId('today.completed-count')).toHaveTextContent(
      '1 visit completed today',
    );
  });

  it('refreshes from every empty state', async () => {
    await renderToday({
      errorMessage: 'failed',
    });

    await fireEvent.press(screen.getByText('Refresh assignments'));
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });
});
