import { requeueFailedFieldValidationCompletions } from '@/features/assignments/data/fieldValidationCompletionRepository';
import { requeueFailedFieldReports } from '@/features/reports/data/fieldReportSyncRepository';
import { requeueFailedFieldSurveys } from '@/features/surveys/data/fieldSurveySyncRepository';
import {
  ACCESS_FAILURE_SYNC_ERROR_CODES,
  RESENDABLE_SYNC_ERROR_CODES,
} from '@/features/sync/errors/syncErrors';
import { requeueFailedSends } from '@/features/sync/services/requeueFailedSends';

jest.mock('@/features/assignments/data/fieldValidationCompletionRepository', () => ({
  requeueFailedFieldValidationCompletions: jest.fn(async () => 1),
}));
jest.mock('@/features/reports/data/fieldReportSyncRepository', () => ({
  requeueFailedFieldReports: jest.fn(async () => 2),
}));
jest.mock('@/features/surveys/data/fieldSurveySyncRepository', () => ({
  requeueFailedFieldSurveys: jest.fn(() => 4),
}));

const database = {} as never;

describe('requeueFailedSends', () => {
  beforeEach(() => jest.clearAllMocks());

  it('re-queues only sign-in and access failures after a fresh grant', async () => {
    await expect(requeueFailedSends(database, 'owner-1', 'access')).resolves.toBe(7);

    for (const mock of [
      requeueFailedFieldReports,
      requeueFailedFieldSurveys,
      requeueFailedFieldValidationCompletions,
    ]) {
      expect(mock).toHaveBeenCalledWith(database, 'owner-1', ACCESS_FAILURE_SYNC_ERROR_CODES);
    }
    expect(ACCESS_FAILURE_SYNC_ERROR_CODES).toEqual([
      'AUTH_REQUIRED',
      'API_FORBIDDEN',
      'CAPABILITY_REVOKED',
    ]);
  });

  it('"send all again" re-queues every failure that resending can fix', async () => {
    await requeueFailedSends(database, 'owner-1', 'all');

    expect(requeueFailedFieldReports).toHaveBeenCalledWith(
      database,
      'owner-1',
      RESENDABLE_SYNC_ERROR_CODES,
    );
    expect(RESENDABLE_SYNC_ERROR_CODES).toEqual(
      expect.arrayContaining(['AUTH_REQUIRED', 'CAPABILITY_REVOKED', 'SERVER_ERROR']),
    );
    for (const hopeless of ['CLIENT_UUID_CONFLICT', 'IMAGE_MISSING', 'INVALID_LOCAL_RECORD', 'VISIT_CANCELLED']) {
      expect(RESENDABLE_SYNC_ERROR_CODES).not.toContain(hopeless);
    }
  });
});
