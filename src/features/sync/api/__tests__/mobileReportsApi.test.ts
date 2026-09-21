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

  it('treats a duplicate stable identity with a matching client UUID as idempotent success', async () => {
    const form = new FormData();
    form.append('client_uuid', 'client-report-uuid');
    jest.mocked(apiRequest).mockRejectedValueOnce(
      new ApiHttpError(409, 'Already submitted', {
        body: {
          data: {
            identity: {
              uuid: 'existing-server-report-uuid',
              client_uuid: 'client-report-uuid',
            },
          },
        },
      }),
    );
    await expect(uploadMobileReport(form, 'secure-token')).resolves.toEqual({
      remoteId: 'existing-server-report-uuid',
    });
  });

  it.each([
    ['a mismatched client UUID', { client_uuid: 'other-report-uuid' }],
    ['a missing client UUID', {}],
  ])('does not hide a conflict with %s', async (_description, identity) => {
    const form = new FormData();
    form.append('client_uuid', 'client-report-uuid');
    const conflict = new ApiHttpError(409, 'Conflict', {
      body: {
        data: {
          identity: {
            uuid: 'existing-server-report-uuid',
            ...identity,
          },
        },
      },
    });
    jest.mocked(apiRequest).mockRejectedValueOnce(conflict);
    await expect(uploadMobileReport(form, 'secure-token')).rejects.toBe(conflict);
  });
});
