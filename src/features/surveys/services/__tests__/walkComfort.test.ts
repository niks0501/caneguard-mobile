import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

import { holdScreenAwake, releaseScreenAwake, walkHaptic } from '@/features/surveys/services/walkComfort';
import { markWalkGuideSeen, shouldShowWalkGuide } from '@/features/surveys/services/walkGuideStore';

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});
afterEach(() => jest.useRealTimers());

describe('walk haptics', () => {
  it('ticks lightly for a point', () => {
    walkHaptic('point');
    expect(Haptics.impactAsync).toHaveBeenCalledWith('light');
  });

  it('double-ticks for a corner', () => {
    walkHaptic('corner');
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(200);
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(2);
    expect(Haptics.impactAsync).toHaveBeenLastCalledWith('medium');
  });

  it('uses distinct patterns for weak signal and back at the start', () => {
    walkHaptic('weak');
    expect(Haptics.notificationAsync).toHaveBeenLastCalledWith('warning');
    walkHaptic('backAtStart');
    expect(Haptics.notificationAsync).toHaveBeenLastCalledWith('success');
  });

  it('never throws when the device refuses or has no haptics', async () => {
    jest.mocked(Haptics.impactAsync).mockRejectedValueOnce(new Error('unavailable'));
    expect(() => walkHaptic('point')).not.toThrow();
    jest.mocked(Haptics.notificationAsync).mockImplementationOnce(() => { throw new Error('native module missing'); });
    expect(() => walkHaptic('weak')).not.toThrow();
    await Promise.resolve();
  });
});

describe('keeping the screen awake', () => {
  it('holds and releases one tagged lock', () => {
    holdScreenAwake();
    releaseScreenAwake();
    expect(activateKeepAwakeAsync).toHaveBeenCalledWith('caneguard-walk');
    expect(deactivateKeepAwake).toHaveBeenCalledWith('caneguard-walk');
  });

  it('survives a refusal on either side', () => {
    jest.mocked(activateKeepAwakeAsync).mockRejectedValueOnce(new Error('denied'));
    jest.mocked(deactivateKeepAwake).mockImplementationOnce(() => { throw new Error('nothing held'); });
    expect(() => holdScreenAwake()).not.toThrow();
    expect(() => releaseScreenAwake()).not.toThrow();
  });
});

describe('first-walk guide flag', () => {
  beforeEach(async () => {
    jest.useRealTimers();
    await AsyncStorage.clear();
  });

  it('shows once, then never again', async () => {
    await expect(shouldShowWalkGuide()).resolves.toBe(true);
    await markWalkGuideSeen();
    await expect(shouldShowWalkGuide()).resolves.toBe(false);
  });

  it('never nags when storage cannot be read', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('disk'));
    await expect(shouldShowWalkGuide()).resolves.toBe(false);
  });

  it('does not fail a walk when storage cannot be written', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk'));
    await expect(markWalkGuideSeen()).resolves.toBeUndefined();
  });
});
