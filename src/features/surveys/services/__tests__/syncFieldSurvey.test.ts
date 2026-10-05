import { EMPTY_DATABASE } from '@/database/DatabaseProvider';
import { apiRequest } from '@/features/shared/api/apiClient';
import { syncFieldSurvey } from '@/features/surveys/services/syncFieldSurvey';

jest.mock('@/features/shared/api/apiClient', () => ({
  ApiHttpError: class ApiHttpError extends Error {},
  apiRequest: jest.fn(),
}));

describe('syncFieldSurvey authentication gate', () => {
  it('never sends local measurements without an authenticated access token', async () => {
    await expect(syncFieldSurvey({
      clientUuid: 'survey-client-1',
      database: EMPTY_DATABASE,
      ownerIdentity: 'owner-1',
      token: null,
    })).resolves.toEqual({ status: 'auth_required' });
    expect(apiRequest).not.toHaveBeenCalled();
  });
});
