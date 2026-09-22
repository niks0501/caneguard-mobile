import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE } from '@/features/assignments/api/__fixtures__/mobileFieldValidationAssignmentsV1';
import { fetchAllMobileFieldValidationAssignments } from '@/features/assignments/api/mobileFieldValidationAssignmentsApi';
import { apiRequest } from '@/features/shared/api/apiClient';

jest.mock('@/features/shared/api/apiClient', () => ({
  apiRequest: jest.fn(),
}));

const request = jest.mocked(apiRequest);

describe('mobile-field-validation-assignment-v1 producer contract', () => {
  it('evaluates the mobile parser against the web-owned artifact', async () => {
    const artifact = JSON.parse(
      readFileSync(
        join(process.cwd(), 'references/mobile-field-validation-assignment-v1.json'),
        'utf8',
      ),
    ) as {
      contract: string;
      version: number;
      wire: { method: string; path: string };
      fields: Record<string, unknown>;
    };
    const fixture = MOBILE_FIELD_VALIDATION_ASSIGNMENTS_V1_FIXTURE;
    request.mockResolvedValueOnce(fixture);

    expect(artifact.contract).toBe('mobile-field-validation-assignment-v1');
    expect(artifact.version).toBe(1);
    expect(artifact.wire).toMatchObject({
      method: 'GET',
      path: '/api/v1/mobile/assignments',
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
  });
});
