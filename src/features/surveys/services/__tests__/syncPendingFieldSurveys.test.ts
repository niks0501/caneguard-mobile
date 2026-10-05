import { findFieldSurveySyncCandidates } from '@/features/surveys/data/fieldSurveySyncRepository';
import { syncFieldSurvey } from '@/features/surveys/services/syncFieldSurvey';
import { syncPendingFieldSurveys } from '@/features/surveys/services/syncPendingFieldSurveys';

jest.mock('@/features/surveys/data/fieldSurveySyncRepository', () => ({
  findFieldSurveySyncCandidates: jest.fn(),
}));
jest.mock('@/features/surveys/services/syncFieldSurvey', () => ({
  syncFieldSurvey: jest.fn(),
}));

const options = {
  database: {} as never,
  ownerIdentity: 'owner-1',
  source: 'manual' as const,
  token: 'token-1',
};

describe('syncPendingFieldSurveys', () => {
  beforeEach(() => {
    jest.mocked(findFieldSurveySyncCandidates)
      .mockReturnValueOnce([{ clientUuid: 'survey-1', status: 'pending' }] as never)
      .mockReturnValue([]);
    jest.mocked(syncFieldSurvey).mockResolvedValue({ status: 'synced', remoteId: 'remote-1' });
  });

  it('uploads the owner-scoped candidate once and returns a report-compatible result', async () => {
    await expect(syncPendingFieldSurveys(options)).resolves.toMatchObject({
      attempted: 1,
      failed: 0,
      synced: 1,
      results: [{ reportId: 'survey-1', status: 'synced', remoteId: 'remote-1' }],
    });
    expect(findFieldSurveySyncCandidates).toHaveBeenCalledWith(
      options.database,
      'owner-1',
      10,
      expect.objectContaining({ includeRetryableFailed: true }),
    );
    expect(syncFieldSurvey).toHaveBeenCalledWith(expect.objectContaining({
      allowImmediateRetries: true,
      clientUuid: 'survey-1',
      ownerIdentity: 'owner-1',
      token: 'token-1',
    }));
  });

  it('coalesces concurrent runs for the same database, owner, and token', async () => {
    let resolveUpload: ((value: { status: 'synced'; remoteId: string }) => void) | undefined;
    jest.mocked(syncFieldSurvey).mockImplementation(() => new Promise((resolve) => { resolveUpload = resolve; }));
    const first = syncPendingFieldSurveys(options);
    const second = syncPendingFieldSurveys(options);
    expect(second).toBe(first);
    await new Promise((resolve) => setImmediate(resolve));
    expect(syncFieldSurvey).toHaveBeenCalledTimes(1);
    resolveUpload?.({ status: 'synced', remoteId: 'remote-1' });
    await expect(first).resolves.toMatchObject({ attempted: 1, synced: 1 });
  });
});
