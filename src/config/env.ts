const API_BASE_URL_KEY = 'EXPO_PUBLIC_API_BASE_URL';

export function parseApiBaseUrl(value: string | undefined): string {
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
  if (!__DEV__ && url.protocol !== 'https:') {
    throw new Error(
      `${API_BASE_URL_KEY} must use https outside a development build.`,
    );
  }

  return normalized;
}

export const apiBaseUrl = parseApiBaseUrl(
  process.env.EXPO_PUBLIC_API_BASE_URL,
);
