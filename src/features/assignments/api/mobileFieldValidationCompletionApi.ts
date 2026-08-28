import { ApiHttpError, apiRequest } from '@/features/shared/api/apiClient';
import type { FieldValidationCompletionUploadRecord } from '@/features/assignments/domain/fieldValidationCompletionTypes';
import { mapFieldValidationCompletionToMultipart } from '@/features/assignments/api/mobileFieldValidationCompletionMapper';

export async function uploadMobileFieldValidationCompletion(
  record: FieldValidationCompletionUploadRecord,
  token: string,
  form: FormData = mapFieldValidationCompletionToMultipart(record),
): Promise<{ remoteId: string }> {
  let response: unknown;
  try {
    response = await apiRequest<unknown>(
      `/api/v1/mobile/assignments/${record.completion.assignmentId}/completion`,
      {
        method: 'POST',
        body: form,
        token,
        timeoutMs: 60_000,
      },
    );
  } catch (error: unknown) {
    if (error instanceof ApiHttpError && error.status === 409) {
      throw error;
    }
    throw error;
  }

  const remoteId = readRemoteId(response);
  if (!remoteId) {
    throw new Error('The field validation completion response did not include completion.uuid.');
  }
  return { remoteId };
}

function readRemoteId(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  const body = value as {
    data?: { completion?: { uuid?: unknown } };
  };
  const uuid = body.data?.completion?.uuid;
  return typeof uuid === 'string' && uuid.trim() ? uuid : null;
}
