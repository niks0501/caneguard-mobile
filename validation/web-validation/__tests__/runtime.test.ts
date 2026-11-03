import { isWebValidationRuntimeEnabled } from '../runtime';

const enabledEnv = {
  EXPO_PUBLIC_API_BASE_URL: 'http://127.0.0.1:8210',
  EXPO_PUBLIC_WEB_VALIDATION: '1',
};

describe('web validation runtime gate', () => {
  it('enables the stand-ins only in a development run against the stub', () => {
    expect(isWebValidationRuntimeEnabled(enabledEnv, true)).toBe(true);
    expect(
      isWebValidationRuntimeEnabled(
        { ...enabledEnv, EXPO_PUBLIC_API_BASE_URL: 'http://127.0.0.1:8210/' },
        true,
      ),
    ).toBe(true);
  });

  it('stays closed for a release build, a missing flag or another API', () => {
    expect(isWebValidationRuntimeEnabled(enabledEnv, false)).toBe(false);
    expect(
      isWebValidationRuntimeEnabled(
        { EXPO_PUBLIC_API_BASE_URL: 'http://127.0.0.1:8210' },
        true,
      ),
    ).toBe(false);
    expect(
      isWebValidationRuntimeEnabled(
        { ...enabledEnv, EXPO_PUBLIC_WEB_VALIDATION: 'true' },
        true,
      ),
    ).toBe(false);
    for (const apiBaseUrl of [
      undefined,
      'https://api.example.test',
      'http://localhost:8210',
      'http://127.0.0.1:3000',
    ]) {
      expect(
        isWebValidationRuntimeEnabled(
          { ...enabledEnv, EXPO_PUBLIC_API_BASE_URL: apiBaseUrl },
          true,
        ),
      ).toBe(false);
    }
  });
});
