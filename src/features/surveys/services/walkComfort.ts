import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

/** What a walker feels with the phone at hip height, so they never have to look at the screen. */
export type WalkHaptic = 'point' | 'corner' | 'weak' | 'backAtStart';

const CORNER_SECOND_TICK_MS = 120;
const KEEP_AWAKE_TAG = 'caneguard-walk';

function quietly(task: () => Promise<unknown>): void {
  // Haptics and wake locks are comforts: a device without them, or a refusal, must never break a walk.
  try {
    void task().catch(() => undefined);
  } catch {
    // Native module missing (web, some emulators).
  }
}

/** Fire-and-forget: a light tick per point, a double tick for a corner, distinct patterns for weak signal and the start. */
export function walkHaptic(kind: WalkHaptic): void {
  switch (kind) {
    case 'point':
      quietly(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
      return;
    case 'corner':
      quietly(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
      setTimeout(() => quietly(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)), CORNER_SECOND_TICK_MS);
      return;
    case 'weak':
      quietly(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
      return;
    case 'backAtStart':
      quietly(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  }
}

/** Keeps the screen on while a walk runs, so locking the phone does not end it. */
export function holdScreenAwake(): void {
  quietly(() => activateKeepAwakeAsync(KEEP_AWAKE_TAG));
}

export function releaseScreenAwake(): void {
  try {
    void Promise.resolve(deactivateKeepAwake(KEEP_AWAKE_TAG)).catch(() => undefined);
  } catch {
    // Nothing was held.
  }
}
