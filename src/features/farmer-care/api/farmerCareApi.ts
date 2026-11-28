import { File } from 'expo-file-system';

import { FARMER_AI_LABELS, type FarmerInquiryReply } from '@/features/farmer-care/domain/farmerCareTypes';
import type { FarmerAdvisoryItem } from '@/features/farmer-care/data/farmerCareRepository';
import { ApiTransportError, apiRequest } from '@/features/shared/api/apiClient';

export interface RemoteFarmerInquiry {
  remoteId: string;
  clientUuid: string | null;
  status: string;
  replies: FarmerInquiryReply[];
}

export interface FarmerInquirySubmission {
  clientUuid: string;
  barangay: string;
  landmark: string | null;
  concern: string | null;
  scanChainId: string;
  aiLabel: string | null;
  aiConfidencePercent: number | null;
  image: { uri: string; mimeType: string };
}

export function buildFarmerInquiryForm(
  submission: FarmerInquirySubmission,
  createImageFile: (uri: string) => Blob = (uri) => new File(uri) as unknown as Blob,
): FormData {
  const form = new FormData();
  form.append('client_uuid', submission.clientUuid);
  form.append('scan_chain_uuid', submission.scanChainId);
  form.append('barangay', submission.barangay);
  if (submission.landmark) form.append('landmark', submission.landmark);
  if (submission.concern) form.append('concern', submission.concern);
  if (submission.aiLabel && (FARMER_AI_LABELS as readonly string[]).includes(submission.aiLabel)) {
    form.append('ai_label', submission.aiLabel);
    if (submission.aiConfidencePercent !== null) {
      form.append('ai_confidence_percent', String(submission.aiConfidencePercent));
    }
  }
  form.append('photos[]', createImageFile(submission.image.uri));
  return form;
}

export async function submitFarmerInquiry(
  submission: FarmerInquirySubmission,
  token: string,
  form: FormData = buildFarmerInquiryForm(submission),
): Promise<RemoteFarmerInquiry> {
  const response = await apiRequest<unknown>('/api/v1/mobile/farmer/inquiries', {
    method: 'POST',
    body: form,
    token,
    timeoutMs: 90_000,
  });
  const parsed = parseInquiry(readData(response));
  if (!parsed) {
    throw new ApiTransportError('The request response did not include the request.');
  }
  return parsed;
}

export async function fetchFarmerInquiries(token: string): Promise<RemoteFarmerInquiry[]> {
  const response = await apiRequest<unknown>('/api/v1/mobile/farmer/inquiries', { token });
  const data = readData(response);
  if (!Array.isArray(data)) {
    throw new ApiTransportError('The requests response was not a list.');
  }
  return data.map(parseInquiry).filter((item): item is RemoteFarmerInquiry => item !== null);
}

export async function fetchFarmerInquiry(uuid: string, token: string): Promise<RemoteFarmerInquiry> {
  const response = await apiRequest<unknown>(`/api/v1/mobile/farmer/inquiries/${encodeURIComponent(uuid)}`, { token });
  const inquiry = parseInquiry(readData(response));
  if (!inquiry || inquiry.remoteId !== uuid) {
    throw new ApiTransportError('The request response did not match the requested inquiry.');
  }
  return inquiry;
}

export interface FarmerAdvisoriesResult {
  items: FarmerAdvisoryItem[];
  /** The home barangay the office holds for this farmer, so a phone with none set can adopt it. */
  homeBarangay?: string | null;
}

export async function fetchFarmerAdvisories(token: string): Promise<FarmerAdvisoriesResult> {
  const response = await apiRequest<unknown>('/api/v1/mobile/farmer/advisories', { token });
  const data = readData(response);
  if (!Array.isArray(data)) {
    throw new ApiTransportError('The guidance response was not a list.');
  }
  const items: FarmerAdvisoryItem[] = [];
  for (const raw of data) {
    if (!raw || typeof raw !== 'object') continue;
    const row = raw as Record<string, unknown>;
    const item = {
      remoteId: str(row.uuid),
      headlineTl: str(row.headline_tl),
      headlineEn: str(row.headline_en),
      bodyTl: str(row.body_tl),
      bodyEn: str(row.body_en),
      publishedAt: str(row.published_at),
      expiresAt: str(row.expires_at),
    };
    if (Object.values(item).every((value) => value !== '')) items.push(item);
  }
  const home = response && typeof response === 'object' ? (response as { home_barangay?: unknown }).home_barangay : undefined;
  const homeBarangay = typeof home === 'string' && home.trim() ? home.trim() : home === null ? null : undefined;
  return { items, homeBarangay };
}

export async function updateFarmerProfile(
  patch: { barangay?: string | null; preferredLanguage?: 'tl' | 'en' | null },
  token: string,
): Promise<void> {
  await apiRequest<unknown>('/api/v1/mobile/farmer/profile', {
    method: 'PATCH',
    token,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      ...('barangay' in patch ? { barangay: patch.barangay } : {}),
      ...('preferredLanguage' in patch ? { preferred_language: patch.preferredLanguage } : {}),
    }),
  });
}

/** The server's own uuid of an already-open request, from a 409 INQUIRY_ALREADY_OPEN body. */
export function readOpenInquiryUuid(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const row = body as Record<string, unknown>;
  return row.code === 'INQUIRY_ALREADY_OPEN' && typeof row.inquiry_uuid === 'string' ? row.inquiry_uuid : null;
}

function readData(response: unknown): unknown {
  return response && typeof response === 'object' && 'data' in response
    ? (response as { data: unknown }).data
    : undefined;
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function parseInquiry(raw: unknown): RemoteFarmerInquiry | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const remoteId = str(row.uuid);
  const status = str(row.status);
  if (!remoteId || !['new', 'reviewing', 'replied'].includes(status)) return null;
  const replies = Array.isArray(row.replies)
    ? row.replies.flatMap((reply): FarmerInquiryReply[] => {
        if (!reply || typeof reply !== 'object') return [];
        const value = reply as Record<string, unknown>;
        const id = str(value.uuid);
        const body = str(value.body);
        if (!id || !body) return [];
        return [
          {
            id,
            kind: value.kind === 'advice' ? 'advice' : 'note',
            body,
            advisoryTitle: typeof value.advisory_title === 'string' ? value.advisory_title : null,
            createdAt: typeof value.created_at === 'string' ? value.created_at : null,
          },
        ];
      })
    : [];
  return { remoteId, clientUuid: str(row.client_uuid) || null, status, replies };
}
