import { countCoolingRetryableFieldSurveys, countUnsyncedFieldSurveys, findFieldSurveySyncCandidates } from '@/features/surveys/data/fieldSurveySyncRepository';
import { syncFieldSurvey } from '@/features/surveys/services/syncFieldSurvey';
import { syncPendingFieldSurveys } from '@/features/surveys/services/syncPendingFieldSurveys';

jest.mock('@/features/surveys/data/fieldSurveySyncRepository', () => ({
  countCoolingRetryableFieldSurveys: jest.fn(() => 0),
  countUnsyncedFieldSurveys: jest.fn(),
  findFieldSurveySyncCandidates: jest.fn(),
  resetStaleSyncingFieldSurveys: jest.fn(),
}));
jest.mock('@/features/surveys/services/syncFieldSurvey', () => ({
  syncFieldSurvey: jest.fn(),
}));

const options = {
  database: {} as never,
  districtCode: 'D-01',
  districtVerified: true,
  ownerIdentity: 'owner-1',
  source: 'manual' as const,
  token: 'token-1',
};

const countWaiting = jest.mocked(countUnsyncedFieldSurveys);

describe('syncPendingFieldSurveys', () => {
  beforeEach(() => {
    countWaiting.mockReturnValue(1);
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
      districtCode: 'D-01',
      ownerIdentity: 'owner-1',
      token: 'token-1',
    }));
  });

  // R12: a retryable boundary still cooling down is held work, not an empty queue.
  it('keeps a retry scheduled while a retryable boundary is still in its cooldown', async () => {
    jest.mocked(findFieldSurveySyncCandidates).mockReset().mockReturnValue([]);
    jest.mocked(countCoolingRetryableFieldSurveys).mockReturnValueOnce(1);
    await expect(syncPendingFieldSurveys({ ...options, source: 'startup' })).resolves.toMatchObject({
      attempted: 0,
      haltReason: 'transient-blocker',
    });
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

  // Intent (item 8): a boundary is only uploaded with the account district. While the account
  // is still being verified, queued work waits and retries even when nothing is eligible yet
  // (a boundary inside its retry cooldown); once verification says the account has no district,
  // nothing is retried and nothing is sent empty.
  it('defers queued uploads until the district is known, then stops retrying', async () => {
    jest.mocked(findFieldSurveySyncCandidates).mockReset();
    jest.mocked(findFieldSurveySyncCandidates).mockReturnValue([]);
    countWaiting.mockReturnValue(1);

    await expect(
      syncPendingFieldSurveys({ ...options, districtCode: '', districtVerified: false }),
    ).resolves.toMatchObject({ attempted: 0, failed: 0, haltReason: 'transient-blocker', synced: 0 });
    expect(syncFieldSurvey).not.toHaveBeenCalled();

    await expect(
      syncPendingFieldSurveys({ ...options, districtCode: '', districtVerified: true }),
    ).resolves.toMatchObject({ attempted: 0, failed: 0, haltReason: 'empty', synced: 0 });
    expect(syncFieldSurvey).not.toHaveBeenCalled();
  });

  it('does not ask for a retry when no boundary is waiting', async () => {
    jest.mocked(findFieldSurveySyncCandidates).mockReset();
    jest.mocked(findFieldSurveySyncCandidates).mockReturnValue([]);
    countWaiting.mockReturnValue(0);

    await expect(
      syncPendingFieldSurveys({ ...options, districtCode: '', districtVerified: false }),
    ).resolves.toMatchObject({ attempted: 0, failed: 0, haltReason: 'empty', synced: 0 });
  });
});
