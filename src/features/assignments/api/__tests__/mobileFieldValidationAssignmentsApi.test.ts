import { ApiHttpError, apiRequest } from '@/features/shared/api/apiClient';
import { MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE } from '@/features/assignments/api/__fixtures__/mobileFieldValidationAssignmentsV1';
import {
  buildMobilePreviousEvidencePhotoPath,
  buildMobilePreviousEvidencePhotoUrl,
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
  buildApiUrl: (path: string) => `http://127.0.0.1:8000${path}`,
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
        previousVisit: null,
      })],
    });
  });

  it('parses the optional previous visit block and tolerates a missing block as null', async () => {
    const previousVisit = {
      reference_code: 'CG-2026-0000',
      visited_at: '2026-09-10T08:30:00.000Z',
      reporter_suspected_condition: 'RSSI',
      authority_classified_condition: 'RSSI',
      action_taken: 'Previous action',
      follow_up_outcome: 'improved',
      field_observation: 'Previous observation',
      field_finding: 'Previous finding',
      fresh_photo_available: true,
    };
    const { previous_visit: _ignored, ...withoutPreviousVisit } = MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE.data[0];
    request.mockResolvedValueOnce(page([{ ...withoutPreviousVisit, previous_visit: previousVisit }]));

    await expect(fetchAllMobileFieldValidationAssignments({ token: 'secure-token' })).resolves.toMatchObject({
      assignments: [expect.objectContaining({
        previousVisit: {
          referenceCode: 'CG-2026-0000',
          visitedAt: '2026-09-10T08:30:00.000Z',
          reporterSuspectedCondition: 'RSSI',
          authorityClassifiedCondition: 'RSSI',
          actionTaken: 'Previous action',
          followUpOutcome: 'improved',
          fieldObservation: 'Previous observation',
          fieldFinding: 'Previous finding',
          freshPhotoAvailable: true,
        },
      })],
    });

    request.mockResolvedValueOnce(page([{ ...withoutPreviousVisit, previous_visit: { ...previousVisit, follow_up_outcome: null } }]));
    await expect(fetchAllMobileFieldValidationAssignments({ token: 'secure-token' })).resolves.toMatchObject({
      assignments: [expect.objectContaining({ previousVisit: expect.objectContaining({ followUpOutcome: null }) })],
    });

    request.mockResolvedValueOnce(page([withoutPreviousVisit]));
    await expect(fetchAllMobileFieldValidationAssignments({ token: 'secure-token' })).resolves.toMatchObject({
      assignments: [expect.objectContaining({ previousVisit: null })],
    });
  });

  it('builds the owner-scoped previous evidence photo route', () => {
    const assignmentId = '3fbd7f77-7d6b-4eb0-a1c7-b673f5a2f39f';
    expect(buildMobilePreviousEvidencePhotoPath(assignmentId)).toBe(
      `/api/v1/mobile/assignments/${assignmentId}/previous-evidence-photo`,
    );
    expect(buildMobilePreviousEvidencePhotoUrl(assignmentId)).toBe(
      `http://127.0.0.1:8000/api/v1/mobile/assignments/${assignmentId}/previous-evidence-photo`,
    );
  });

  it('accepts a Smut Model V1 prediction in the assignment contract', async () => {
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
    ).resolves.toMatchObject({
      assignments: [expect.objectContaining({
        case: expect.objectContaining({ predictedLabel: 'smut' }),
      })],
    });
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
  // Proves L1: an unknown enum leaves the rest of the feed refreshed.
  it('parses an unknown predicted_label as unknown and keeps the rest of the feed', async () => {
    const first = MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE.data[0];
    const second = {
      ...first,
      uuid: '9cc6a6a0-b20f-4ca8-bb7e-1a34cd191e0f',
      report_uuid: '1adf31c4-e9cb-4a8d-9650-9d2b86c06f6e',
      case: { ...first.case, predicted_label: 'blight' },
    };
    request.mockResolvedValueOnce(page([first, second]));

    const result = await fetchAllMobileFieldValidationAssignments({ token: 'secure-token' });
    expect(result.skippedCount).toBe(0);
    expect(result.assignments.map((a) => a.case.predictedLabel)).toEqual(['rust', 'unknown']);
  });

  // Proves L1: an unknown enum leaves the rest of the feed refreshed (state vocabulary, counted for the banner).
  it('skips and counts a record with an unknown field_validation_state without failing the feed', async () => {
    const first = MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE.data[0];
    const second = {
      ...first,
      uuid: '9cc6a6a0-b20f-4ca8-bb7e-1a34cd191e0f',
      report_uuid: '1adf31c4-e9cb-4a8d-9650-9d2b86c06f6e',
      field_validation_state: 'escalated',
    };
    request.mockResolvedValueOnce(page([second, first]));

    const result = await fetchAllMobileFieldValidationAssignments({ token: 'secure-token' });
    expect(result.skippedCount).toBe(1);
    expect(result.assignments).toHaveLength(1);
  });

  // Proves L1: a broken identity still fails loudly when the duplicate is skipped for its vocabulary.
  it('rejects duplicate identities across pages before vocabulary filtering', async () => {
    const first = MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE.data[0];
    const next = `http://127.0.0.1:8000/api/v1/mobile/assignments?cursor=next&sync_before=${encodeURIComponent(CHECKPOINT)}`;
    request
      .mockResolvedValueOnce(page([{ ...first, field_validation_state: 'escalated' }], next))
      .mockResolvedValueOnce(page([first]));

    await expect(fetchAllMobileFieldValidationAssignments({ token: 'secure-token' })).rejects.toMatchObject({
      code: 'MALFORMED_RESPONSE',
      message: expect.stringContaining(`record reference ${first.reference_code}`),
    });

    request.mockReset().mockResolvedValueOnce(page([
      first,
      {
        ...first,
        uuid: '9cc6a6a0-b20f-4ca8-bb7e-1a34cd191e0f',
        field_validation_state: 'escalated',
      },
    ]));
    await expect(fetchAllMobileFieldValidationAssignments({ token: 'secure-token' })).rejects.toMatchObject({
      code: 'MALFORMED_RESPONSE',
    });
  });

  // Proves L1: an unknown previous_visit outcome must not block the feed either.
  it('tolerates an unknown previous_visit follow_up_outcome without failing the feed', async () => {
    const first = MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE.data[0];
    const previousVisit = {
      reference_code: 'CG-2026-0000',
      visited_at: '2026-09-10T08:30:00.000Z',
      reporter_suspected_condition: null,
      authority_classified_condition: null,
      action_taken: 'Previous action',
      follow_up_outcome: 'partially_resolved',
      field_observation: null,
      field_finding: null,
      fresh_photo_available: false,
    };
    const second = {
      ...first,
      uuid: '9cc6a6a0-b20f-4ca8-bb7e-1a34cd191e0f',
      report_uuid: '1adf31c4-e9cb-4a8d-9650-9d2b86c06f6e',
      previous_visit: previousVisit,
    };
    request.mockResolvedValueOnce(page([second, first]));

    const result = await fetchAllMobileFieldValidationAssignments({ token: 'secure-token' });
    expect(result.assignments).toHaveLength(2);
    expect(result.assignments[0].previousVisit).toMatchObject({
      referenceCode: 'CG-2026-0000',
      followUpOutcome: null,
    });
  });

  // Proves L1: a malformed identity fails loudly and names the item.
  it('fails loudly naming the record reference code and field when an identity is malformed', async () => {
    const first = MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE.data[0];
    request.mockResolvedValueOnce(page([{ ...first, report_uuid: 'not-a-uuid' }]));

    await expect(fetchAllMobileFieldValidationAssignments({ token: 'secure-token' })).rejects.toMatchObject({
      code: 'MALFORMED_RESPONSE',
      message: expect.stringContaining(`report_uuid`),
    });
    request.mockResolvedValueOnce(page([{ ...first, report_uuid: 'not-a-uuid' }]));
    await expect(fetchAllMobileFieldValidationAssignments({ token: 'secure-token' })).rejects.toThrow(
      `record reference ${first.reference_code}`,
    );
  });

  // Proves L1 (review-1): malformed shape fails the refresh even when the record's state is unknown.
  it('fails loudly for an unknown-state record that is also missing its case', async () => {
    const { case: _case, ...withoutCase } = MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE.data[0];
    request.mockResolvedValueOnce(page([{ ...withoutCase, field_validation_state: 'escalated' }]));
    await expect(fetchAllMobileFieldValidationAssignments({ token: 'secure-token' })).rejects.toMatchObject({
      code: 'MALFORMED_RESPONSE',
      message: expect.stringContaining('case'),
    });
  });

  // Proves L1 (review-4): a broken identity (same UUID in different letter case) fails loudly even across a skipped record.
  it('treats UUIDs that differ only by letter case as duplicate identities', async () => {
    const first = MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE.data[0];
    const second = {
      ...first,
      uuid: first.uuid.toUpperCase(),
      report_uuid: '1adf31c4-e9cb-4a8d-9650-9d2b86c06f6e',
      field_validation_state: 'escalated',
    };
    request.mockResolvedValueOnce(page([second, first]));
    await expect(fetchAllMobileFieldValidationAssignments({ token: 'secure-token' })).rejects.toMatchObject({
      code: 'MALFORMED_RESPONSE',
    });
  });
});
