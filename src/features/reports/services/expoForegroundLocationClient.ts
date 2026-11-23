import * as Location from 'expo-location';
import { Platform } from 'react-native';

import type { ForegroundLocationClient } from '@/features/reports/services/captureGpsLocation';

export const expoForegroundLocationClient: ForegroundLocationClient = {
  async requestForegroundPermission() {
    const permission = await Location.requestForegroundPermissionsAsync();
    return {
      canAskAgain: permission.canAskAgain,
      status:
        permission.status === Location.PermissionStatus.GRANTED
          ? 'granted'
          : 'denied',
    };
  },

  async hasServicesEnabled() {
    if (await Location.hasServicesEnabledAsync()) {
      return true;
    }
    // Granting the app permission does not switch the phone's Location on.
    // Android can ask the user to turn it on right here; iOS offers no such
    // prompt, so it stays reported as disabled.
    if (Platform.OS !== 'android') {
      return false;
    }
    try {
      await Location.enableNetworkProviderAsync();
    } catch {
      // The user declined the system dialog.
      return false;
    }
    return Location.hasServicesEnabledAsync();
  },

  async getCurrentPosition() {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
    });
    return {
      accuracy: position.coords.accuracy,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      timestamp: position.timestamp,
    };
  },
};
