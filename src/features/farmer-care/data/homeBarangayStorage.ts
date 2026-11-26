import AsyncStorage from '@react-native-async-storage/async-storage';

import { requireOwnerIdentity } from '@/database/ownerIdentity';

export interface HomeBarangayState {
  barangay: string | null;
  /** The choice was made offline and the office has not been told yet. */
  pushPending: boolean;
}

const key = (owner: string) => `caneguard.farmer.homeBarangay.${requireOwnerIdentity(owner)}`;

export async function readHomeBarangay(ownerIdentity: string): Promise<HomeBarangayState> {
  try {
    const raw = await AsyncStorage.getItem(key(ownerIdentity));
    if (!raw) return { barangay: null, pushPending: false };
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const value = parsed as { barangay?: unknown; pushPending?: unknown };
      return {
        barangay: typeof value.barangay === 'string' && value.barangay.trim() ? value.barangay : null,
        pushPending: value.pushPending === true,
      };
    }
  } catch {
    // Unreadable storage reads as "not set": the farmer is simply asked again.
  }
  return { barangay: null, pushPending: false };
}

export async function writeHomeBarangay(ownerIdentity: string, state: HomeBarangayState): Promise<void> {
  await AsyncStorage.setItem(key(ownerIdentity), JSON.stringify(state));
}

export async function clearHomeBarangay(ownerIdentity: string): Promise<void> {
  await AsyncStorage.removeItem(key(ownerIdentity));
}
