import { apiRequest } from '@/features/shared/api/apiClient';
import { MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE } from '@/features/assignments/api/__fixtures__/mobileFieldValidationAssignmentsV1';
import {
  buildMobileReportPhotoPath,
  fetchAllMobileFieldValidationAssignments,
} from '@/features/assignments/api/mobileFieldValidationAssignmentsApi';

jest.mock('@/features/shared/api/apiClient', () => ({
  ApiHttpError: class ApiHttpError extends Error {},
  apiRequest: jest.fn(),
  buildApiUrl: (path: string) => `http://127.0.0.1:8000${path}`,
}));

const request = jest.mocked(apiRequest);
const BASE = MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE.data[0];
const ID = BASE.uuid;

const OFFICE_PROJECTION = {
  origin: 'office',
  version: 4,
  status: {
    workflow_status: 'assigned',
    case_state: 'open',
    review_status: 'pending',
    updated_at: '2026-08-13T12:00:00.000Z',
  },
  reporter_concern: { suspected_condition: 'Rust', observation_text: 'Orange spots' },
  photo: { url: '/api/v1/mobile/assignments/x/report-photo', content_type: 'image/jpeg', bytes: 2048 },
};

function feed(caseExtras: Record<string, unknown>) {
  return {
    data: [{ ...BASE, case: { ...BASE.case, ...caseExtras } }],
    links: { next: null },
    meta: { per_page: 100 },
    sync: { before: '2026-08-13T12:05:00.000Z' },
  };
}

describe('office case projection parsing', () => {
  beforeEach(() => request.mockReset());

  // Proves L4: an office case carries its concern, status, version and photo reference onto the phone.
  it('parses the office projection and ignores the server-provided photo url', async () => {
    request.mockResolvedValueOnce(feed(OFFICE_PROJECTION));
    const { assignments } = await fetchAllMobileFieldValidationAssignments({ token: 't' });

    expect(assignments[0].officeCase).toEqual({
      version: 4,
      status: { workflowStatus: 'assigned', caseState: 'open', reviewStatus: 'pending', updatedAt: '2026-08-13T12:00:00.000Z' },
      reporterConcern: { suspectedCondition: 'Rust', observationText: 'Orange spots' },
      photo: { contentType: 'image/jpeg', bytes: 2048 },
    });
    expect(buildMobileReportPhotoPath(ID)).toBe(`/api/v1/mobile/assignments/${ID}/report-photo`);
  });

  // Proves L4: no photo is a null reference (empty state), never an error.
  it('reads a missing photo as null', async () => {
    request.mockResolvedValueOnce(feed({ ...OFFICE_PROJECTION, photo: null }));
    const { assignments } = await fetchAllMobileFieldValidationAssignments({ token: 't' });
    expect(assignments[0].officeCase?.photo).toBeNull();
  });

  // Proves L4: a field case parses exactly as before, with no office case.
  it('leaves field-born rows without an office case and without a previous-visit photo key', async () => {
    request.mockResolvedValueOnce(feed({}));
    const { assignments } = await fetchAllMobileFieldValidationAssignments({ token: 't' });
    expect(assignments[0].officeCase).toBeNull();
  });

  // Proves L10: a scanless office row (no predicted_label/confidence) parses with null AI fields.
  it('parses an office row with no AI prediction', async () => {
    const extras = { ...OFFICE_PROJECTION, predicted_label: null, confidence: null };
    request.mockResolvedValueOnce(feed(extras));
    const { assignments } = await fetchAllMobileFieldValidationAssignments({ token: 't' });
    expect(assignments[0].case.predictedLabel).toBeNull();
    expect(assignments[0].case.confidence).toBeNull();
    expect(assignments[0].officeCase?.status.workflowStatus).toBe('assigned');
  });

  // Proves L10: a field-born row must still carry its AI prediction.
  it('still rejects a field-born row with no AI prediction', async () => {
    request.mockResolvedValueOnce(feed({ predicted_label: null, confidence: null }));
    await expect(fetchAllMobileFieldValidationAssignments({ token: 't' })).rejects.toThrow(/predicted_label/);
  });

  // Proves L4: a broken office projection fails loudly and names the record.
  it('rejects an office row whose projection is malformed and names the record', async () => {
    request.mockResolvedValueOnce(feed({ ...OFFICE_PROJECTION, status: null }));
    await expect(fetchAllMobileFieldValidationAssignments({ token: 't' })).rejects.toThrow(
      /case\.status.*CG-2026-0001/,
    );
  });
});
