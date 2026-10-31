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

function responseWithBodyLoss(status = 201): Response {
  return responseWithStatus(status, async () => {
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

  it('keeps a rejected upload terminal when its error body cannot be read', async () => {
    const form = new FormData();
    form.append('client_uuid', 'client-report-uuid');
    fetchMock.mockResolvedValueOnce(responseWithBodyLoss(422));

    const failure = await uploadMobileReport(form, 'secure-token').then(
      () => null,
      (error: unknown) => error,
    );

    expect(failure).not.toBeInstanceOf(ApiTransportError);
    expect(toSyncError(failure)).toMatchObject({
      code: 'API_VALIDATION_FAILED',
      retryable: false,
    });
  });

  it('keeps an unreadable server error retryable at its known status', async () => {
    fetchMock.mockResolvedValueOnce(responseWithBodyLoss(503));

    const failure = await apiRequest('/api/v2/mobile/reports').then(
      () => null,
      (error: unknown) => error,
    );

    expect(toSyncError(failure)).toMatchObject({
      code: 'SERVER_ERROR',
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

  it('retries an unreadable duplicate conflict until a readable identity confirms it', async () => {
    const form = new FormData();
    form.append('client_uuid', 'client-report-uuid');
    fetchMock
      .mockResolvedValueOnce(responseWithBodyLoss())
      .mockResolvedValueOnce(responseWithBodyLoss(409))
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

    const lost = await uploadMobileReport(form, 'secure-token').then(
      () => null,
      (error: unknown) => error,
    );
    expect(toSyncError(lost)).toMatchObject({
      code: 'NETWORK_REQUEST_FAILED',
      retryable: true,
    });

    const unreadableConflict = await uploadMobileReport(
      form,
      'secure-token',
    ).then(
      () => null,
      (error: unknown) => error,
    );
    expect(toSyncError(unreadableConflict)).toMatchObject({
      code: 'NETWORK_REQUEST_FAILED',
      retryable: true,
    });

    await expect(uploadMobileReport(form, 'secure-token')).resolves.toEqual({
      remoteId: 'server-report-uuid',
    });
  });

  it('retries an identity-less conflict response instead of stranding the report', async () => {
    const form = new FormData();
    form.append('client_uuid', 'client-report-uuid');
    fetchMock.mockResolvedValueOnce(
      responseWithStatus(409, async () =>
        JSON.stringify({ message: 'Already submitted' }),
      ),
    );

    const failure = await uploadMobileReport(form, 'secure-token').then(
      () => null,
      (error: unknown) => error,
    );

    expect(toSyncError(failure)).toMatchObject({
      code: 'NETWORK_REQUEST_FAILED',
      retryable: true,
    });
  });

  it('retries a report conflict identity that omits the client UUID until identity confirms', async () => {
    const form = new FormData();
    form.append('client_uuid', 'client-report-uuid');
    fetchMock
      .mockResolvedValueOnce(
        responseWithStatus(409, async () =>
          JSON.stringify({ data: { identity: { uuid: 'server-report-uuid' } } }),
        ),
      )
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

    const partialIdentity = await uploadMobileReport(form, 'secure-token').then(
      () => null,
      (error: unknown) => error,
    );
    expect(toSyncError(partialIdentity)).toMatchObject({
      code: 'NETWORK_REQUEST_FAILED',
      retryable: true,
    });

    await expect(uploadMobileReport(form, 'secure-token')).resolves.toEqual({
      remoteId: 'server-report-uuid',
    });
    expect(fetchMock.mock.calls[1]?.[1]?.body).toBe(form);
  });

  it('retries a completion conflict identity that omits the client UUID until identity confirms', async () => {
    const completionId = '9cc6a6a0-b20f-4ca8-bb7e-1a34cd191e0f';
    const record = {
      completion: { id: completionId },
    } as unknown as FieldValidationCompletionUploadRecord;
    const form = new FormData();
    form.append('client_uuid', completionId);
    fetchMock
      .mockResolvedValueOnce(
        responseWithStatus(409, async () =>
          JSON.stringify({ data: { completion: { uuid: 'server-completion-uuid' } } }),
        ),
      )
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

    const partialIdentity = await uploadMobileFieldValidationCompletion(
      record,
      'secure-token',
      form,
    ).then(
      () => null,
      (error: unknown) => error,
    );
    expect(toSyncError(partialIdentity)).toMatchObject({
      code: 'NETWORK_REQUEST_FAILED',
      retryable: true,
    });

    await expect(
      uploadMobileFieldValidationCompletion(record, 'secure-token', form),
    ).resolves.toEqual({ remoteId: 'server-completion-uuid' });
  });

  it('keeps a readable conflicting report identity terminal', async () => {
    const form = new FormData();
    form.append('client_uuid', 'client-report-uuid');
    fetchMock.mockResolvedValueOnce(
      responseWithStatus(409, async () =>
        JSON.stringify({
          data: {
            identity: {
              uuid: 'server-report-uuid',
              client_uuid: 'other-report-uuid',
            },
          },
        }),
      ),
    );

    const failure = await uploadMobileReport(form, 'secure-token').then(
      () => null,
      (error: unknown) => error,
    );

    expect(toSyncError(failure)).toMatchObject({
      code: 'API_VALIDATION_FAILED',
      retryable: false,
    });
  });

  it('retries an unreadable duplicate conflict for a completion until identity confirms', async () => {
    const completionId = '9cc6a6a0-b20f-4ca8-bb7e-1a34cd191e0f';
    const record = {
      completion: { id: completionId },
    } as unknown as FieldValidationCompletionUploadRecord;
    const form = new FormData();
    form.append('client_uuid', completionId);
    fetchMock
      .mockResolvedValueOnce(responseWithBodyLoss(409))
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

    const unreadableConflict = await uploadMobileFieldValidationCompletion(
      record,
      'secure-token',
      form,
    ).then(
      () => null,
      (error: unknown) => error,
    );
    expect(toSyncError(unreadableConflict)).toMatchObject({
      code: 'NETWORK_REQUEST_FAILED',
      retryable: true,
    });

    await expect(
      uploadMobileFieldValidationCompletion(record, 'secure-token', form),
    ).resolves.toEqual({ remoteId: 'server-completion-uuid' });
  });

  it('keeps a readable conflicting completion identity terminal', async () => {
    const completionId = '9cc6a6a0-b20f-4ca8-bb7e-1a34cd191e0f';
    const record = {
      completion: { id: completionId },
    } as unknown as FieldValidationCompletionUploadRecord;
    const form = new FormData();
    form.append('client_uuid', completionId);
    fetchMock.mockResolvedValueOnce(
      responseWithStatus(409, async () =>
        JSON.stringify({
          data: {
            completion: {
              uuid: 'server-completion-uuid',
              client_uuid: 'other-completion-uuid',
            },
          },
        }),
      ),
    );

    const failure = await uploadMobileFieldValidationCompletion(
      record,
      'secure-token',
      form,
    ).then(
      () => null,
      (error: unknown) => error,
    );

    expect(toSyncError(failure)).toMatchObject({
      code: 'API_VALIDATION_FAILED',
      retryable: false,
    });
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
