import * as Location from 'expo-location';

import { expoForegroundLocationClient } from '@/features/reports/services/expoForegroundLocationClient';
import type { WalkLocationClient } from '@/features/surveys/services/walkSurveyBoundary';

/**
 * Battery-conscious walk sampling: the OS reports only after the phone has moved
 * a few metres (or every few seconds), so a stationary phone is not polled.
 */
export const WALK_WATCH_DISTANCE_INTERVAL_METERS = 4;
export const WALK_WATCH_TIME_INTERVAL_MS = 3_000;

export const expoWalkLocationClient: WalkLocationClient = {
  hasServicesEnabled: () => expoForegroundLocationClient.hasServicesEnabled(),
  requestForegroundPermission: () => expoForegroundLocationClient.requestForegroundPermission(),
  async watchPosition(onFix, onError) {
    return Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: WALK_WATCH_DISTANCE_INTERVAL_METERS,
        timeInterval: WALK_WATCH_TIME_INTERVAL_MS,
      },
      (position) => onFix({
        accuracy: position.coords.accuracy,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timestamp: position.timestamp,
      }),
      onError,
    );
  },
};
