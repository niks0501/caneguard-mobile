import { uploadMobileFieldValidationCompletion } from '@/features/assignments/api/mobileFieldValidationCompletionApi';
import type { FieldValidationCompletionUploadRecord } from '@/features/assignments/domain/fieldValidationCompletionTypes';
import { apiRequest } from '@/features/shared/api/apiClient';
import { uploadMobileReport } from '@/features/sync/api/mobileReportsApi';
import { submitFieldSurvey, type SubmitFieldSurveyPayload } from '@/features/surveys/api/fieldSurveysApi';

jest.mock('@/features/shared/api/apiClient', () => {
  const actual = jest.requireActual('@/features/shared/api/apiClient');
  return { ...actual, apiRequest: jest.fn() };
});

const RECEIVED_AT = '2026-11-13T09:00:00.000Z';

// Intent: Q1 "minimal receipt (ids only)": a resend of an already-accepted record is acknowledged as Sent from ids alone,
// even though the office returns no review data (the phone view is corrected to the server's first-landed record).
describe('ids-only replay receipts (NET-3)', () => {
  beforeEach(() => jest.mocked(apiRequest).mockReset());

  it('accepts a report receipt that carries only its identity', async () => {
    jest.mocked(apiRequest).mockResolvedValueOnce({
      identity: { uuid: 'server-report', client_uuid: 'client-report' },
      replayed: true,
      received_at: RECEIVED_AT,
    });
    await expect(uploadMobileReport(new FormData(), 'token')).resolves.toEqual({ remoteId: 'server-report' });
  });

  it('accepts a boundary receipt that carries only its id', async () => {
    jest.mocked(apiRequest).mockResolvedValueOnce({
      id: 'server-boundary',
      status: 'kept',
      replayed: true,
      received_at: RECEIVED_AT,
    });
    await expect(submitFieldSurvey({ client_uuid: 'client-boundary' } as SubmitFieldSurveyPayload, 'token')).resolves.toMatchObject({
      id: 'server-boundary',
      status: 'kept',
    });
  });

  it('accepts a visit receipt that carries only its completion identity', async () => {
    jest.mocked(apiRequest).mockResolvedValueOnce({
      data: { completion: { uuid: 'server-completion', client_uuid: 'client-completion' } },
      replayed: true,
      received_at: RECEIVED_AT,
    });
    await expect(
      uploadMobileFieldValidationCompletion(
        { completion: { id: 'client-completion', assignmentId: 'assignment-1' } } as unknown as FieldValidationCompletionUploadRecord,
        'token',
        new FormData(),
      ),
    ).resolves.toEqual({ remoteId: 'server-completion' });
  });
});
