import { parseApiBaseUrl } from '@/config/env';

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
});
