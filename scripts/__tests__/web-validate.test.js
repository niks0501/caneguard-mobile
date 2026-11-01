/* global afterAll, beforeAll, describe, expect, it, jest */

import { loginMobile } from '@/features/auth/api/mobileAuthApi';
import { fetchAllMobileFieldValidationAssignments } from '@/features/assignments/api/mobileFieldValidationAssignmentsApi';
import { fetchAllMobileNotifications } from '@/features/notifications/api/mobileNotificationsApi';

const {
  DEFAULT_STUB_API_HOST,
  startStubServer,
} = require('../../validation/stub-api/server');
const {
  FAKE_ACCOUNT,
  FAKE_PASSWORD,
  FAKE_TOKEN,
  addDays,
  buildAssignments,
  resolveTodayKey,
} = require('../../validation/stub-api/fixtures');
const { buildWebValidationEnv, main } = require('../web-validate');

/**
 * Jest's React Native environment installs Expo's native fetch, which has no
 * transport here. The stub is real HTTP, so route the app's fetch through Node
 * for this suite only, with the small Response surface the API client reads.
 */
function createNodeFetch(nodeHttp) {
  return function nodeFetch(url, init = {}) {
    return new Promise((resolve, reject) => {
      const headers = {};
      if (typeof init.headers?.forEach === 'function') {
        init.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (init.headers) {
        Object.assign(headers, init.headers);
      }

      const request = nodeHttp.request(
        url,
        { headers, method: init.method ?? 'GET', signal: init.signal },
        (response) => {
          const chunks = [];
          response.on('data', (chunk) => chunks.push(chunk));
          response.on('end', () => {
            const body = Buffer.concat(chunks).toString('utf8');
            const byName = new Map(
              Object.entries(response.headers).map(([key, value]) => [
                key.toLowerCase(),
                Array.isArray(value) ? value.join(', ') : String(value ?? ''),
              ]),
            );
            resolve({
              headers: { get: (name) => byName.get(String(name).toLowerCase()) ?? null },
              json: async () => (body ? JSON.parse(body) : null),
              ok: response.statusCode >= 200 && response.statusCode < 300,
              status: response.statusCode,
              text: async () => body,
            });
          });
        },
      );

      request.on('error', reject);
      request.setTimeout(5_000, () => request.destroy(new Error('The stub request timed out.')));
      if (init.body) {
        request.write(init.body);
      }
      request.end();
    });
  };
}

jest.mock('@/config/env', () => ({
  get apiBaseUrl() {
    return globalThis.__webValidationBaseUrl;
  },
}));

const TODAY = '2026-11-01';

describe('buildWebValidationEnv', () => {
  it('pins the stub API and the validation flag', () => {
    const env = buildWebValidationEnv({
      apiBaseUrl: 'http://127.0.0.1:8210',
      baseEnv: { EXPO_PUBLIC_API_BASE_URL: 'https://api.example.test' },
      today: TODAY,
    });

    expect(env.EXPO_PUBLIC_WEB_VALIDATION).toBe('1');
    expect(env.EXPO_PUBLIC_API_BASE_URL).toBe('http://127.0.0.1:8210');
    expect(env.CANEGUARD_WEB_VALIDATE_TODAY).toBe(TODAY);
  });
});

describe('resolveTodayKey', () => {
  it('uses the pinned date and rejects a malformed one', () => {
    expect(resolveTodayKey({ CANEGUARD_WEB_VALIDATE_TODAY: TODAY })).toBe(TODAY);
    expect(() =>
      resolveTodayKey({ CANEGUARD_WEB_VALIDATE_TODAY: '11/01/2026' }),
    ).toThrow(/YYYY-MM-DD/);
  });

  it('rejects a date that does not exist on the calendar', () => {
    expect(() =>
      resolveTodayKey({ CANEGUARD_WEB_VALIDATE_TODAY: '2026-02-31' }),
    ).toThrow(/YYYY-MM-DD/);
    expect(() =>
      resolveTodayKey({ CANEGUARD_WEB_VALIDATE_TODAY: '2026-02-29' }),
    ).toThrow(/YYYY-MM-DD/);
    expect(
      resolveTodayKey({ CANEGUARD_WEB_VALIDATE_TODAY: '2028-02-29' }),
    ).toBe('2028-02-29');
  });
});

describe('fixture date window', () => {
  const earliestToday = '1970-01-10';

  it('rejects pinned dates outside the practical window', () => {
    for (const key of ['1970-01-09', '1969-12-31', '0001-01-01', '0000-01-01']) {
      expect(() =>
        resolveTodayKey({ CANEGUARD_WEB_VALIDATE_TODAY: key }),
      ).toThrow(/YYYY-MM-DD/);
    }
    expect(
      resolveTodayKey({ CANEGUARD_WEB_VALIDATE_TODAY: earliestToday }),
    ).toBe(earliestToday);
    expect(
      resolveTodayKey({ CANEGUARD_WEB_VALIDATE_TODAY: '9999-12-31' }),
    ).toBe('9999-12-31');
  });

  it('keeps derived dates inside the window at its floor', () => {
    const visits = buildAssignments({ today: earliestToday });
    const derived = visits.flatMap((visit) => [
      visit.target_visit_date,
      visit.assigned_at.slice(0, 10),
      visit.case.captured_at.slice(0, 10),
    ]);

    for (const dateKey of derived) {
      expect(dateKey >= '1970-01-01').toBe(true);
    }
    expect(derived).toContain('1970-01-01');
  });
});

describe('fixture date arithmetic', () => {
  it('keeps years before 0100 when adding days', () => {
    expect(addDays('0001-01-01', -2)).toBe('0000-12-30');
    expect(addDays('0099-01-01', -1)).toBe('0098-12-31');
  });
});

describe('main', () => {
  it('reports a malformed pinned date in one line and exits with code 2', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();

    await expect(
      main({ CANEGUARD_WEB_VALIDATE_TODAY: '11/01/2026' }),
    ).resolves.toBe(2);
    expect(consoleError).toHaveBeenCalledWith(
      '[web:validate] CANEGUARD_WEB_VALIDATE_TODAY must be a YYYY-MM-DD date.',
    );

    consoleError.mockRestore();
  });
});

describe('browser validation stub API', () => {
  let stub;

  const originalFetch = globalThis.fetch;

  beforeAll(async () => {
    stub = await startStubServer({ host: DEFAULT_STUB_API_HOST, port: 0, today: TODAY });
    globalThis.__webValidationBaseUrl = stub.baseUrl;
    globalThis.fetch = createNodeFetch(require('node:http'));
  });

  afterAll(async () => {
    globalThis.fetch = originalFetch;
    await stub.close();
    delete globalThis.__webValidationBaseUrl;
  });

  it('seeds one visit due today and one overdue', () => {
    const visits = buildAssignments({ today: TODAY });

    expect(visits.map((visit) => visit.reference_code)).toEqual([
      'CG-LAB-0002',
      'CG-LAB-0001',
    ]);
    expect(visits.map((visit) => visit.target_visit_date)).toEqual([
      '2026-10-30',
      TODAY,
    ]);
  });

  it('signs in the fake account through the app auth client', async () => {
    const session = await loginMobile({
      deviceName: 'web validation',
      email: FAKE_ACCOUNT.email,
      password: FAKE_PASSWORD,
    });

    expect(session.token).toBe(FAKE_TOKEN);
    expect(session.user).toEqual(FAKE_ACCOUNT);
  });

  it('rejects a wrong password with the app error code', async () => {
    await expect(
      loginMobile({
        deviceName: 'web validation',
        email: FAKE_ACCOUNT.email,
        password: 'not-the-password',
      }),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
  });

  it('serves the seeded visits through the app assignment parser', async () => {
    const result = await fetchAllMobileFieldValidationAssignments({
      token: FAKE_TOKEN,
    });

    expect(result.syncBefore).toBe(stub.syncBefore);
    expect(result.assignments).toHaveLength(2);
    expect(
      result.assignments.map((assignment) => ({
        referenceCode: assignment.referenceCode,
        state: assignment.fieldValidationState,
        targetVisitDate: assignment.targetVisitDate,
      })),
    ).toEqual([
      {
        referenceCode: 'CG-LAB-0002',
        state: 'assigned',
        targetVisitDate: '2026-10-30',
      },
      {
        referenceCode: 'CG-LAB-0001',
        state: 'assigned',
        targetVisitDate: TODAY,
      },
    ]);
  });

  it('serves an empty notification feed the app can parse', async () => {
    const result = await fetchAllMobileNotifications({ token: FAKE_TOKEN });

    expect(result.notifications).toEqual([]);
    expect(result.partial).toBe(false);
  });

  it('refuses a feed request without the fake session', async () => {
    await expect(
      fetchAllMobileFieldValidationAssignments({ token: 'wrong-token' }),
    ).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
  });

  it('answers an unseeded GET with a well-formed empty page', async () => {
    const response = await fetch(`${stub.baseUrl}/api/v1/reference/locations`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual([]);
    expect(body.links).toEqual({ next: null });
    expect(body.sync.before).toBe(stub.syncBefore);
  });

  it('keeps the auth client error typed for an unknown non-GET', async () => {
    const response = await fetch(`${stub.baseUrl}/api/v1/mobile/auth/login`, {
      method: 'PUT',
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ code: 'NOT_FOUND' });
  });
});
