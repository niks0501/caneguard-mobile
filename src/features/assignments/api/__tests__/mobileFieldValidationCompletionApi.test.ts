import { uploadMobileFieldValidationCompletion } from '@/features/assignments/api/mobileFieldValidationCompletionApi';
import type { FieldValidationCompletionUploadRecord } from '@/features/assignments/domain/fieldValidationCompletionTypes';
import { ApiHttpError, apiRequest } from '@/features/shared/api/apiClient';

jest.mock('@/features/shared/api/apiClient', () => {
  const actual = jest.requireActual('@/features/shared/api/apiClient');
  return { ...actual, apiRequest: jest.fn() };
});

const COMPLETION_ID = '9cc6a6a0-b20f-4ca8-bb7e-1a34cd191e0f';
const RECORD = {
  completion: { id: COMPLETION_ID },
} as unknown as FieldValidationCompletionUploadRecord;

function formWithClientUuid(clientUuid: string): FormData {
  const form = new FormData();
  form.append('client_uuid', clientUuid);
  return form;
}

describe('mobile field validation completion API', () => {
  it('treats a recorded server-side completion with a matching client UUID as idempotent success', async () => {
    jest.mocked(apiRequest).mockRejectedValueOnce(
      new ApiHttpError(409, 'Already completed', {
        body: {
          data: {
            completion: {
              uuid: 'server-completion-uuid',
              client_uuid: COMPLETION_ID,
            },
          },
        },
      }),
    );

    await expect(
      uploadMobileFieldValidationCompletion(
        RECORD,
        'secure-token',
        formWithClientUuid(COMPLETION_ID),
      ),
    ).resolves.toEqual({ remoteId: 'server-completion-uuid' });
  });

  it.each([
    ['a mismatched client UUID', { client_uuid: 'other-completion-uuid' }],
    ['a missing client UUID', {}],
  ])('does not hide a conflict with %s', async (_description, completion) => {
    const conflict = new ApiHttpError(409, 'Conflict', {
      body: {
        data: {
          completion: {
            uuid: 'server-completion-uuid',
            ...completion,
          },
        },
      },
    });
    jest.mocked(apiRequest).mockRejectedValueOnce(conflict);

    await expect(
      uploadMobileFieldValidationCompletion(
        RECORD,
        'secure-token',
        formWithClientUuid(COMPLETION_ID),
      ),
    ).rejects.toBe(conflict);
  });
});
