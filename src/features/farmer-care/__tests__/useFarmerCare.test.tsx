import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { act, render, waitFor } from '@testing-library/react-native';
import type { DatabaseSync } from 'node:sqlite';

import type { CaneGuardDatabase } from '@/database/database';
import { updateFarmerProfile } from '@/features/farmer-care/api/farmerCareApi';
import {
  listFarmerAdvisories,
  replaceFarmerAdvisories,
} from '@/features/farmer-care/data/farmerCareRepository';
import { readHomeBarangay, writeHomeBarangay } from '@/features/farmer-care/data/homeBarangayStorage';
import {
  resetAdvisoryRefreshClock,
  useFarmerCare,
  useFarmerCareAutoSync,
  useHomeBarangay,
} from '@/features/farmer-care/hooks/useFarmerCare';
import { syncFarmerCare } from '@/features/farmer-care/services/syncFarmerCare';
import { net } from '@/features/net/reconnectCoordinator';
import { ApiHttpError } from '@/features/shared/api/apiClient';
import { FARMER_A, openFarmerTestDatabase } from '../../../../test/farmerCareTestDatabase';

let mockDatabase: CaneGuardDatabase;

jest.mock('@/database/DatabaseProvider', () => ({
  useCaneGuardDatabase: () => mockDatabase,
}));
jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    session: { token: 'farmer-token' },
    user: {
      uuid: (jest.requireActual('../../../../test/farmerCareTestDatabase') as { FARMER_A: string }).FARMER_A,
      role: 'farmer',
    },
  }),
}));
jest.mock('@/features/farmer-care/api/farmerCareApi', () => ({
  updateFarmerProfile: jest.fn(),
}));
jest.mock('@/features/farmer-care/services/syncFarmerCare', () => ({
  syncFarmerCare: jest.fn(),
}));

const advisory = {
  remoteId: 'adv-aga',
  headlineTl: 'Paalala sa Aga',
  headlineEn: 'Aga reminder',
  bodyTl: 'Gabay',
  bodyEn: 'Guidance',
  publishedAt: '2026-11-28T00:00:00.000Z',
  expiresAt: '2099-01-01T00:00:00.000Z',
};

describe('useFarmerCare & useHomeBarangay', () => {
  let native: DatabaseSync;

  beforeEach(async () => {
    await AsyncStorage.clear();
    resetAdvisoryRefreshClock();
    net.reset();
    ({ database: mockDatabase, native } = openFarmerTestDatabase());
    jest.mocked(updateFarmerProfile).mockReset().mockResolvedValue(undefined);
    jest.mocked(syncFarmerCare).mockReset().mockResolvedValue({
      sent: 0,
      waiting: 0,
      failed: 0,
      newlyAnswered: 0,
      held: false,
      advisoriesRefreshed: true,
      homeBarangay: null,
    });
  });

  afterEach(() => {
    net.reset();
    native.close();
  });

  it('does not trigger the 10-minute cooldown when advisory download fails (CG-04)', async () => {
    let careRef!: ReturnType<typeof useFarmerCare>;
    function Harness() {
      careRef = useFarmerCare();
      return null;
    }
    await render(<Harness />);

    jest.mocked(syncFarmerCare).mockResolvedValueOnce({
      sent: 0,
      waiting: 0,
      failed: 0,
      newlyAnswered: 0,
      held: false,
      advisoriesRefreshed: false,
      homeBarangay: null,
    });

    await act(async () => {
      await careRef.syncNow({ refreshAdvisories: true });
    });
    expect(syncFarmerCare).toHaveBeenLastCalledWith(expect.objectContaining({ refreshAdvisories: true }));

    // Next attempt immediately afterwards must still request advisories because the first failed.
    await act(async () => {
      await careRef.syncNow({ refreshAdvisories: true });
    });
    expect(syncFarmerCare).toHaveBeenNthCalledWith(2, expect.objectContaining({ refreshAdvisories: true }));

    // After a successful download, the 10-minute cooldown applies to normal refreshes unless forced.
    await act(async () => {
      await careRef.syncNow({ refreshAdvisories: true });
    });
    expect(syncFarmerCare).toHaveBeenNthCalledWith(3, expect.objectContaining({ refreshAdvisories: false }));

    await act(async () => {
      await careRef.syncNow({ refreshAdvisories: true, forceAdvisories: true });
    });
    expect(syncFarmerCare).toHaveBeenNthCalledWith(4, expect.objectContaining({ refreshAdvisories: true }));
  });

  it('clears cached advisories immediately and forces a fresh download when home barangay changes (CG-02, CG-05)', async () => {
    await writeHomeBarangay(FARMER_A, { barangay: 'Aga', pushPending: false });
    replaceFarmerAdvisories(mockDatabase, FARMER_A, [advisory], '2026-11-28T01:00:00.000Z');

    let careRef!: ReturnType<typeof useFarmerCare>;
    let homeRef!: ReturnType<typeof useHomeBarangay>;
    function Harness() {
      careRef = useFarmerCare();
      homeRef = useHomeBarangay();
      return null;
    }
    await render(<Harness />);
    await waitFor(() => expect(homeRef.loaded).toBe(true));
    expect(careRef.advisories).toHaveLength(1);

    // Prime the 10-minute cooldown clock first.
    await act(async () => {
      await careRef.syncNow({ refreshAdvisories: true });
    });
    expect(syncFarmerCare).toHaveBeenCalledTimes(1);

    // Changing to Banilad must clear Aga's cached advisories immediately AND bypass cooldown.
    let outcome: string | undefined;
    await act(async () => {
      outcome = await homeRef.save('Banilad');
    });
    expect(outcome).toBe('saved');
    expect(listFarmerAdvisories(mockDatabase, FARMER_A)).toHaveLength(0);
    await waitFor(() =>
      expect(syncFarmerCare).toHaveBeenNthCalledWith(2, expect.objectContaining({ refreshAdvisories: true })),
    );
  });

  it('rejects unsupported barangays locally and clears stuck pending flag on HTTP 422 (CG-09)', async () => {
    await writeHomeBarangay(FARMER_A, { barangay: 'Aga', pushPending: false });
    let homeRef!: ReturnType<typeof useHomeBarangay>;
    let careRef!: ReturnType<typeof useFarmerCare>;
    function Harness() {
      careRef = useFarmerCare();
      homeRef = useHomeBarangay();
      return null;
    }
    await render(<Harness />);
    await waitFor(() => expect(homeRef.loaded).toBe(true));

    let invalidOutcome: string | undefined;
    await act(async () => {
      invalidOutcome = await homeRef.save('Atlantis');
    });
    expect(invalidOutcome).toBe('invalid');
    expect(updateFarmerProfile).not.toHaveBeenCalled();
    expect((await readHomeBarangay(FARMER_A)).barangay).toBe('Aga');

    // Legacy unsupported local value with pushPending=true must not loop 422 forever.
    await writeHomeBarangay(FARMER_A, { barangay: 'LegacyBadPlace', pushPending: true });
    await act(async () => {
      await careRef.syncNow({ refreshAdvisories: false });
    });
    expect(updateFarmerProfile).not.toHaveBeenCalled();
    expect(await readHomeBarangay(FARMER_A)).toEqual({ barangay: 'LegacyBadPlace', pushPending: false });

    // Direct 422 from server during save reverts instead of staying pending.
    await writeHomeBarangay(FARMER_A, { barangay: 'Aga', pushPending: false });
    jest.mocked(updateFarmerProfile).mockRejectedValueOnce(new ApiHttpError(422, 'invalid barangay'));
    let serverInvalid: string | undefined;
    await act(async () => {
      serverInvalid = await homeRef.save('Banilad');
    });
    expect(serverInvalid).toBe('invalid');
    expect(await readHomeBarangay(FARMER_A)).toEqual({ barangay: 'Aga', pushPending: false });
  });

  it('notifies subscribers when adopting server home barangay and auto-syncs on offline-to-online reconnect (CG-02, UX-M2)', async () => {
    let homeRef!: ReturnType<typeof useHomeBarangay>;
    let netListener: ((state: NetInfoState) => void) | null = null;
    const addListenerSpy = jest.spyOn(NetInfo, 'addEventListener').mockImplementation((listener) => {
      netListener = listener;
      return () => {
        netListener = null;
      };
    });

    jest.mocked(syncFarmerCare).mockResolvedValue({
      sent: 0,
      waiting: 0,
      failed: 0,
      newlyAnswered: 0,
      held: false,
      advisoriesRefreshed: true,
      homeBarangay: 'Tumalim',
    });

    function Harness() {
      useFarmerCareAutoSync();
      homeRef = useHomeBarangay();
      return null;
    }

    try {
      await render(<Harness />);
      await waitFor(() => expect(homeRef.barangay).toBe('Tumalim'));

      // Reset clock and simulate offline -> online reconnect via NetInfo.
      resetAdvisoryRefreshClock();
      jest.mocked(syncFarmerCare).mockClear();
      await act(async () => {
        netListener?.({ isConnected: false, isInternetReachable: false } as NetInfoState);
      });
      await act(async () => {
        netListener?.({ isConnected: true, isInternetReachable: true } as NetInfoState);
      });
      await waitFor(() =>
        expect(syncFarmerCare).toHaveBeenCalledWith(expect.objectContaining({ refreshAdvisories: true })),
      );
    } finally {
      addListenerSpy.mockRestore();
    }
  });
});
