import AsyncStorage from '@react-native-async-storage/async-storage';

const WALK_GUIDE_SEEN_KEY = 'caneguard.field-survey.walk-guide-seen.v1';

/** The first-walk guide shows once per install. Unreadable storage counts as "seen" so it can never nag. */
export async function shouldShowWalkGuide(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(WALK_GUIDE_SEEN_KEY)) === null;
  } catch {
    return false;
  }
}

export async function markWalkGuideSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(WALK_GUIDE_SEEN_KEY, '1');
  } catch {
    // The guide may show again next time; that is better than failing a walk.
  }
}
