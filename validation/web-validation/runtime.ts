const STUB_API_ORIGIN = 'http://127.0.0.1:8210';

/**
 * The single runtime gate for validation-only web behaviour (the stub model and
 * the seeded farmer checks). It mirrors the Metro gate in
 * `scripts/web-validation-config.js`: development only, explicit flag, and the
 * fixed stub API origin. It is never true in a release build.
 */
export function isWebValidationRuntimeEnabled(
  env: Record<string, string | undefined> = process.env,
  isDevelopment: boolean =
    typeof __DEV__ === 'undefined' ? false : __DEV__,
): boolean {
  if (!isDevelopment || env.EXPO_PUBLIC_WEB_VALIDATION !== '1') {
    return false;
  }
  const baseUrl = (env.EXPO_PUBLIC_API_BASE_URL ?? '').trim().replace(/\/+$/, '');
  return baseUrl === STUB_API_ORIGIN;
}
