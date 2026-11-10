import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE } from '@/features/assignments/api/__fixtures__/mobileFieldValidationAssignmentsV1';
import { fetchAllMobileFieldValidationAssignments } from '@/features/assignments/api/mobileFieldValidationAssignmentsApi';
import { apiRequest } from '@/features/shared/api/apiClient';

jest.mock('@/features/shared/api/apiClient', () => ({
  apiRequest: jest.fn(),
}));

const request = jest.mocked(apiRequest);

interface AssignmentArtifact {
  contract: string;
  version: number;
  wire: {
    method: string;
    path: string;
    optional_request_capabilities?: { request_parameter: string; values: string[] };
  };
  fields: Record<string, unknown>;
  caseProperties: Record<string, unknown>;
}

function readArtifact(): AssignmentArtifact {
  const artifact = JSON.parse(
    readFileSync(
      join(process.cwd(), 'references/mobile-field-validation-assignment-v2.json'),
      'utf8',
    ),
  ) as { contract: string; version: number; wire: { method: string; path: string }; fields: Record<string, unknown> };
  const caseField = artifact.fields.case as { properties: Record<string, unknown> };
  return { ...artifact, caseProperties: caseField.properties };
}

describe('mobile-field-validation-assignment-v2 producer contract', () => {
  it('evaluates the mobile parser against the web-owned artifact', async () => {
    const artifact = readArtifact();
    const fixture = MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE;
    request.mockResolvedValueOnce(fixture);

    expect(artifact.contract).toBe('mobile-field-validation-assignment-v2');
    expect(artifact.version).toBe(2);
    expect(artifact.wire).toMatchObject({
      method: 'GET',
      path: '/api/v1/mobile/assignments',
    });
    // The office delivers a scanless row only to a request that asks for the capability.
    expect(artifact.wire.optional_request_capabilities).toMatchObject({
      request_parameter: 'supports',
      values: ['no_ai_scan'],
    });
    const previousVisit = artifact.fields.previous_visit as {
      required_keys: string[];
      properties: Record<string, unknown>;
    };
    expect(previousVisit.required_keys).toContain('follow_up_outcome');
    expect(previousVisit.properties).toHaveProperty('follow_up_outcome');
    expect(Object.keys(fixture.data[0])).toEqual(Object.keys(artifact.fields));

    await expect(fetchAllMobileFieldValidationAssignments({ token: 'contract-token' })).resolves.toMatchObject({
      assignments: [expect.objectContaining({
        id: fixture.data[0].uuid,
        reportUuid: fixture.data[0].report_uuid,
        targetVisitDate: fixture.data[0].target_visit_date,
      })],
    });
    expect(request).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/mobile/assignments'),
      expect.objectContaining({ token: 'contract-token' }),
    );
    expect(String(request.mock.calls[0][0])).toContain('supports=no_ai_scan');
  });

  it('parses a scanless office row the artifact declares', async () => {
    const artifact = readArtifact();
    expect(artifact.caseProperties.predicted_label).toMatchObject({ nullable: true });
    expect(artifact.caseProperties.confidence).toMatchObject({ nullable: true });

    const fieldBornRow = MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE.data[0];
    // A scanless office row omits both AI fields entirely.
    const officeCase: Record<string, unknown> = { ...fieldBornRow.case };
    delete officeCase.predicted_label;
    delete officeCase.confidence;
    officeCase.origin = 'office';
    officeCase.version = 3;
    officeCase.status = {
      workflow_status: 'assigned',
      case_state: 'open',
      review_status: 'pending',
      updated_at: '2026-08-13T12:00:00.000Z',
    };
    officeCase.reporter_concern = {
      suspected_condition: 'Rust',
      observation_text: 'Orange pustules on the lower leaves.',
    };
    officeCase.photo = {
      url: 'https://api.example.test/api/v1/mobile/assignments/x/report-photo',
      content_type: 'image/jpeg',
      bytes: 4096,
    };
    // The fixture stays inside the artifact's office projection.
    expect(Object.keys(officeCase).filter((key) => !(key in artifact.caseProperties))).toEqual([]);

    request.mockResolvedValueOnce({
      ...MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE,
      data: [{ ...fieldBornRow, case: officeCase }],
    });

    const { assignments } = await fetchAllMobileFieldValidationAssignments({ token: 'contract-token' });
    expect(assignments[0].case.predictedLabel).toBeNull();
    expect(assignments[0].case.confidence).toBeNull();
    expect(assignments[0].officeCase).toEqual({
      version: 3,
      status: {
        workflowStatus: 'assigned',
        caseState: 'open',
        reviewStatus: 'pending',
        updatedAt: '2026-08-13T12:00:00.000Z',
      },
      reporterConcern: {
        suspectedCondition: 'Rust',
        observationText: 'Orange pustules on the lower leaves.',
      },
      photo: { contentType: 'image/jpeg', bytes: 4096 },
    });
  });
});
