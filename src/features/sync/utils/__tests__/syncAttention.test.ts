import {
  buildSupportReference,
  getSyncAttention,
  supportShareMessage,
} from '@/features/sync/utils/syncAttention';

describe('syncAttention', () => {
  it.each([
    ['NETWORK_UNAVAILABLE', 'automatic-retry'],
    ['NETWORK_REQUEST_FAILED', 'automatic-retry'],
    ['SERVER_ERROR', 'automatic-retry'],
    ['API_RATE_LIMITED', 'automatic-retry'],
    ['AUTH_REQUIRED', 'sign-in'],
    ['API_VALIDATION_FAILED', 'support'],
    ['CLIENT_UUID_CONFLICT', 'support'],
    ['API_FORBIDDEN', 'support'],
    ['IMAGE_MISSING', 'support'],
    ['INVALID_LOCAL_RECORD', 'support'],
    ['UNKNOWN_SYNC_ERROR', 'support'],
  ] as const)('gives %s the %s action', (code, action) => {
    expect(getSyncAttention(code)?.action).toBe(action);
  });

  it('says network failures retry automatically and never asks for a blind resend', () => {
    const network = getSyncAttention('NETWORK_REQUEST_FAILED');
    expect(network?.reason).toMatch(/retries automatically/i);
    const validation = getSyncAttention('API_VALIDATION_FAILED');
    expect(validation?.reason).toMatch(/Sending the identical report again cannot fix/i);
    expect(validation?.actionLabel).toBe('Contact support');
  });

  it.each([
    'API_VALIDATION_FAILED',
    'CLIENT_UUID_CONFLICT',
    'API_FORBIDDEN',
    'IMAGE_MISSING',
    'INVALID_LOCAL_RECORD',
  ])('keeps the support handoff free of sensitive report content for %s', (code) => {
    const reference = buildSupportReference({
      code,
      reportId: '7ea3e6f0-b893-4fd3-b414-0b797e62ec8e',
    });
    expect(reference).toContain('report: 7ea3e6f0-b893-4fd3-b414-0b797e62ec8e');
    expect(reference).toContain(`failure: ${code}`);
    expect(reference).toMatch(/No photo, location, sign-in token or farmer details/);
    expect(reference).not.toMatch(/@|token=|latitude|longitude|farmer:/i);
    expect(supportShareMessage({ code, reportId: 'r-1' })).toContain(
      'No photo, location, sign-in token or farmer details',
    );
  });

  it('returns no presentation without a code', () => {
    expect(getSyncAttention(null)).toBeNull();
    expect(getSyncAttention('')).toBeNull();
  });
});
