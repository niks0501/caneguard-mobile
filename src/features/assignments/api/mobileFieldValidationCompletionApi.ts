import { ApiHttpError, apiRequest } from '@/features/shared/api/apiClient';
import type { FieldValidationCompletionUploadRecord } from '@/features/assignments/domain/fieldValidationCompletionTypes';
import { mapFieldValidationCompletionToMultipart } from '@/features/assignments/api/mobileFieldValidationCompletionMapper';

interface CompletionResponse {
  completion?: CompletionIdentity;
  data?: {
    completion?: CompletionIdentity;
  };
}

interface CompletionIdentity {
  client_uuid?: unknown;
  uuid?: unknown;
}

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
      const existingRemoteId = readRemoteId(error.body);
      const submittedClientUuid = readSubmittedClientUuid(form);
      const existingClientUuid = readClientUuid(error.body);
      if (
        existingRemoteId &&
        submittedClientUuid !== null &&
        existingClientUuid === submittedClientUuid
      ) {
        return { remoteId: existingRemoteId };
      }
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
  const body = value as CompletionResponse;
  return readString(body.completion?.uuid) ?? readString(body.data?.completion?.uuid);
}

function readClientUuid(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  const body = value as CompletionResponse;
  return (
    readString(body.completion?.client_uuid) ??
    readString(body.data?.completion?.client_uuid)
  );
}

function readSubmittedClientUuid(form: FormData): string | null {
  const value = form.get('client_uuid');
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}
