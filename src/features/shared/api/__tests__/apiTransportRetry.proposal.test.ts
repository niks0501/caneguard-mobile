// Supplemental worker proposal: not promoted to an acceptance/proof test.
import { uploadMobileFieldValidationCompletion } from '@/features/assignments/api/mobileFieldValidationCompletionApi';
import type { FieldValidationCompletionUploadRecord } from '@/features/assignments/domain/fieldValidationCompletionTypes';
import { loginMobile } from '@/features/auth/api/mobileAuthApi';
import {
  ApiTransportError,
  apiRequest,
} from '@/features/shared/api/apiClient';
import { uploadMobileReport } from '@/features/sync/api/mobileReportsApi';
import { toSyncError } from '@/features/sync/errors/syncErrors';

const fetchMock = jest.fn();

function responseWithStatus(
  status: number,
  readBody: () => Promise<string>,
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    text: jest.fn(readBody),
  } as unknown as Response;
}

function responseWithBodyLoss(): Response {
  return responseWithStatus(201, async () => {
    throw new Error('The network connection was lost.');
  });
}

describe('response transport retry classification (proposal)', () => {
  beforeEach(() => {
    global.fetch = fetchMock as unknown as typeof fetch;
    fetchMock.mockReset();
  });

  it('reports a lost response body as a retryable transport failure', async () => {
    fetchMock.mockResolvedValueOnce(responseWithBodyLoss());

    const failure = await apiRequest('/api/v2/mobile/reports', {
      method: 'POST',
    }).then(
      () => null,
      (error: unknown) => error,
    );

    expect(failure).toBeInstanceOf(ApiTransportError);
    expect(toSyncError(failure)).toMatchObject({
      code: 'NETWORK_REQUEST_FAILED',
      retryable: true,
    });
  });

  it('retries an accepted field report whose body was truncated and lets server dedup confirm it', async () => {
    const form = new FormData();
    form.append('client_uuid', 'client-report-uuid');
    fetchMock
      .mockResolvedValueOnce(responseWithStatus(201, async () => '{"data":{"identity":{"uu'))
      .mockResolvedValueOnce(
        responseWithStatus(409, async () =>
          JSON.stringify({
            data: {
              identity: {
                uuid: 'server-report-uuid',
                client_uuid: 'client-report-uuid',
              },
            },
          }),
        ),
      );

    const firstAttempt = await uploadMobileReport(form, 'secure-token').then(
      () => null,
      (error: unknown) => error,
    );
    expect(toSyncError(firstAttempt)).toMatchObject({
      code: 'NETWORK_REQUEST_FAILED',
      retryable: true,
    });

    await expect(uploadMobileReport(form, 'secure-token')).resolves.toEqual({
      remoteId: 'server-report-uuid',
    });
    expect(fetchMock.mock.calls[1]?.[1]?.body).toBe(form);
    expect(form.get('client_uuid')).toBe('client-report-uuid');
  });

  it('retries an accepted completion whose body was truncated and lets server dedup confirm it', async () => {
    const completionId = '9cc6a6a0-b20f-4ca8-bb7e-1a34cd191e0f';
    const record = {
      completion: { id: completionId },
    } as unknown as FieldValidationCompletionUploadRecord;
    const form = new FormData();
    form.append('client_uuid', completionId);
    fetchMock
      .mockResolvedValueOnce(responseWithStatus(201, async () => '{"data":{"completion":'))
      .mockResolvedValueOnce(
        responseWithStatus(409, async () =>
          JSON.stringify({
            data: {
              completion: {
                uuid: 'server-completion-uuid',
                client_uuid: completionId,
              },
            },
          }),
        ),
      );

    const firstAttempt = await uploadMobileFieldValidationCompletion(
      record,
      'secure-token',
      form,
    ).then(
      () => null,
      (error: unknown) => error,
    );
    expect(toSyncError(firstAttempt)).toMatchObject({
      code: 'NETWORK_REQUEST_FAILED',
      retryable: true,
    });

    await expect(
      uploadMobileFieldValidationCompletion(record, 'secure-token', form),
    ).resolves.toEqual({ remoteId: 'server-completion-uuid' });
  });

  it('keeps an offline sign-in recoverable instead of an incomplete-response failure', async () => {
    fetchMock.mockResolvedValueOnce(responseWithBodyLoss());

    await expect(
      loginMobile({
        deviceId: 'installation-uuid',
        email: 'field@caneguard.test',
        password: 'entered-password',
        deviceName: 'Android test phone',
      }),
    ).rejects.toMatchObject({ code: 'SERVER_UNAVAILABLE' });
  });
});
