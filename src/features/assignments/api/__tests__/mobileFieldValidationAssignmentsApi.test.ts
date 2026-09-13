import { ApiHttpError, apiRequest } from '@/features/shared/api/apiClient';
import { MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE } from '@/features/assignments/api/__fixtures__/mobileFieldValidationAssignmentsV1';
import {
  fetchAllMobileFieldValidationAssignments,
  MobileFieldValidationAssignmentsApiError,
} from '@/features/assignments/api/mobileFieldValidationAssignmentsApi';

jest.mock('@/features/shared/api/apiClient', () => ({
  ApiHttpError: class ApiHttpError extends Error {
    readonly status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
  apiRequest: jest.fn(),
}));

const request = jest.mocked(apiRequest);
const CHECKPOINT = '2026-08-13T12:05:00.000Z';

function page(data: readonly unknown[] = MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE.data, next: string | null = null, before = CHECKPOINT) {
  return { data, links: { next }, meta: { per_page: 100 }, sync: { before } };
}

describe('mobile field validation assignment API', () => {
  beforeEach(() => request.mockReset());

  it('parses the canonical owner-scoped assignment fixture', async () => {
    request.mockResolvedValueOnce(MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE);

    await expect(fetchAllMobileFieldValidationAssignments({ token: 'secure-token' })).resolves.toMatchObject({
      syncBefore: CHECKPOINT,
      assignments: [expect.objectContaining({
        id: '3fbd7f77-7d6b-4eb0-a1c7-b673f5a2f39f',
        reportUuid: '7e8c2e48-a2d4-4aca-9a50-9ca460fd7a7f',
        submitterIsAssignee: false,
        case: expect.objectContaining({ predictedLabel: 'rust' }),
      })],
    });
  });

  it('rejects a V1-only predicted label from the stable assignment contract', async () => {
    request.mockResolvedValueOnce(
      page([
        {
          ...MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE.data[0],
          case: {
            ...MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE.data[0].case,
            predicted_label: 'smut',
          },
        },
      ]),
    );

    await expect(
      fetchAllMobileFieldValidationAssignments({ token: 'secure-token' }),
    ).rejects.toMatchObject({ code: 'MALFORMED_RESPONSE' });
  });

  it('follows pagination with one stable checkpoint and rejects duplicates', async () => {
    const next = `http://127.0.0.1:8000/api/v1/mobile/assignments?cursor=next&sync_before=${encodeURIComponent(CHECKPOINT)}`;
    const second = {
      ...MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE.data[0],
      uuid: '9cc6a6a0-b20f-4ca8-bb7e-1a34cd191e0f',
      report_uuid: '1adf31c4-e9cb-4a8d-9650-9d2b86c06f6e',
    };
    request
      .mockResolvedValueOnce(page([MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE.data[0]], next))
      .mockResolvedValueOnce(page([second]));

    await expect(fetchAllMobileFieldValidationAssignments({ token: 'secure-token' })).resolves.toMatchObject({
      assignments: [expect.anything(), expect.anything()],
    });
    expect(request).toHaveBeenNthCalledWith(2, expect.stringContaining('/api/v1/mobile/assignments?cursor=next'), expect.objectContaining({ token: 'secure-token' }));

    request.mockReset().mockResolvedValueOnce(page([
      MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE.data[0],
      MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE.data[0],
    ]));
    await expect(fetchAllMobileFieldValidationAssignments({ token: 'secure-token' })).rejects.toMatchObject<Partial<MobileFieldValidationAssignmentsApiError>>({ code: 'MALFORMED_RESPONSE' });
  });

  it('rejects cross-origin continuation and changed checkpoints', async () => {
    request.mockResolvedValueOnce(page([], 'https://evil.example.test/api/v1/mobile/assignments'));
    await expect(fetchAllMobileFieldValidationAssignments({ token: 'secure-token' })).rejects.toMatchObject({ code: 'ORIGIN_MISMATCH' });

    request.mockReset();
    const next = `http://127.0.0.1:8000/api/v1/mobile/assignments?cursor=next&sync_before=${encodeURIComponent(CHECKPOINT)}`;
    request.mockResolvedValueOnce(page([], next)).mockResolvedValueOnce(page([], null, '2026-08-13T12:06:00.000Z'));
    await expect(fetchAllMobileFieldValidationAssignments({ token: 'secure-token' })).rejects.toMatchObject({ code: 'MALFORMED_RESPONSE' });
  });

  it.each([[401, 'AUTH_REQUIRED'], [403, 'CAPABILITY_UNAVAILABLE'], [404, 'CAPABILITY_UNAVAILABLE']] as const)(
    'maps HTTP %s to %s', async (status, code) => {
      request.mockRejectedValueOnce(new ApiHttpError(status, 'rejected'));
      await expect(fetchAllMobileFieldValidationAssignments({ token: 'secure-token' })).rejects.toMatchObject({ code });
    },
  );

  it('rejects malformed values before they reach the cache', async () => {
    request.mockResolvedValueOnce(page([{ ...MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE.data[0], submitter_is_assignee: 'false' }]));
    await expect(fetchAllMobileFieldValidationAssignments({ token: 'secure-token' })).rejects.toMatchObject({ code: 'MALFORMED_RESPONSE' });
  });
});
