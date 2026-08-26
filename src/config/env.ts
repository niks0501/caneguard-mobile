const API_BASE_URL_KEY = 'EXPO_PUBLIC_API_BASE_URL';

function parseConfiguredApiBaseUrl(
  value: string | undefined,
  options: { requireHttps: boolean; requirePublicHost: boolean },
): string {
  const normalized = value?.trim().replace(/\/+$/, '');

  if (!normalized) {
    throw new Error(
      `${API_BASE_URL_KEY} is required. Copy .env.example to .env and restart Metro.`,
    );
  }

  let url: URL;
  try {
    url = new URL(normalized);
  } catch {
    throw new Error(`${API_BASE_URL_KEY} must be a valid absolute URL.`);
  }

  if (
    (url.protocol !== 'http:' && url.protocol !== 'https:') ||
    url.username ||
    url.password
  ) {
    throw new Error(
      `${API_BASE_URL_KEY} must use http or https and must not contain credentials.`,
    );
  }
  if (options.requireHttps && url.protocol !== 'https:') {
    throw new Error(`${API_BASE_URL_KEY} must use https for QA staging.`);
  }
  if (!__DEV__ && url.protocol !== 'https:') {
    throw new Error(
      `${API_BASE_URL_KEY} must use https outside a development build.`,
    );
  }
  if (
    options.requirePublicHost &&
    /^(localhost|0\.0\.0\.0|127(?:\.\d{1,3}){3}|\[?::1\]?)$/i.test(
      url.hostname,
    )
  ) {
    throw new Error(
      `${API_BASE_URL_KEY} must use the public HTTPS staging host for QA, not a local address.`,
    );
  }

  return normalized;
}

export function parseApiBaseUrl(value: string | undefined): string {
  return parseConfiguredApiBaseUrl(value, {
    requireHttps: false,
    requirePublicHost: false,
  });
}

export function parseQaApiBaseUrl(value: string | undefined): string {
  return parseConfiguredApiBaseUrl(value, {
    requireHttps: true,
    requirePublicHost: true,
  });
}

export const apiBaseUrl =
  process.env.EXPO_PUBLIC_QA_MODE === 'true'
    ? parseQaApiBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL)
    : parseApiBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
