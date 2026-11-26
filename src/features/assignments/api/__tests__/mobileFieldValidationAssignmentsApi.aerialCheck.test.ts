import {
  buildMobileAerialOverlayPath,
  buildMobileAerialOverlayUrl,
  buildMobileAerialPreviewPath,
  buildMobileAerialPreviewUrl,
  fetchAllMobileFieldValidationAssignments,
} from '@/features/assignments/api/mobileFieldValidationAssignmentsApi';
import { MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE } from '@/features/assignments/api/__fixtures__/mobileFieldValidationAssignmentsV1';

const mockApiRequest = jest.fn();

jest.mock('@/config/env', () => ({ apiBaseUrl: 'http://127.0.0.1:8000' }));
jest.mock('@/features/shared/api/apiClient', () => ({
  ApiHttpError: class ApiHttpError extends Error {
    status: number;
    body: unknown;
    constructor(status: number, body: unknown) {
      super(`HTTP ${status}`);
      this.status = status;
      this.body = body;
    }
  },
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
  buildApiUrl: (path: string) => `http://127.0.0.1:8000${path}`,
}));

const BASE_ROW = MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE.data[0];
const AERIAL_UUID = '0195b3c4-7f10-7000-8000-000000000010';

function page(data: unknown[]) {
  return {
    data,
    links: { next: null },
    meta: { per_page: 100 },
    sync: {
      before: '2026-11-26T06:00:00.000Z',
      version: 'v-aerial-1',
      total: data.length,
      truncated: false,
      unchanged: false,
    },
  };
}

describe('mobileFieldValidationAssignmentsApi aerial_check parsing', () => {
  beforeEach(() => {
    mockApiRequest.mockReset();
  });

  it('parses an active aerial_check summary and ignores server-supplied urls', async () => {
    mockApiRequest.mockResolvedValueOnce(
      page([
        {
          ...BASE_ROW,
          aerial_check: {
            uuid: AERIAL_UUID,
            enough_canopy: true,
            abnormal_canopy_percent: 19.4,
            canopy_coverage_percent: 81.2,
            model_version: 'aerial-v3',
            created_at: '2026-11-26T04:15:00.000Z',
            preview: { url: 'https://evil.example/a', content_type: 'image/jpeg', bytes: 190_000 },
            overlay: { url: 'https://evil.example/b', content_type: 'image/jpeg', bytes: 210_000 },
          },
        },
      ]),
    );

    const { assignments } = await fetchAllMobileFieldValidationAssignments({ token: 'tok' });
    expect(assignments[0].aerialCheck).toEqual({
      uuid: AERIAL_UUID,
      enoughCanopy: true,
      abnormalCanopyPercent: 19.4,
      canopyCoveragePercent: 81.2,
      modelVersion: 'aerial-v3',
      createdAt: '2026-11-26T04:15:00.000Z',
      preview: { contentType: 'image/jpeg', bytes: 190_000 },
      overlay: { contentType: 'image/jpeg', bytes: 210_000 },
    });
  });

  it('accepts low-canopy aerial_check with null abnormal_canopy_percent and absent aerial_check', async () => {
    mockApiRequest.mockResolvedValueOnce(
      page([
        {
          ...BASE_ROW,
          aerial_check: {
            uuid: AERIAL_UUID,
            enough_canopy: false,
            abnormal_canopy_percent: null,
            canopy_coverage_percent: 5.5,
            model_version: 'aerial-v3',
            created_at: '2026-11-26T04:15:00.000Z',
            preview: { url: '/ignored', content_type: 'image/jpeg', bytes: 120_000 },
            overlay: { url: '/ignored', content_type: 'image/jpeg', bytes: 121_000 },
          },
        },
      ]),
    );
    const low = await fetchAllMobileFieldValidationAssignments({ token: 'tok' });
    expect(low.assignments[0].aerialCheck?.enoughCanopy).toBe(false);
    expect(low.assignments[0].aerialCheck?.abnormalCanopyPercent).toBeNull();

    mockApiRequest.mockResolvedValueOnce(page([BASE_ROW]));
    const absent = await fetchAllMobileFieldValidationAssignments({ token: 'tok' });
    expect(absent.assignments[0].aerialCheck).toBeNull();
  });

  it('rejects malformed aerial_check payloads', async () => {
    mockApiRequest.mockResolvedValueOnce(
      page([
        {
          ...BASE_ROW,
          aerial_check: {
            uuid: 'not-a-uuid',
            enough_canopy: true,
            abnormal_canopy_percent: 10,
            canopy_coverage_percent: 70,
            model_version: 'aerial-v3',
            created_at: '2026-11-26T04:15:00.000Z',
            preview: { content_type: 'image/jpeg', bytes: 10 },
            overlay: { content_type: 'image/jpeg', bytes: 10 },
          },
        },
      ]),
    );
    await expect(fetchAllMobileFieldValidationAssignments({ token: 'tok' })).rejects.toThrow(
      /aerial_check\.uuid/,
    );
  });

  it('builds owner-scoped aerial preview and overlay routes', () => {
    const id = '3fbd7f77-7d6b-4eb0-a1c7-b673f5a2f39f';
    expect(buildMobileAerialPreviewPath(id)).toBe(
      `/api/v1/mobile/assignments/${id}/aerial-preview`,
    );
    expect(buildMobileAerialOverlayPath(id)).toBe(
      `/api/v1/mobile/assignments/${id}/aerial-overlay`,
    );
    expect(buildMobileAerialPreviewUrl(id)).toBe(
      `http://127.0.0.1:8000/api/v1/mobile/assignments/${id}/aerial-preview`,
    );
    expect(buildMobileAerialOverlayUrl(id)).toBe(
      `http://127.0.0.1:8000/api/v1/mobile/assignments/${id}/aerial-overlay`,
    );
  });
});
