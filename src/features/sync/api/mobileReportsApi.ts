import { ApiHttpError, apiRequest } from '@/features/shared/api/apiClient';

interface MobileReportResponse {
  data?: {
    identity?: {
      uuid?: string;
    };
  };
  identity?: {
    uuid?: string;
  };
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
      if (existingRemoteId) {
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
  return body.identity?.uuid ?? body.data?.identity?.uuid ?? null;
}
