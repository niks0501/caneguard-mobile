import {
  mapAerialUploadToMultipart,
  uploadMobileAerialAnalysis,
} from '@/features/assignments/api/mobileAerialUploadApi';
import type { AerialAnalysisOutboxItem } from '@/features/assignments/data/aerialAnalysisOutboxRepository';
import { ApiHttpError, ApiTransportError, apiRequest } from '@/features/shared/api/apiClient';

jest.mock('@/features/shared/api/apiClient', () => {
  const actual = jest.requireActual('@/features/shared/api/apiClient');
  return {
    ...actual,
    apiRequest: jest.fn(),
  };
});

const UPLOAD_ID = '11111111-1111-4111-8111-111111111111';
const ASSIGNMENT_ID = '22222222-2222-4222-8222-222222222222';
const REPORT_UUID = '33333333-3333-4333-8333-333333333333';

function makeItem(overrides: Partial<AerialAnalysisOutboxItem> = {}): AerialAnalysisOutboxItem {
  return {
    id: UPLOAD_ID,
    ownerIdentity: '44444444-4444-4444-8444-444444444444',
    assignmentId: ASSIGNMENT_ID,
    reportUuid: REPORT_UUID,
    imageUri: 'file:///documents/caneguard/aerial-uploads/owner/photo.jpg',
    imageMimeType: 'image/jpeg',
    imageSizeBytes: 256_000,
    provenance: { basis: 'verified', verifiedAt: '2026-11-26T00:00:00.000Z' },
    syncStatus: 'pending',
    remoteId: null,
    syncAttemptCount: 0,
    lastSyncErrorCode: null,
    lastSyncAttemptAt: null,
    lastSyncedAt: null,
    createdAt: '2026-11-26T00:00:00.000Z',
    updatedAt: '2026-11-26T00:00:00.000Z',
    ...overrides,
  };
}

describe('mobileAerialUploadApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds multipart FormData for valid 20 MiB aerial images and rejects missing/oversized ones', () => {
    const fakeBlob = new Blob(['abc'], { type: 'image/jpeg' });
    const form = mapAerialUploadToMultipart(makeItem(), {
      imageExists: () => true,
      createImageFile: () => fakeBlob,
    });
    expect(form.get('client_uuid')).toBe(UPLOAD_ID);
    const uploadedFile = form.get('image') as File;
    expect(uploadedFile.size).toBe(3);
    expect(uploadedFile.type).toBe('image/jpeg');

    expect(() =>
      mapAerialUploadToMultipart(makeItem({ imageSizeBytes: 21 * 1024 * 1024 }), {
        imageExists: () => true,
        createImageFile: () => fakeBlob,
      }),
    ).toThrow(/size is invalid/i);

    expect(() =>
      mapAerialUploadToMultipart(makeItem(), {
        imageExists: () => false,
        createImageFile: () => fakeBlob,
      }),
    ).toThrow(/missing/i);
  });

  it('parses 201 upload receipt and updated aerial_check brief', async () => {
    jest.mocked(apiRequest).mockResolvedValueOnce({
      data: {
        analysis: {
          uuid: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          client_uuid: UPLOAD_ID,
          assignment_uuid: ASSIGNMENT_ID,
        },
        aerial_check: {
          uuid: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          enough_canopy: true,
          abnormal_canopy_percent: 23.5,
          canopy_coverage_percent: 84.0,
          model_version: 'aerial-v3',
          created_at: '2026-11-26T06:00:00.000Z',
          preview: { content_type: 'image/jpeg', bytes: 120_000 },
          overlay: { content_type: 'image/jpeg', bytes: 135_000 },
        },
      },
    });

    const form = new FormData();
    form.append('client_uuid', UPLOAD_ID);
    const result = await uploadMobileAerialAnalysis(makeItem(), 'tok-1', form);

    expect(apiRequest).toHaveBeenCalledWith(
      `/api/v1/mobile/assignments/${ASSIGNMENT_ID}/aerial-analyses`,
      expect.objectContaining({
        method: 'POST',
        token: 'tok-1',
        timeoutMs: 90_000,
      }),
    );
    expect(result.remoteId).toBe('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
    expect(result.hasAerialCheck).toBe(true);
    expect(result.aerialCheck?.abnormalCanopyPercent).toBe(23.5);
  });

  it('handles 200 intake replay receipt without requiring aerial_check', async () => {
    jest.mocked(apiRequest).mockResolvedValueOnce({
      replayed: true,
      data: {
        analysis: {
          uuid: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          client_uuid: UPLOAD_ID,
          assignment_uuid: ASSIGNMENT_ID,
        },
      },
    });

    const form = new FormData();
    form.append('client_uuid', UPLOAD_ID);
    const result = await uploadMobileAerialAnalysis(makeItem(), 'tok-1', form);

    expect(result).toEqual({
      remoteId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      aerialCheck: null,
      hasAerialCheck: false,
    });
  });

  it('rethrows 409 AERIAL_DISABLED so syncErrors classifies it as terminal refusal', async () => {
    jest.mocked(apiRequest).mockRejectedValueOnce(
      new ApiHttpError(409, 'Aerial disabled', { body: { code: 'AERIAL_DISABLED' } }),
    );
    const form = new FormData();
    form.append('client_uuid', UPLOAD_ID);

    await expect(uploadMobileAerialAnalysis(makeItem(), 'tok-1', form)).rejects.toMatchObject({
      status: 409,
    });
  });

  it('throws ApiTransportError if 201 omits analysis.uuid', async () => {
    jest.mocked(apiRequest).mockResolvedValueOnce({ data: {} });
    const form = new FormData();
    form.append('client_uuid', UPLOAD_ID);

    await expect(uploadMobileAerialAnalysis(makeItem(), 'tok-1', form)).rejects.toBeInstanceOf(
      ApiTransportError,
    );
  });
});
