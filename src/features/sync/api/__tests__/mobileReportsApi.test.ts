import { uploadMobileReport } from '@/features/sync/api/mobileReportsApi';
import { ApiHttpError, apiRequest } from '@/features/shared/api/apiClient';

jest.mock('@/features/shared/api/apiClient', () => {
  const actual = jest.requireActual('@/features/shared/api/apiClient');
  return { ...actual, apiRequest: jest.fn() };
});

describe('mobile Field Report API', () => {
  it('returns the server identity from a successful upload', async () => {
    jest.mocked(apiRequest).mockResolvedValueOnce({
      data: { identity: { uuid: 'server-report-uuid' } },
    });
    await expect(uploadMobileReport(new FormData(), 'secure-token')).resolves.toEqual({
      remoteId: 'server-report-uuid',
    });
    expect(apiRequest).toHaveBeenCalledWith(
      '/api/v2/mobile/reports',
      expect.objectContaining({ token: 'secure-token' }),
    );
  });

  it('treats a duplicate stable identity with an existing server UUID as idempotent success', async () => {
    jest.mocked(apiRequest).mockRejectedValueOnce(
      new ApiHttpError(409, 'Already submitted', {
        body: { identity: { uuid: 'existing-server-report-uuid' } },
      }),
    );
    await expect(uploadMobileReport(new FormData(), 'secure-token')).resolves.toEqual({
      remoteId: 'existing-server-report-uuid',
    });
  });

  it('does not hide a conflict that lacks an existing server identity', async () => {
    const conflict = new ApiHttpError(409, 'Conflict');
    jest.mocked(apiRequest).mockRejectedValueOnce(conflict);
    await expect(uploadMobileReport(new FormData(), 'secure-token')).rejects.toBe(conflict);
  });
});
