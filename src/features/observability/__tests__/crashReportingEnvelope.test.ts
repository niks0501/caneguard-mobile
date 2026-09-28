import * as Sentry from '@sentry/react-native';

import { REDACTED } from '../scrubSentryPayload';
import { startCrashReporting } from '../startCrashReporting';

/**
 * Runs the real SDK against a throwaway DSN-shaped value and inspects the
 * envelope the SDK was about to upload. Nothing leaves the test process: the
 * fetch transport is replaced with a stub that answers 200.
 */
const THROWAWAY_DSN =
  'https://0123456789abcdef0123456789abcdef@o0.ingest.sentry.io/1';

describe('crash reporting against a throwaway DSN', () => {
  it('uploads a scrubbed event through the real SDK wiring', async () => {
    const fetchMock = jest.fn(async () => ({
      status: 200,
      headers: { get: () => null },
    }));
    const previousFetch = globalThis.fetch;
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    // The transport captures the global fetch while the client is created, so
    // the stub has to be in place before `startCrashReporting` runs.
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    try {
      expect(startCrashReporting(THROWAWAY_DSN, null)).toBe(true);

      const client = Sentry.getClient();
      expect(client).toBeDefined();
      const envelopes: unknown[] = [];
      client?.on('beforeEnvelope', (envelope) => {
        envelopes.push(envelope);
      });

      Sentry.setUser({ id: 'submitter-uuid', email: 'asha@example.test' });
      Sentry.setExtra('latitude', 12.9716);
      Sentry.setExtra('photoUri', 'file:///data/scans/leaf.jpg');
      Sentry.setExtra('storageErrorCode', 'DATABASE_OPEN_FAILED');
      Sentry.addBreadcrumb({
        category: 'http',
        message: 'GET https://api.example.test/v2/reports?farmer=Asha',
        data: {
          url: 'https://api.example.test/v2/reports?farmer=Asha',
          latitude: 12.9716,
          status_code: 500,
        },
      });
      console.error('Report for Asha is incomplete');

      Sentry.captureException(
        new Error('Failed to store file:///data/scans/leaf.jpg'),
      );
      await Sentry.flush();

      expect(envelopes).not.toHaveLength(0);
      const payload = envelopes
        .map((envelope) => JSON.stringify(envelope))
        .join('\n');

      // Operational detail survives, so the event really is the processed one.
      expect(payload).toContain('DATABASE_OPEN_FAILED');
      expect(payload).toContain('https://api.example.test/v2/reports');
      expect(payload).toContain(REDACTED);
      // Field data, identity, and free-text console output do not.
      expect(payload).not.toContain('12.9716');
      expect(payload).not.toContain('leaf.jpg');
      expect(payload).not.toContain('file://');
      expect(payload).not.toContain('submitter-uuid');
      expect(payload).not.toContain('asha@example.test');
      expect(payload).not.toContain('farmer=Asha');
      expect(payload).not.toContain('Report for Asha is incomplete');
    } finally {
      globalThis.fetch = previousFetch;
      warnSpy.mockRestore();
      errorSpy.mockRestore();
      await Sentry.close();
    }
  });
});
