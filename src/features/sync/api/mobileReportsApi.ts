import { apiRequest } from '@/features/shared/api/apiClient';

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
  const response = await apiRequest<MobileReportResponse>(
    '/api/v1/mobile/reports',
    {
      method: 'POST',
      body: form,
      token,
      timeoutMs: 60_000,
    },
  );
  const remoteId = response?.identity?.uuid ?? response?.data?.identity?.uuid;

  if (!remoteId) {
    throw new Error('The mobile report response did not include identity.uuid.');
  }
  return { remoteId };
}
