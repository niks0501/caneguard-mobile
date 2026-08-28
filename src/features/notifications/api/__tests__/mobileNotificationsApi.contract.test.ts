import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { MOBILE_NOTIFICATIONS_V1_FIXTURE } from '@/features/notifications/api/__fixtures__/mobileNotificationsV1';
import { fetchAllMobileNotifications } from '@/features/notifications/api/mobileNotificationsApi';
import { apiRequest } from '@/features/shared/api/apiClient';

jest.mock('@/features/shared/api/apiClient', () => ({
  apiRequest: jest.fn(),
}));

const request = jest.mocked(apiRequest);

describe('mobile-notifications-v1 producer contract', () => {
  it('evaluates the mobile parser against the web-owned artifact', async () => {
    const artifact = JSON.parse(
      readFileSync(
        join(process.cwd(), 'references/mobile-notifications-v1.json'),
        'utf8',
      ),
    ) as {
      contract: string;
      version: number;
      wire: { method: string; path: string };
      fields: Record<string, unknown>;
    };
    request.mockResolvedValueOnce(MOBILE_NOTIFICATIONS_V1_FIXTURE);

    expect(artifact.contract).toBe('mobile-notifications-v1');
    expect(artifact.version).toBe(1);
    expect(artifact.wire).toMatchObject({
      method: 'GET',
      path: '/api/v1/mobile/notifications',
    });
    expect(Object.keys(MOBILE_NOTIFICATIONS_V1_FIXTURE.data[0])).toEqual(
      Object.keys(artifact.fields),
    );

    await expect(fetchAllMobileNotifications({ token: 'contract-token' })).resolves.toMatchObject({
      notifications: [expect.objectContaining({
        id: MOBILE_NOTIFICATIONS_V1_FIXTURE.data[0].id,
        eventType: MOBILE_NOTIFICATIONS_V1_FIXTURE.data[0].event_type,
      })],
    });
  });
});
