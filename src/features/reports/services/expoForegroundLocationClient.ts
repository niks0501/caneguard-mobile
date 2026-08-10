import * as Location from 'expo-location';

import type { ForegroundLocationClient } from '@/features/reports/services/captureGpsLocation';

export const expoForegroundLocationClient: ForegroundLocationClient = {
  async requestForegroundPermission() {
    const permission = await Location.requestForegroundPermissionsAsync();
    return permission.status === Location.PermissionStatus.GRANTED
      ? 'granted'
      : 'denied';
  },

  hasServicesEnabled() {
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
