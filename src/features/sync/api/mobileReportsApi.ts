import { ApiHttpError, apiRequest } from '@/features/shared/api/apiClient';

interface MobileReportResponse {
  data?: {
    identity?: MobileReportIdentity;
  };
  identity?: MobileReportIdentity;
}

interface MobileReportIdentity {
  client_uuid?: unknown;
  uuid?: unknown;
}

export async function uploadMobileReport(
  form: FormData,
  token: string,
): Promise<{ remoteId: string }> {
  let response: MobileReportResponse;
  try {
    response = await apiRequest<MobileReportResponse>(
      '/api/v2/mobile/reports',
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
    throw new Error('The mobile report response did not include identity.uuid.');
  }
  return { remoteId };
}

function readRemoteId(response: unknown): string | null {
  if (!response || typeof response !== 'object') {
    return null;
  }
  const body = response as MobileReportResponse;
  return readString(body.identity?.uuid) ?? readString(body.data?.identity?.uuid);
}

function readClientUuid(response: unknown): string | null {
  if (!response || typeof response !== 'object') {
    return null;
  }
  const body = response as MobileReportResponse;
  return (
    readString(body.identity?.client_uuid) ??
    readString(body.data?.identity?.client_uuid)
  );
}

function readSubmittedClientUuid(form: FormData): string | null {
  const value = form.get('client_uuid');
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}
