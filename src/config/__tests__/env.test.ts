import { parseApiBaseUrl, parseQaApiBaseUrl } from '@/config/env';

describe('mobile API environment', () => {
  it('normalizes a valid API URL', () => {
    expect(parseApiBaseUrl(' http://127.0.0.1:8000/// ')).toBe(
      'http://127.0.0.1:8000',
    );
  });

  it.each([
    undefined,
    '',
    'not-a-url',
    'ftp://example.test',
    'https://user:password@example.test',
  ])('rejects invalid public API configuration: %s', (value) => {
    expect(() => parseApiBaseUrl(value)).toThrow(
      /EXPO_PUBLIC_API_BASE_URL/,
    );
  });

  it('accepts a public HTTPS staging API URL for QA', () => {
    expect(parseQaApiBaseUrl(' https://staging.example.test/api/// ')).toBe(
      'https://staging.example.test/api',
    );
  });

  it.each([
    'http://staging.example.test',
    'https://localhost:8000',
    'https://127.0.0.1:8000',
    'https://[::1]:8000',
  ])('rejects non-public QA API configuration: %s', (value) => {
    expect(() => parseQaApiBaseUrl(value)).toThrow(
      /https for QA|public HTTPS staging host/,
    );
  });
});
