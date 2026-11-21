import * as copy from '@/constants/copy';
import { FARMER_COPY, getOfflineUnlockCopy } from '@/constants/copy';

describe('offline unlock copy has one owner', () => {
  it('no longer exports a second unlock table', () => {
    expect(Object.keys(copy)).not.toContain('OFFLINE_UNLOCK_COPY');
  });

  it.each(['en', 'tl'] as const)('serves %s wording straight from FARMER_COPY', (language) => {
    const { unlock } = FARMER_COPY[language];
    expect(getOfflineUnlockCopy(true, false, language)).toBe(unlock.biometric);
    expect(getOfflineUnlockCopy(null, false, language)).toBe(unlock.biometric);
    expect(getOfflineUnlockCopy(false, false, language)).toBe(unlock.biometric);
    expect(getOfflineUnlockCopy(false, true, language)).toBe(unlock.deviceCredential);
  });

  it('defaults to English for non-farmer surfaces', () => {
    expect(getOfflineUnlockCopy(true)).toBe(FARMER_COPY.en.unlock.biometric);
    expect(getOfflineUnlockCopy(false, true)).toBe(FARMER_COPY.en.unlock.deviceCredential);
  });

  it('keeps the qualified device PIN wording separate from the biometric wording', () => {
    const { biometric, deviceCredential } = FARMER_COPY.en.unlock;
    expect(deviceCredential.enabledMessage).toContain('device PIN, pattern, or password');
    expect(biometric.enabledMessage).not.toContain('PIN');
    expect(deviceCredential.loginButton).toBe('Unlock with device credentials');
    expect(biometric.loginButton).toBe('Unlock with biometrics');
    expect(deviceCredential.sessionExpires('X')).toBe('Session expires X. Device unlock does not extend it.');
  });
});
